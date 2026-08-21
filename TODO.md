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

- [ ] **Array & List Literals**
  - [ ] Add array syntax `[item1, item2, item3]` to `src/grammar.ne`.
  - [ ] Add array index access `arr[index]` to `src/grammar.ne` and `src/transpiler.js`.
  - [ ] Add array dialect projection support to `src/formatter.js`.

- [ ] **Object & Dictionary Literals**
  - [ ] Add object literal syntax `{ "key": value, key2: value2 }` (handling brace newline disambiguation with blocks).
  - [ ] Support dictionary lookup `dict["key"]` and `dict.key`.

- [ ] **For Loops & Iteration**
  - [ ] Add `for (var item in collection)` / `for (item of collection)` / `foreach` loop construct in `src/grammar.ne`.
  - [ ] Add transpilation and formatting for iterations.

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
