# AnyLang - The Universal Pidgin Programming Language

> **Epic Ideas** (community proposals):

## Epic Idea 1: Hash-Merge Conflict-Free Collaboration ("Git for ASTs")

Because identical semantics produce identical content hashes, merging becomes
trivial and text-conflict-free:

- **Auto-merge both versions**: a "conflict" only exists when hashes differ, so
  `anylang merge` can keep _both_ sides as separate content-addressed terms and
  simply ask which alias should point where.
- **Semantic diff**: `anylang diff <a> <b>` compares _normalized_ ASTs, so
  pure dialect noise (`def` vs `fn`, `return` vs `give`) shows as
  **identical** (same hash!) and only real semantic changes are reported.
  Any two targets work: term names, `#hashes`, or `.al` files.
- **Side-by-side projections**: when versions differ, render both in the
  viewer's dialect with `--to <dialect>` for human judgment.

This turns Git's line-based merge problem into a "which version do we alias?"
decision - something almost no other language can do.

## Epic Idea 2: Dialect-Aware Error Messages ("The Rosetta Compiler")

AnyLang accepts keywords from 8+ languages, so errors should speak the
user's language too:

- **Smart suggestions**: detect familiar foreign constructs (e.g. `def foo(x):`
  Python habit, `x++` C/Java habit) and suggest the closest valid AnyLang
  construct instead of a bare "Syntax Error".
- **Home-dialect detection**: infer the user's "home dialect" from keyword
  usage (lots of `fn`/`println!` → Rustacean) and render compiler output,
  docs, and examples in that dialect.
- **Dialect purity score**: `anylang doctor my_file.al` reports a fun stat
  like _"You're 80% Go, 15% Python, 5% Rust 🦀"_.

## Epic Idea 3: Cross-Language Import Bridge ("Eat the Ecosystem")

Let AnyLang consume real code from other languages:

- `anylang import fibonacci.py` (or `.js`) parses foreign source, maps its
  constructs into the canonical AST, and stores it as a content-addressed
  term - instantly projectable into any dialect.
- Start with JavaScript (AnyLang already transpiles to JS, so a reverse-parser
  enables full roundtrip: `JS → AST → Rust view`).
- No ecosystem bootstrapping problem; validates the motto _"If it compiles in
  anything, it compiles in AnyLang"_ literally.

---

# AnyLang - The Universal Pidgin Programming Language

# AnyLang - The Universal Pidgin Programming Language

> **"If it compiles in anything, it should compile in AnyLang."**

AnyLang is a multi-syntax, multi-paradigm programming language designed as a functional joke with serious underlying language design principles. It combines keywords and idioms from JavaScript, Python, Java, C#, C++, Go, Rust, Ruby, PHP, and more into a universal dialect where almost whatever you type is valid syntax.

---

## Core Philosophies & Rules

### 1. Maximum Keyword Generosity (The Pidgin Principle)

Any keyword that means "declare a variable", "define a function", or "loop" works interchangeably:

- **Function keywords**: `function`, `def`, `fn`, `fun`, `func`, `procedure`, `proc`, `void`, `sub`, `method`
- **Variable keywords**: `let`, `var`, `val`, `const`, `auto`, `int`, `float`, `double`, `string`, `bool`, `boolean`, `dynamic`, `def`, `my`
- **Conditionals**: `if`, `when`, `unless`
- **Loops**: `while`, `until`, `for`, `loop`, `repeat`
- **Returns**: `return`, `give`, `yield`, `result`
- **Booleans & Nulls**: `true` / `True` / `TRUE` / `yes`, `false` / `False` / `FALSE` / `no`, `null` / `nil` / `None` / `undefined`
- **Operators**: `and` / `&&`, `or` / `||`, `not` / `!`, `==` / `===` / `is`, `!=` / `!==` / `is not`

### 2. The Strict Rule: Mandatory Allman Braces (Microsoft / Clang Style)

While AnyLang is completely lenient with vocabulary and syntax, it is **strictly dogmatic about formatting**:

- **Opening curly braces `{` MUST be on a new line.**
- If you place `{` on the same line as a function signature, `if`, `while`, or `for`, AnyLang will raise a syntax error.

```anylang
// Valid in AnyLang
fn calculate(x, y)
{
    if (x > y)
    {
        return x + y;
    }
}

// Syntax Error: "Opening brace '{' MUST be placed on a new line (Allman/Microsoft style)!"
fn calculate(x, y) {
}
```

### 3. The Unison Concept: Semantic AST & Dialect Projection

Inspired by **Unison Lang**, AnyLang stores and processes code as a **canonical semantic Abstract Syntax Tree (AST)** rather than raw source text.

- Because `def foo(x) { ... }`, `function foo(x) { ... }`, and `void foo(x) { ... }` represent the exact same semantic node (`FunctionDeclaration(name="foo", params=["x"])`), the source code can be translated or projected into any style:
  - **JavaScript flavor**: `function foo(x) { ... }`
  - **C# / Java flavor**: `void foo(x) { ... }`
  - **Rust / Go flavor**: `fn foo(x) { ... }`
  - **Pythonic flavor**: `def foo(x) { ... }`

### 4. Universal Standard Library (Built-in Aliases)

No matter what standard output function you remember from your favorite language, it works:

- `print(...)`
- `println(...)`
- `console.log(...)`
- `echo(...)`
- `puts(...)`
- `System.out.println(...)`
- `fmt.Println(...)`
- `printf(...)`

### 5. Content-Addressed AST Store (Unison-Style Codebase in SQLite)

Like Unison, AnyLang can decouple human-readable names from function definitions by storing canonical ASTs indexed by their cryptographic hash (e.g., SHA-256 of the normalized AST JSON):

- **Zero-Break Refactors**: Changing a function's name only updates the alias table (`name -> hash`). Caller functions reference the definition's content hash, meaning renames never break dependencies.
- **SQLite Storage Backend**: Store definitions in `.anylang/codebase.sqlite` containing:
  - `terms`: `(hash PRIMARY KEY, ast_json TEXT, created_at INTEGER)`
  - `names`: `(namespace TEXT, name TEXT, hash TEXT, PRIMARY KEY(namespace, name))`
  - `cached_js`: `(hash PRIMARY KEY, transpiled_code TEXT)` for instant zero-overhead execution.

### 6. Bidirectional Multi-Dialect Roundtripping

Because AnyLang code is stored as a canonical AST, developers on the same team can write and view the same codebase in their preferred syntax:

- Alice prefers Pythonic syntax (`def`, `and`, `or`, `True`).
- Bob prefers Rust syntax (`fn`, `&&`, `||`, `true`).
- The repository stores the canonical AST (or SQLite hashes). On checkout or save, the editor projects the AST into the developer's chosen dialect seamlessly.

---

## Roadmap & Next Steps

- [x] **Categorized Moo Lexer & Scanner**: Tokenize keywords into semantic families while filtering whitespace and checking brace newlines.
- [x] **Nearley Grammar & AST Generator**: Full AST generation for variable declarations, functions, conditionals, loops, binary expressions, and returns.
- [x] **JavaScript Transpiler / Execution Engine**: Transpile AnyLang AST into clean JavaScript and execute instantly in Node.js.
- [x] **Unison-style Dialect Formatter**: Convert any AnyLang AST into Java, C#, Pythonic, Rust, or JavaScript syntax.
- [ ] **Content-Addressed Codebase (SQLite Store)**: Hash normalized function ASTs and persist terms + names in a local SQLite database.
- [ ] **Data Structures**: Support array/list literals `[1, 2, 3]` and object/dict literals `{ "key": value }`.
- [ ] **Optional Type Annotations**: Allow Java/TypeScript-style type annotations (e.g. `int x: number = 5;` or `fn add(int a, float b): int`) which are parsed and dynamically checked or erased.
- [ ] **Package Manager & Ecosystem**: AnyPkg for sharing content-addressed AST modules without dependency hell.
