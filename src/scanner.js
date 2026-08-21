const moo = require("moo");

const baseLexer = moo.compile({
  ws: { match: /[ \t\r\n]+/, lineBreaks: true },
  comment: { match: /\/\/.*|\/\*[\s\S]*?\*\//, lineBreaks: true },
  number: /0|[1-9][0-9]*(?:\.[0-9]+)?/,
  template_string: {
    match: /`(?:\\[\s\S]|[^`\\])*`/,
    lineBreaks: true,
  },
  string: /"(?:\\["\\]|[^\n"\\])*"|'(?:\\['\\]|[^\n'\\])*'/,

  // Use moo.keywords attached to identifiers to prevent prefix clashes
  identifier: {
    match: /[a-zA-Z_][a-zA-Z0-9_]*/,
    type: moo.keywords({
      kw_fn: ["function", "def", "fn", "fun", "func", "procedure", "proc", "void", "sub", "method"],
      kw_var: ["let", "const", "var", "val", "auto", "int", "float", "double", "string", "bool", "boolean", "char", "byte", "long", "short", "dynamic", "my"],
      kw_if: ["if", "when", "unless"],
      kw_else: ["else", "otherwise", "elif", "elsif"],
      kw_while: ["while", "until", "repeat"],
      kw_for: ["for", "foreach", "loop"],
      kw_return: ["return", "give", "yield", "result"],
      kw_bool: ["true", "True", "TRUE", "yes", "false", "False", "FALSE", "no"],
      kw_null: ["null", "nil", "None", "undefined", "NULL"],
      op_logical: ["and", "or", "not"],
    }),
  },

  // Symbolic operators and punctuation
  op_logical: ["&&", "||", "!"],
  op_compare: ["===", "==", "!==", "!=", "<=", ">=", "<", ">"],
  assign_op: ["+=", "-=", "*=", "/=", "="],
  plus: "+",
  minus: "-",
  times: "*",
  divide: "/",
  modulo: "%",

  lparen: "(",
  rparen: ")",
  lbrace: "{",
  rbrace: "}",
  lbracket: "[",
  rbracket: "]",
  semicolon: ";",
  comma: ",",
  dot: ".",
});

class AnyLangLexer {
  constructor(options = { enforceAllmanBraces: true }) {
    this.options = options;
    this.prevToken = null;
  }

  reset(chunk, info) {
    baseLexer.reset(chunk, info);
    this.prevToken = null;
    return this;
  }

  next() {
    let token;
    while ((token = baseLexer.next())) {
      if (token.type === "ws" || token.type === "comment") {
        continue;
      }

      // Check Allman brace style: '{' MUST be on a new line after the previous token
      if (this.options.enforceAllmanBraces && token.type === "lbrace") {
        if (this.prevToken && token.line === this.prevToken.line) {
          throw new Error(`AnyLang Syntax Error at line ${token.line}, col ${token.col}: ` + `Opening brace '{' MUST be on a new line (Allman / Microsoft style)!`);
        }
      }

      this.prevToken = token;
      return token;
    }
    return undefined;
  }

  save() {
    return {
      base: baseLexer.save(),
      prevToken: this.prevToken,
    };
  }

  formatError(token, message) {
    return baseLexer.formatError(token, message);
  }

  has(name) {
    return baseLexer.has(name);
  }
}

const lexer = new AnyLangLexer({ enforceAllmanBraces: true });

module.exports = {
  lexer,
  AnyLangLexer,
};
