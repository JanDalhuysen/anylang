# AnyLang

**AnyLang** is the universal pidgin programming language that accepts almost anything you throw at it, mixing keywords and idioms from JavaScript, Python, Java, C#, C++, Rust, and Go.

> _"If it compiles in anything, it should compile in AnyLang."_

---

## Features

- **Maximum Keyword Generosity**: Use `def`, `fn`, `function`, `void`, `proc`, or `sub` to define functions. Use `let`, `var`, `val`, `int`, `const`, or `auto` for variables.
- **Universal Standard Library**: Call `print`, `println`, `echo`, `puts`, `fmt.Println`, `System.out.println`, or `console.log` interchangeably.
- **Strict Allman Bracing**: Extremely lenient on vocabulary, but strictly enforces that **opening curly braces `{` MUST be on a new line** (clang-format style Microsoft).
- **Unison-Style Semantic AST & Projections**: Transforms your code into a canonical semantic AST, which can be dynamically projected/formatted into C#, Pythonic, Rust, or JavaScript styles.
- **JavaScript Transpiler & VM Execution**: Generates clean JS and executes directly in Node.js.

---

## Quick Start

### 1. Install Dependencies & Build

```bash
npm install
npm run build
```

### 2. Run Tests

```bash
npm test
```

### 3. Example AnyLang Program

```anylang
int count = 5;
val message = "Hello from AnyLang!";

fn greet(person)
{
  echo("Greeting: " + person);
  fmt.Println("Message: " + message);
}

def calculate(a, b)
{
  when (a > b)
  {
    System.out.println("a is greater!");
    give a * 2;
  }
  otherwise
  {
    return b + 10;
  }
}

greet("Ada Lovelace");
val result1 = calculate(10, 4);
print("Result 1: " + result1);
```

---

## Unison-Style SQLite Codebase (Content-Addressed Code)

AnyLang allows you to store your functions and terms directly into a local SQLite database (`.anylang/codebase.sqlite`) indexed by cryptographic content hash (SHA-256):

```bash
# 1. Ingest functions into the SQLite codebase
node src/cli.js add examples/03_factorial_fibonacci.al

# 2. List all terms in the codebase with their short hashes
node src/cli.js ls

# 3. Project any stored term into a specific syntax dialect
node src/cli.js show factorial --to rust
node src/cli.js show factorial --to pythonic
node src/cli.js show #2e71eec1 --to csharp

# 4. Zero-break renaming (renames the human alias; content hash remains identical)
node src/cli.js rename factorial fact
node src/cli.js show fact --to pythonic
```

---

## Vim / Neovim Syntax Highlighting

AnyLang includes syntax files for Vim and Neovim (`ftdetect/` and `syntax/`).

### Quick Test

Open any `.al` file in Neovim and run:

```vim
:set filetype=anylang
```

### Install into Neovim

- **Linux / macOS**:
  ```bash
  cp -r ftdetect syntax ~/.config/nvim/
  ```
- **Windows**:
  ```powershell
  Copy-Item -Recurse ftdetect, syntax $env:LOCALAPPDATA\nvim\
  ```
- **Using Lazy.nvim**:
  ```lua
  { dir = "/path/to/anylang" }
  ```

---

## Ideas & Roadmap

See [IDEAS.md](./IDEAS.md) for future plans, architectural notes, and Unison-inspired features!

See [TODO.md](./TODO.md) for a detailed roadmap of completed and upcoming features.
