// AnyLang Collaborative Web Editor Server
//
// The server holds ONE canonical AnyLang source document. Every client views
// and edits a projection of that document in their own chosen dialect
// (JavaScript, Rust, C#, Java). When a client edits, their dialect text is
// parsed back into the canonical AST (AnyLang's pidgin grammar accepts all of
// these idioms), and the new AST is re-projected and pushed to every other
// client in *their* dialect - instantly, over Socket.IO.

const path = require("path");
const fs = require("fs");
const http = require("http");
const vm = require("vm");
const express = require("express");
const { Server } = require("socket.io");
const { parse, run, runAST, transpile, runtime, formatDialect, CodebaseStore } = require("../src/index.js");

const PORT = process.env.PORT || 3000;

// Dialects that can be parsed back into the canonical AST (round-trip safe).
// "pythonic" is excluded because AnyLang strictly requires Allman braces.
const DIALECTS = ["javascript", "rust", "csharp", "java"];

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// --- Canonical document state -------------------------------------------------
let canonical = fs.readFileSync(path.join(__dirname, "..", "examples", "03_factorial_fibonacci.al"), "utf8");
let canonicalAST = parse(canonical);

function project(dialect) {
  return formatDialect(canonicalAST, dialect);
}

// --- Presence -----------------------------------------------------------------
const COLORS = ["#f14c4c", "#4ec9b0", "#dcdcaa", "#569cd6", "#c586c0", "#ce9178", "#9cdcfe", "#b5cea8"];
let colorIdx = 0;
const users = new Map(); // socketId -> { id, name, dialect, color }

function userList() {
  return [...users.values()];
}

function broadcastUsers() {
  io.emit("users", userList());
}

// --- Execution ----------------------------------------------------------------
function makeCaptureCtx() {
  const lines = [];
  const log = (...a) => lines.push(a.map((v) => String(v)).join(" "));
  return {
    lines,
    ctx: {
      print: log,
      println: log,
      echo: log,
      puts: log,
      printf: log,
      console: { log },
      System: { out: { println: log, print: log } },
      fmt: { Println: log, Print: log, Printf: log },
    },
  };
}

function runCanonical() {
  const { lines, ctx } = makeCaptureCtx();
  try {
    run(canonical, ctx);
  } catch (err) {
    lines.push("Runtime Error: " + (err.message || err));
  }
  return lines.join("\n");
}

// --- Unison Codebase Terminal ---------------------------------------------------
// An in-browser terminal that ONLY accepts AnyLang CLI commands (whitelisted),
// backed by the same content-addressed SQLite codebase as `node src/cli.js`.
const store = new CodebaseStore();
const TERMINAL_COMMANDS = ["help", "ls", "add", "show", "diff", "rename", "run-term"];

function parseArg(val) {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function resolveTerm(target) {
  const isHash = target.startsWith("#") || (target.length >= 8 && /^[0-9a-f]+$/i.test(target));
  const term = isHash ? store.getTermByHash(target) : store.getTermByName(target);
  if (!term) throw new Error(`Term '${target}' not found in codebase.`);
  return term;
}

function extractToFlag(args, fallback) {
  const toIdx = args.indexOf("--to");
  let dialect = fallback;
  if (toIdx !== -1 && args[toIdx + 1]) {
    dialect = args[toIdx + 1];
    args.splice(toIdx, 2);
  }
  return dialect;
}

function execTerminal(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { text: "" };
  const cmd = tokens[0].toLowerCase();
  let args = tokens.slice(1);

  if (!TERMINAL_COMMANDS.includes(cmd)) {
    return {
      text: `Unknown or disallowed command: '${cmd}'\n` + `This terminal only accepts AnyLang CLI commands:\n  ` + TERMINAL_COMMANDS.join(", "),
    };
  }

  switch (cmd) {
    case "help":
      return {
        text: [
          "AnyLang Unison Terminal — available commands:",
          "  add                     Save all functions/variables of the shared document",
          "                            into the content-addressed SQLite codebase",
          "  ls                      List all terms with their content hashes",
          "  show <name|#hash> [--to dialect]",
          "                            Project a stored term into a dialect",
          "                            (javascript, rust, csharp, java, pythonic)",
          "  diff <a> <b> [--to dialect]",
          "                            Semantic AST diff between two terms — dialect",
          "                            noise (def vs fn, give vs return) is ignored",
          "  rename <old> <new>      Zero-break alias rename (hash never changes)",
          "  run-term <name|#hash> [args...]",
          "                            Execute a stored term (with optional arguments)",
        ].join("\n"),
      };

    case "add": {
      const saved = store.saveProgram(canonicalAST);
      if (saved.length === 0) return { text: "No top-level functions/variables found in the shared document." };
      return {
        text: `Added ${saved.length} term(s) to the codebase:\n` + saved.map((t) => `  + [${t.kind}] ${t.name.padEnd(20)} -> ${t.shortHash}`).join("\n"),
      };
    }

    case "ls": {
      const terms = store.listTerms();
      if (terms.length === 0) return { text: "No terms found in codebase. Try 'add' first." };
      return {
        text: `Codebase Terms (${terms.length}):\n` + terms.map((t) => `  [${t.kind}] ${t.name.padEnd(20)} ${t.shortHash}`).join("\n"),
      };
    }

    case "show": {
      if (!args[0]) return { text: "Usage: show <name|#hash> [--to dialect]" };
      const dialect = extractToFlag(args, "javascript");
      const term = resolveTerm(args[0]);
      return {
        text: `// ${term.name} | ${term.shortHash} | projected to: ${dialect}\n` + formatDialect(term.ast, dialect),
      };
    }

    case "diff": {
      if (!args[0] || !args[1]) return { text: "Usage: diff <a> <b> [--to dialect]" };
      const dialect = extractToFlag(args, "javascript");
      const a = resolveTerm(args[0]);
      const b = resolveTerm(args[1]);
      const identical = a.hash === b.hash;
      if (identical) {
        return { text: `✨ '${a.name}' and '${b.name}' are semantically identical (${a.shortHash})!` };
      }
      const { diffPrograms } = require("../src/index.js");
      const { differences } = diffPrograms(a.ast, b.ast, a.name, b.name);
      return {
        text:
          `Found ${differences.length} semantic difference(s):\n` +
          differences.map((d) => `  ~ ${d.path}\n      a: ${d.a}\n      b: ${d.b}`).join("\n") +
          `\n\n--- Side-by-side (--to ${dialect}) ---\n\n// a: ${a.name} (${a.shortHash})\n` +
          formatDialect(a.ast, dialect) +
          `\n\n// b: ${b.name} (${b.shortHash})\n` +
          formatDialect(b.ast, dialect),
      };
    }

    case "rename": {
      if (!args[0] || !args[1]) return { text: "Usage: rename <old> <new>" };
      store.renameTerm(args[0], args[1]);
      return { text: `Renamed alias '${args[0]}' -> '${args[1]}'. Content hash unchanged!` };
    }

    case "run-term": {
      if (!args[0]) return { text: "Usage: run-term <name|#hash> [args...]" };
      const term = resolveTerm(args[0]);
      const fnArgs = args.slice(1).map(parseArg);
      const { lines, ctx } = makeCaptureCtx();
      try {
        const jsCode = transpile(term.ast);
        const sandbox = { ...runtime, ...ctx };
        vm.createContext(sandbox);
        vm.runInContext(jsCode, sandbox);

        if (fnArgs.length > 0 && typeof sandbox[term.name] === "function") {
          const result = sandbox[term.name](...fnArgs);
          if (result !== undefined) {
            lines.push(`=> ${typeof result === "object" ? JSON.stringify(result) : result}`);
          }
        }
      } catch (err) {
        lines.push("Runtime Error: " + (err.message || err));
      }
      return { text: `▶ ${term.name} (${term.shortHash})\n` + (lines.join("\n") || "(no output)") };
    }
  }
  return { text: "" };
}

// --- Socket.IO ----------------------------------------------------------------
io.on("connection", (socket) => {
  socket.on("join", ({ name, dialect } = {}) => {
    if (!DIALECTS.includes(dialect)) dialect = "javascript";
    const user = {
      id: socket.id,
      name: (name || "Anonymous").toString().slice(0, 24),
      dialect,
      color: COLORS[colorIdx++ % COLORS.length],
    };
    users.set(socket.id, user);
    socket.emit("init", { code: project(dialect), dialect, self: user, users: userList() });
    socket.broadcast.emit("users", userList());
  });

  // Full-text edit in the sender's own dialect. Parse it back to the canonical
  // AST; on success re-project for everyone else.
  socket.on("edit", ({ code } = {}, ack) => {
    const user = users.get(socket.id);
    if (!user || typeof code !== "string") return;
    try {
      const ast = parse(code);
      canonical = code;
      canonicalAST = ast;
      if (ack) ack({ ok: true });
      for (const [id, other] of users) {
        if (id === socket.id) continue;
        io.to(id).emit("doc", { code: project(other.dialect), from: user });
      }
    } catch (err) {
      if (ack) ack({ ok: false, error: (err.message || String(err)).split("\n")[0] });
    }
  });

  socket.on("dialect", ({ dialect } = {}) => {
    const user = users.get(socket.id);
    if (!user || !DIALECTS.includes(dialect)) return;
    user.dialect = dialect;
    socket.emit("doc", { code: project(dialect) });
    broadcastUsers();
  });

  socket.on("run", () => {
    const user = users.get(socket.id);
    io.emit("output", { text: runCanonical(), by: user ? user.name : "?" });
  });

  // Unison Terminal: accepts ONLY whitelisted AnyLang CLI commands. Both the
  // command and its result are broadcast to everyone in the session, so all
  // collaborators see codebase activity (hashes, diffs, projections) live.
  socket.on("terminal", ({ command } = {}) => {
    const user = users.get(socket.id);
    if (!user || typeof command !== "string" || command.length > 500) return;
    let result;
    try {
      result = execTerminal(command);
    } catch (err) {
      result = { text: "Error: " + (err.message || err) };
    }
    io.emit("terminal-output", {
      command: command.slice(0, 200),
      text: result.text,
      by: user.name,
      clear: false,
    });
  });

  socket.on("disconnect", () => {
    if (users.delete(socket.id)) broadcastUsers();
  });
});

server.listen(PORT, () => {
  console.log(`AnyLang collaborative editor running at http://localhost:${PORT}`);
});
