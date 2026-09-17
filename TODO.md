# AnyLang TODO Roadmap

## Phase 5: Epic Ideas (New)

- [ ] **Idea 1: Hash-Merge Conflict-Free Collaboration ("Git for ASTs")** — _see IDEAS.md_
  - [x] **Semantic Diff Module (`src/differ.js`)**
    - [x] `diffAST(nodeA, nodeB)` recursive diff over _normalized_ ASTs (dialect keywords already unified by the hasher, so `def` vs `fn` / `return` vs `give` never show as differences).
    - [x] Returns `{ identical, differences: [{ path, a, b }] }` with human-readable path notation (e.g. `body[0].body[1].argument.operator`).
  - [x] **CLI `diff` Command (`src/cli.js`)**
    - [x] `anylang diff <a> <b> [--to <dialect>] [--namespace <ns>]` where each target is a term name, `#hash` (or hash prefix), or a `.al` file path.
    - [x] Prints "✨ Semantically identical" when normalized hashes match (dialect noise ignored), otherwise lists each semantic difference with path + values.
    - [x] `--to <dialect>` renders both versions projected side-by-side in the target dialect for human review.
  - [ ] `anylang merge <a> <b>`: keep both differing versions as separate content-addressed terms and interactively choose the winning alias.
  - [x] **Web UI: In-Editor Unison Terminal (`web/`)**
    - [x] Bottom panel tabs: **Output** / **Unison Terminal** with `anylang>` prompt, command history (↑/↓), and colored multi-user output.
    - [x] Server-side **whitelist-only** executor (`help`, `ls`, `add`, `show`, `diff`, `rename`, `run-term`) backed by the shared `CodebaseStore` — any other command (e.g. shell commands) is rejected.
    - [x] Commands + results broadcast over Socket.IO so all collaborators see codebase activity live.
    - [x] End-to-end test with two simulated clients (`test/web-terminal.test.js`): 9/9 commands pass, including disallowed-command rejection.

- [ ] **Idea 2: Dialect-Aware Error Messages ("The Rosetta Compiler")** — _see IDEAS.md_
  - [ ] Detect common foreign-construct mistakes (`def foo(x):`, `x++`, same-line `{` from K&R style) and suggest closest valid AnyLang syntax.
  - [ ] Infer "home dialect" from keyword usage and localize compiler output/docs.
  - [ ] `anylang doctor <file.al>` dialect purity score.

- [ ] **Idea 3: Cross-Language Import Bridge ("Eat the Ecosystem")** — _see IDEAS.md_
  - [ ] `anylang import <file.js>`: parse a JavaScript subset back into the canonical AnyLang AST (reverse transpiler) and store as content-addressed terms.
  - [ ] Full roundtrip validation: `JS → AST → dialect projection → AST` hash stability.
  - [ ] Optional: Python subset importer via lightweight mapping rules.

This document outlines targeted, actionable short-term goals and milestones for AnyLang development.

---

## Phase 1: Unison-Inspired Content-Addressed Codebase (Completed)

---

## Phase 1: Unison-Inspired Content-Addressed Codebase (Completed)

# AnyLang TODO Roadmap

This document outlines targeted, actionable short-term goals and milestones for AnyLang development.

---

## Phase 1: Unison-Inspired Content-Addressed Codebase (Completed)

- [x] **Canonical AST Normalization & Hashing Module (`src/hasher.js`)**
  - [x] Implement AST canonicalization: sort object keys, standardize node representations, and strip superficial source spans/comments.
  - [x] Implement SHA-256 content hashing for individual functions and top-level expressions (`hashAST(node) -> sha256_hash`).
  - [x] Normalization ensures identical semantic functions declared with different dialect keywords (`def` vs `fn` vs `void`, `return` vs `give`) produce identical hashes.

- [x] **SQLite Codebase Storage Engine (`src/store.js`)**
  - [x] Set up zero-dependency SQLite storage using Node.js built-in `node:sqlite`:
    - Table `terms`: `(hash TEXT PRIMARY KEY, name TEXT, kind TEXT, ast_json TEXT, created_at INTEGER)`
    - Table `names`: `(namespace TEXT, name TEXT, hash TEXT, updated_at INTEGER, PRIMARY KEY(namespace, name))`
  - [x] Function `saveTerm` / `saveProgram`: Extracts functions, hashes them, stores their AST in `terms`, and registers aliases in `names`.
  - [x] Function `getTermByName` / `getTermByHash`: Fetches AST from `terms`.
  - [x] Function `renameTerm`: Updates alias in `names` without touching or breaking underlying content hash.

- [x] **Codebase CLI Commands (`src/cli.js`)**
  - [x] `anylang add <file.al>`: Parses file, hashes definitions, and saves to `.anylang/codebase.sqlite`.
  - [x] `anylang ls`: Lists all defined terms, hashes, and namespaces in the local codebase.
  - [x] `anylang show <name|#hash> --to <dialect>`: Retrieves function from SQLite by name or hash and renders it in the requested dialect (`pythonic`, `rust`, `csharp`, `javascript`).
  - [x] `anylang run-term <name|#hash>`: Executes a content-addressed term directly from the SQLite store.
  - [x] `anylang rename <old_name> <new_name>`: Renames human alias while keeping content hash immutable.

---

## Phase 2: Grammar & Runtime Enhancements

- [x] **Array & List Literals**
  - [x] Add array syntax `[item1, item2, item3]` to `src/grammar.ne`.
  - [x] Add array index access `arr[index]` to `src/grammar.ne` and `src/transpiler.js`.
  - [x] Add array dialect projection support to `src/formatter.js`.

- [ ] **Object & Dictionary Literals**
  - [ ] Add object literal syntax `{ "key": value, key2: value2 }` (handling brace newline disambiguation with blocks).
  - [ ] Support dictionary lookup `dict["key"]` and `dict.key`.

- [x] **For Loops & Iteration**
  - [x] Add `for (var item in collection)` / `for (item of collection)` / `foreach` loop construct in `src/grammar.ne`.
  - [x] Add transpilation and formatting for iterations.

- [ ] **Comments & Docstrings**
  - [ ] Preserve docstrings in the AST for documentation projection and Unison metadata storage.

---

## Phase 3: Dialect Formatter Refinements

- [ ] **Pythonic Dialect Indentation Blocks**
  - [ ] Enhance `formatter.js` pythonic output to optionally support colon + indentation (`def foo():\n  pass`) instead of curly braces.
- [ ] **Java / C# Return Types & Variable Types**
  - [ ] Allow dialect formatter to infer or specify placeholder types (e.g. `int`, `string`, `void`) when exporting to strongly-typed targets.

---

## Phase 4: Testing & Examples

- [x] **Core Multi-Dialect Examples (`examples/`)**
  - [x] `examples/01_fizzbuzz.al`
  - [x] `examples/02_math_and_logic.al`
  - [x] `examples/03_factorial_fibonacci.al`
- [ ] **Automated Test Suite Expansion**
  - [ ] Add unit test runner for all files in `examples/`.
  - [ ] Add automated roundtrip tests: `Parse -> Format(dialect) -> Parse -> Compare AST hashes`.
