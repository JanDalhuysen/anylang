#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parse, transpile, run, runAST, formatDialect, CodebaseStore, diffPrograms, hashAST } = require("./index.js");

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
AnyLang CLI - Universal Pidgin Language & Unison-Style AST Codebase

Usage:
  anylang [command] [options]

Commands:
  run <file.al>                  Execute an AnyLang file directly (default)
  transpile <file.al>            Transpile AnyLang source to clean JavaScript
  format <file.al> --to <lang>   Project AST to a dialect (csharp, pythonic, rust, javascript)

Unison Codebase Commands (SQLite):
  add <file.al> [--namespace <ns>]
                                 Parse file and save all terms into .anylang/codebase.sqlite
  ls [--namespace <ns>]          List all terms and hashes in the codebase
  show <name|#hash> [--to <lang>] [--namespace <ns>]
                                 Display a stored term projected into a target dialect
  run-term <name|#hash> [args...] [--namespace <ns>]
                                 Execute a stored function directly from the codebase (with optional args)
  rename <old_name> <new_name> [--namespace <ns>]
                                 Update a term alias without breaking caller functions
  diff <a> <b> [--to <lang>] [--namespace <ns>]
                                 Semantic AST diff between two targets (term names,
                                 #hashes, or .al files). Dialect noise (def vs fn,
                                 return vs give) is ignored by design.

Options:
  --to <lang>                    Target dialect (csharp, pythonic, rust, javascript)
  --namespace, -ns <name>        Codebase namespace (default: "default")
  -h, --help                     Show this help message

Examples:
  node src/cli.js examples/01_fizzbuzz.al
  node src/cli.js add examples/03_factorial_fibonacci.al
  node src/cli.js ls
  node src/cli.js show factorial --to rust
  node src/cli.js rename factorial fact
  node src/cli.js show fact --to pythonic
`);
}

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

// Parse flags and command arguments
let command = null;
let positionalArgs = [];
let dialect = "csharp";
let namespace = "default";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--to" && args[i + 1]) {
    dialect = args[i + 1];
    i++;
  } else if ((args[i] === "--namespace" || args[i] === "-ns") && args[i + 1]) {
    namespace = args[i + 1];
    i++;
  } else if (!command && ["run", "transpile", "format", "add", "ls", "show", "run-term", "rename", "diff"].includes(args[i])) {
    command = args[i];
  } else if (!args[i].startsWith("-")) {
    positionalArgs.push(args[i]);
  }
}

if (!command) {
  // If first positional argument is a file, default to run
  if (positionalArgs.length > 0 && positionalArgs[0].endsWith(".al")) {
    command = "run";
  } else if (positionalArgs.length === 0) {
    printHelp();
    process.exit(0);
  } else {
    command = "run";
  }
}

const store = new CodebaseStore();

try {
  switch (command) {
    case "run": {
      const filePath = positionalArgs[0];
      if (!filePath) {
        console.error("Error: Please specify a file to run.");
        process.exit(1);
      }
      const resolvedPath = path.resolve(process.cwd(), filePath);
      const sourceCode = fs.readFileSync(resolvedPath, "utf-8");
      run(sourceCode);
      break;
    }

    case "transpile": {
      const filePath = positionalArgs[0];
      if (!filePath) {
        console.error("Error: Please specify a file to transpile.");
        process.exit(1);
      }
      const resolvedPath = path.resolve(process.cwd(), filePath);
      const sourceCode = fs.readFileSync(resolvedPath, "utf-8");
      const ast = parse(sourceCode);
      console.log(transpile(ast));
      break;
    }

    case "format": {
      const filePath = positionalArgs[0];
      if (!filePath) {
        console.error("Error: Please specify a file to format.");
        process.exit(1);
      }
      const resolvedPath = path.resolve(process.cwd(), filePath);
      const sourceCode = fs.readFileSync(resolvedPath, "utf-8");
      const ast = parse(sourceCode);
      console.log(formatDialect(ast, dialect));
      break;
    }

    case "add": {
      const filePath = positionalArgs[0];
      if (!filePath) {
        console.error("Error: Please specify a file to add into the codebase.");
        process.exit(1);
      }
      const resolvedPath = path.resolve(process.cwd(), filePath);
      const sourceCode = fs.readFileSync(resolvedPath, "utf-8");
      const ast = parse(sourceCode);
      const saved = store.saveProgram(ast, namespace);

      console.log(`\nAdded ${saved.length} term(s) to codebase (namespace: '${namespace}'):`);
      for (const item of saved) {
        console.log(`  + [${item.kind}] ${item.name.padEnd(20)} -> ${item.shortHash} (${item.hash.slice(0, 16)}...)`);
      }
      console.log(`\nDatabase stored at: .anylang/codebase.sqlite`);
      break;
    }

    case "ls": {
      const terms = store.listTerms(namespace === "default" ? null : namespace);
      if (terms.length === 0) {
        console.log(`No terms found in codebase.`);
      } else {
        console.log(`\nAnyLang Codebase Terms (${terms.length}):\n`);
        console.log(`  ${"NAMESPACE".padEnd(12)} ${"KIND".padEnd(10)} ${"NAME".padEnd(22)} ${"HASH"}`);
        console.log(`  ${"-".repeat(12)} ${"-".repeat(10)} ${"-".repeat(22)} ${"-".repeat(18)}`);
        for (const t of terms) {
          console.log(`  ${t.namespace.padEnd(12)} ${t.kind.padEnd(10)} ${t.name.padEnd(22)} ${t.shortHash} (${t.hash.slice(0, 10)}...)`);
        }
        console.log();
      }
      break;
    }

    case "show": {
      const target = positionalArgs[0];
      if (!target) {
        console.error("Error: Please specify a term name or #hash to show.");
        process.exit(1);
      }

      let term;
      if (target.startsWith("#") || (target.length >= 8 && /^[0-9a-f]+$/i.test(target))) {
        term = store.getTermByHash(target);
      } else {
        term = store.getTermByName(target, namespace);
      }

      if (!term) {
        console.error(`Error: Term '${target}' not found in codebase.`);
        process.exit(1);
      }

      console.log(`// Term: ${term.name} | Hash: ${term.shortHash} (${term.hash})`);
      console.log(`// Projected to: ${dialect}\n`);
      console.log(formatDialect(term.ast, dialect));
      break;
    }

    case "run-term": {
      const target = positionalArgs[0];
      const fnArgs = positionalArgs.slice(1).map((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      });
      if (!target) {
        console.error("Error: Please specify a term name or #hash to run.");
        process.exit(1);
      }

      let term;
      if (target.startsWith("#") || (target.length >= 8 && /^[0-9a-f]+$/i.test(target))) {
        term = store.getTermByHash(target);
      } else {
        term = store.getTermByName(target, namespace);
      }

      if (!term) {
        console.error(`Error: Term '${target}' not found in codebase.`);
        process.exit(1);
      }

      console.log(`Executing term: ${term.name} (${term.shortHash})...\n`);
      const vm = require("vm");
      const { transpile, runtime } = require("./index.js");
      const jsCode = transpile(term.ast);
      const sandbox = { ...runtime };
      vm.createContext(sandbox);
      vm.runInContext(jsCode, sandbox);

      if (fnArgs.length > 0 && typeof sandbox[term.name] === "function") {
        const result = sandbox[term.name](...fnArgs);
        if (result !== undefined) {
          console.log(`=> ${typeof result === "object" ? JSON.stringify(result) : result}`);
        }
      }
      break;
    }

    case "diff": {
      const targetA = positionalArgs[0];
      const targetB = positionalArgs[1];
      if (!targetA || !targetB) {
        console.error("Error: Please specify two targets to diff (term name, #hash, or .al file).");
        process.exit(1);
      }

      const resolveTarget = (target) => {
        if (target.endsWith(".al")) {
          const resolvedPath = path.resolve(process.cwd(), target);
          const sourceCode = fs.readFileSync(resolvedPath, "utf-8");
          return { label: target, node: parse(sourceCode) };
        }
        const isHash = target.startsWith("#") || (target.length >= 8 && /^[0-9a-f]+$/i.test(target));
        const term = isHash ? store.getTermByHash(target) : store.getTermByName(target, namespace);
        if (!term) {
          throw new Error(`Term '${target}' not found in codebase.`);
        }
        return { label: `${term.name} (${term.shortHash})`, node: term.ast };
      };

      const a = resolveTarget(targetA);
      const b = resolveTarget(targetB);

      console.log(`\nSemantic Diff:`);
      console.log(`  a = ${a.label}`);
      console.log(`  b = ${b.label}\n`);

      const identicalByHash = hashAST(a.node) === hashAST(b.node);
      const { identical, differences } = diffPrograms(a.node, b.node, targetA, targetB);

      if (identical || identicalByHash) {
        console.log(`✨ Semantically identical! (dialect differences like 'def' vs 'fn' are ignored by design)`);
      } else {
        console.log(`Found ${differences.length} semantic difference(s):\n`);
        for (const d of differences) {
          console.log(`  ~ ${d.path}`);
          console.log(`      a: ${d.a}`);
          console.log(`      b: ${d.b}`);
        }
      }

      if (dialect && !identical && !identicalByHash) {
        console.log(`\n--- Side-by-side projection (--to ${dialect}) ---\n`);
        console.log(`// a: ${targetA}`);
        console.log(formatDialect(a.node, dialect));
        console.log(`\n// b: ${targetB}`);
        console.log(formatDialect(b.node, dialect));
      }

      console.log();
      break;
    }

    case "rename": {
      const oldName = positionalArgs[0];
      const newName = positionalArgs[1];
      if (!oldName || !newName) {
        console.error("Error: Please specify both <old_name> and <new_name>.");
        process.exit(1);
      }

      store.renameTerm(oldName, newName, namespace);
      console.log(`\nSuccessfully renamed alias '${oldName}' -> '${newName}' in namespace '${namespace}'.`);
      console.log(`The underlying content-addressed hash remains unchanged!\n`);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
} catch (err) {
  console.error("\nError:", err.message || err);
  process.exit(1);
} finally {
  store.close();
}
