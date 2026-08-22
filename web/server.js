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
const express = require("express");
const { Server } = require("socket.io");
const { parse, run, formatDialect } = require("../src/index.js");

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
function runCanonical() {
  const lines = [];
  const log = (...a) => lines.push(a.map((v) => String(v)).join(" "));
  const ctx = {
    print: log,
    println: log,
    echo: log,
    puts: log,
    printf: log,
    console: { log },
    System: { out: { println: log, print: log } },
    fmt: { Println: log, Print: log, Printf: log },
  };
  try {
    run(canonical, ctx);
  } catch (err) {
    lines.push("Runtime Error: " + (err.message || err));
  }
  return lines.join("\n");
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

  socket.on("disconnect", () => {
    if (users.delete(socket.id)) broadcastUsers();
  });
});

server.listen(PORT, () => {
  console.log(`AnyLang collaborative editor running at http://localhost:${PORT}`);
});
