// End-to-end test for the web Unison Terminal
process.env.PORT = "3210";
const { io } = require("socket.io-client");
require("../web/server.js");

const results = [];
let step = 0;
const script = [
  { as: "a", cmd: "help", expect: /add\s+Save|available commands/i },
  { as: "a", cmd: "add", expect: /Added 3 term|Added \d+ term/ },
  { as: "b", cmd: "ls", expect: /factorial/ },
  { as: "b", cmd: "show factorial --to rust", expect: /fn factorial/ },
  { as: "a", cmd: "diff factorial fibonacci --to csharp", expect: /semantic difference|identical/i },
  { as: "b", cmd: "run-term factorial 5", expect: /=> 120/ },
  { as: "a", cmd: "run-term fibonacci 6", expect: /=> 8/ },
  { as: "a", cmd: "rm -rf /", expect: /disallowed/i },
  { as: "b", cmd: "rename factorial fact", expect: /Renamed alias/ },
  { as: "a", cmd: "show fact --to pythonic", expect: /def fact/ },
];

const sockA = io("http://localhost:3210");
const sockB = io("http://localhost:3210");

let joined = 0;

sockA.on("connect", () => sockA.emit("join", { name: "Alice", dialect: "javascript" }));
sockB.on("connect", () => sockB.emit("join", { name: "Bob", dialect: "java" }));

for (const s of [sockA, sockB]) {
  s.on("init", () => {
    joined++;
    if (joined === 2) next();
  });
}

// Only Alice's socket inspects broadcasts (both clients receive every output)
sockA.on("terminal-output", ({ command, text, by }) => {
  const cur = script[step - 1];
  if (!cur) return;
  results.push({ cmd: command, by, text });
  const ok = cur.expect.test(text) && command === cur.cmd;
  console.log(`${ok ? "PASS" : "FAIL"} [${by}] ${command}`);
  if (!ok) console.log("  got:", JSON.stringify(text).slice(0, 200));
  if (step < script.length) next();
  else finish();
});

function next() {
  const cur = script[step++];
  (cur.as === "a" ? sockA : sockB).emit("terminal", { command: cur.cmd });
}

function finish() {
  const fails = results.filter((r, i) => !script[i].expect.test(r.text));
  console.log(`\n${results.length} commands executed, ${fails.length} failure(s)`);
  sockA.disconnect();
  sockB.disconnect();
  process.exit(fails.length ? 1 : 0);
}

setTimeout(() => {
  console.error("TIMEOUT");
  process.exit(1);
}, 15000);
