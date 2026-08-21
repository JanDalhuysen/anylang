const vm = require("vm");
const nearley = require("nearley");
const grammar = require("./grammar.js");
const runtime = require("./runtime.js");
const { transpile } = require("./transpiler.js");
const { formatDialect } = require("./formatter.js");

const hasher = require("./hasher.js");
const { CodebaseStore } = require("./store.js");

function parse(code) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(code);
  if (!parser.results || parser.results.length === 0) {
    throw new Error("Syntax Error: Parsing failed unexpectedly.");
  }
  return parser.results[0];
}

function runAST(ast, customContext = {}) {
  const jsCode = transpile(ast);
  const sandbox = { ...runtime, ...customContext };
  vm.createContext(sandbox);
  return vm.runInContext(jsCode, sandbox);
}

function run(code, customContext = {}) {
  const ast = parse(code);
  return runAST(ast, customContext);
}

module.exports = {
  parse,
  transpile,
  run,
  runAST,
  formatDialect,
  runtime,
  ...hasher,
  CodebaseStore,
};
