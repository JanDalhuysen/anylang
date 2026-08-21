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
