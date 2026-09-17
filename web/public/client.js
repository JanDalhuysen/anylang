/* AnyLang Collaborative Editor — client */
/* global monaco, io, require */

const MONACO_LANG = { javascript: "javascript", rust: "rust", csharp: "csharp", java: "java", python: "python", pythonic: "python" };

const socket = io();
const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");
const outputEl = document.getElementById("output");
const dialectSel = document.getElementById("dialect");
const nameInput = document.getElementById("name");

nameInput.value = "User-" + Math.floor(Math.random() * 9000 + 1000);

let editor = null;
let myDialect = dialectSel.value;
let dirty = false; // local edits not yet accepted by the server
let suppressChange = false; // applying a remote update
let debounceTimer = null;

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls;
}

function renderUsers(users) {
  usersEl.innerHTML = "";
  for (const u of users) {
    const chip = document.createElement("span");
    chip.className = "user-chip";
    chip.innerHTML = `<span class="dot" style="background:${u.color}"></span>${escapeHtml(u.name)} · ${u.dialect}`;
    usersEl.appendChild(chip);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function join() {
  socket.emit("join", { name: nameInput.value.trim(), dialect: myDialect });
}

require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });
require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// connecting…",
    language: MONACO_LANG[myDialect],
    theme: "vs-dark",
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
  });

  editor.onDidChangeModelContent(() => {
    if (suppressChange) return;
    dirty = true;
    setStatus("Editing…", "");
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sendEdit, 500);
  });

  join();
});

function sendEdit() {
  const code = editor.getValue();
  socket.emit("edit", { code }, (res) => {
    if (res && res.ok) {
      dirty = false;
      setStatus("✓ Synced — everyone sees this in their own language", "synced");
    } else {
      setStatus("⚠ Not synced — " + (res && res.error ? res.error : "syntax error"), "error");
    }
  });
}

function applyRemote(code) {
  if (dirty) {
    setStatus("⚠ Remote update waiting — fix your syntax errors to sync", "error");
    return;
  }
  suppressChange = true;
  const pos = editor.getPosition();
  const scroll = editor.getScrollTop();
  editor.setValue(code);
  if (pos) editor.setPosition(pos);
  editor.setScrollTop(scroll);
  suppressChange = false;
}

// --- Socket events -------------------------------------------------------------
socket.on("init", ({ code, dialect, users }) => {
  myDialect = dialect;
  dialectSel.value = dialect;
  suppressChange = true;
  editor.setValue(code);
  monaco.editor.setModelLanguage(editor.getModel(), MONACO_LANG[dialect]);
  suppressChange = false;
  renderUsers(users);
  setStatus("✓ Synced", "synced");
});

socket.on("doc", ({ code }) => applyRemote(code));
socket.on("users", renderUsers);

socket.on("output", ({ text, by }) => {
  outputEl.textContent = text || "(no output)";
  switchTab("output");
  setStatus(`▶ Run by ${by}`, "synced");
});

socket.on("disconnect", () => setStatus("Disconnected — reconnecting…", "error"));
socket.on("connect", () => {
  if (editor) join();
});

// --- UI events -----------------------------------------------------------------
dialectSel.addEventListener("change", () => {
  myDialect = dialectSel.value;
  dirty = false;
  monaco.editor.setModelLanguage(editor.getModel(), MONACO_LANG[myDialect]);
  socket.emit("dialect", { dialect: myDialect });
});

nameInput.addEventListener("change", join);
document.getElementById("run").addEventListener("click", () => socket.emit("run"));

// --- Panel tabs ------------------------------------------------------------------
const tabOutput = document.getElementById("tab-output");
const tabTerminal = document.getElementById("tab-terminal");
const viewOutput = document.getElementById("view-output");
const viewTerminal = document.getElementById("view-terminal");
const terminalOut = document.getElementById("terminal-out");
const terminalInput = document.getElementById("terminal-input");

function switchTab(which) {
  const outActive = which === "output";
  tabOutput.classList.toggle("active", outActive);
  tabTerminal.classList.toggle("active", !outActive);
  viewOutput.classList.toggle("active", outActive);
  viewTerminal.classList.toggle("active", !outActive);
  if (!outActive) terminalInput.focus();
}
tabOutput.addEventListener("click", () => switchTab("output"));
tabTerminal.addEventListener("click", () => switchTab("terminal"));

// --- Unison Terminal ----------------------------------------------------------------
const termHistory = [];
let termHistoryIdx = -1;

function appendTerminal(html) {
  const atBottom = terminalOut.scrollHeight - terminalOut.scrollTop - terminalOut.clientHeight < 40;
  terminalOut.innerHTML += html;
  if (atBottom) terminalOut.scrollTop = terminalOut.scrollHeight;
}

function runTerminalCommand(command) {
  if (!command.trim()) return;
  termHistory.push(command);
  termHistoryIdx = termHistory.length;
  socket.emit("terminal", { command });
  switchTab("terminal"); // make sure the terminal view is visible on output
}

socket.on("terminal-output", ({ command, text, by }) => {
  appendTerminal(`<span class="term-by">${escapeHtml(by)}</span> ` + `<span class="term-cmd">anylang&gt; ${escapeHtml(command)}</span>\n` + `${escapeHtml(text || "")}\n\n`);
  terminalOut.scrollTop = terminalOut.scrollHeight;
});

terminalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = terminalInput.value;
    terminalInput.value = "";
    runTerminalCommand(cmd);
  } else if (e.key === "ArrowUp") {
    if (termHistoryIdx > 0) {
      termHistoryIdx--;
      terminalInput.value = termHistory[termHistoryIdx];
    }
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (termHistoryIdx < termHistory.length - 1) {
      termHistoryIdx++;
      terminalInput.value = termHistory[termHistoryIdx];
    } else {
      termHistoryIdx = termHistory.length;
      terminalInput.value = "";
    }
    e.preventDefault();
  }
});

// Greeting line in the terminal
appendTerminal(`<span class="term-cmd">AnyLang Unison Terminal</span>\n` + `Content-addressed codebase — share functions by hash, project them into\n` + `any dialect, and semantically diff them. Type 'help' for commands.\n\n`);
