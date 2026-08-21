#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parse, transpile, run, formatDialect } = require("./index.js");

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: anylang [command] <file.al> [options]

Commands:
  run <file.al>                 Execute an AnyLang file directly (default)
  transpile <file.al>           Transpile AnyLang code to JavaScript
  format <file.al> --to <lang>  Project AST to a dialect (csharp, pythonic, rust, javascript)

Examples:
  node src/cli.js src/hello.al
  node src/cli.js transpile src/hello.al
  node src/cli.js format src/hello.al --to csharp
`);
  process.exit(0);
}

let command = "run";
let filePath = null;
let dialect = "csharp";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "run" || args[i] === "transpile" || args[i] === "format") {
    command = args[i];
  } else if (args[i] === "--to" && args[i + 1]) {
    dialect = args[i + 1];
    i++;
  } else if (!filePath && !args[i].startsWith("-")) {
    filePath = args[i];
  }
}

if (!filePath) {
  console.error("Error: Please provide a file path.");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

const sourceCode = fs.readFileSync(resolvedPath, "utf-8");

try {
  if (command === "run") {
    run(sourceCode);
  } else if (command === "transpile") {
    const ast = parse(sourceCode);
    console.log(transpile(ast));
  } else if (command === "format") {
    const ast = parse(sourceCode);
    console.log(formatDialect(ast, dialect));
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
