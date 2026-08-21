const vm = require("vm");
const nearley = require("nearley");
const grammar = require("./grammar.js");
const runtime = require("./runtime.js");
const { transpile } = require("./transpiler.js");
const { formatDialect } = require("./formatter.js");

function parse(code) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(code);
  if (!parser.results || parser.results.length === 0) {
    throw new Error("Syntax Error: Parsing failed unexpectedly.");
  }
  return parser.results[0];
}

function run(code, customContext = {}) {
  const ast = parse(code);
  const jsCode = transpile(ast);
  const sandbox = { ...runtime, ...customContext };
  vm.createContext(sandbox);
  return vm.runInContext(jsCode, sandbox);
}

module.exports = {
  parse,
  transpile,
  run,
  formatDialect,
  runtime,
};
