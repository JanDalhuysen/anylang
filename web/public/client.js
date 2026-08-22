/* AnyLang Collaborative Editor — client */
/* global monaco, io, require */

const MONACO_LANG = { javascript: "javascript", rust: "rust", csharp: "csharp", java: "java" };

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
