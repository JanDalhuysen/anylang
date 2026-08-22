// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
  function id(x) {
    return x[0];
  }

  const { lexer } = require("./scanner.js");

  function unquote(str) {
    return str.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }

  function parseTemplateLiteral(raw) {
    const content = raw.slice(1, -1);
    const parts = [];
    let i = 0;
    let textBuf = "";

    while (i < content.length) {
      if (content[i] === "\\" && i + 1 < content.length) {
        const next = content[i + 1];
        if (next === "`" || next === "$") {
          textBuf += next;
          i += 2;
          continue;
        } else if (next === "n") {
          textBuf += "\n";
          i += 2;
          continue;
        } else if (next === "t") {
          textBuf += "\t";
          i += 2;
          continue;
        } else if (next === "\\") {
          textBuf += "\\";
          i += 2;
          continue;
        } else {
          textBuf += "\\" + next;
          i += 2;
          continue;
        }
      }

      if (content[i] === "$" && content[i + 1] === "{") {
        if (textBuf.length > 0) {
          parts.push({
            type: "Literal",
            value: textBuf,
            raw: JSON.stringify(textBuf),
          });
          textBuf = "";
        }

        i += 2; // skip ${
        let depth = 1;
        let exprCode = "";
        while (i < content.length && depth > 0) {
          if (content[i] === "{") {
            depth++;
            exprCode += "{";
          } else if (content[i] === "}") {
            depth--;
            if (depth > 0) exprCode += "}";
          } else {
            exprCode += content[i];
          }
          i++;
        }

        parts.push({
          type: "TemplateExpression",
          expression: exprCode.trim(),
        });
      } else {
        textBuf += content[i];
        i++;
      }
    }

    if (textBuf.length > 0) {
      parts.push({
        type: "Literal",
        value: textBuf,
        raw: JSON.stringify(textBuf),
      });
    }

    return {
      type: "TemplateLiteral",
      raw,
      parts,
    };
  }
  var grammar = {
    Lexer: lexer,
    ParserRules: [
      { name: "Program$ebnf$1", symbols: [] },
      {
        name: "Program$ebnf$1",
        symbols: ["Program$ebnf$1", "Statement"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "Program",
        symbols: ["Program$ebnf$1"],
        postprocess: (d) => ({
          type: "Program",
          body: d[0],
        }),
      },
      { name: "Statement", symbols: ["VariableDeclaration"], postprocess: id },
      { name: "Statement", symbols: ["FunctionDeclaration"], postprocess: id },
      { name: "Statement", symbols: ["IfStatement"], postprocess: id },
      { name: "Statement", symbols: ["WhileStatement"], postprocess: id },
      { name: "Statement", symbols: ["ReturnStatement"], postprocess: id },
      { name: "Statement", symbols: ["AssignmentStatement"], postprocess: id },
      { name: "Statement", symbols: ["ExpressionStatement"], postprocess: id },
      { name: "Statement", symbols: ["Block"], postprocess: id },
      { name: "VariableDeclaration$ebnf$1$subexpression$1", symbols: [lexer.has("assign_op") ? { type: "assign_op" } : assign_op, "Expression"] },
      { name: "VariableDeclaration$ebnf$1", symbols: ["VariableDeclaration$ebnf$1$subexpression$1"], postprocess: id },
      {
        name: "VariableDeclaration$ebnf$1",
        symbols: [],
        postprocess: function (d) {
          return null;
        },
      },
      {
        name: "VariableDeclaration",
        symbols: [lexer.has("kw_var") ? { type: "kw_var" } : kw_var, lexer.has("identifier") ? { type: "identifier" } : identifier, "VariableDeclaration$ebnf$1", lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: (d) => ({
          type: "VariableDeclaration",
          keyword: d[0].value,
          name: d[1].value,
          value: d[2] ? d[2][1] : null,
        }),
      },
      { name: "FunctionDeclaration$ebnf$1", symbols: ["ParameterList"], postprocess: id },
      {
        name: "FunctionDeclaration$ebnf$1",
        symbols: [],
        postprocess: function (d) {
          return null;
        },
      },
      {
        name: "FunctionDeclaration",
        symbols: [lexer.has("kw_fn") ? { type: "kw_fn" } : kw_fn, lexer.has("identifier") ? { type: "identifier" } : identifier, lexer.has("lparen") ? { type: "lparen" } : lparen, "FunctionDeclaration$ebnf$1", lexer.has("rparen") ? { type: "rparen" } : rparen, "Block"],
        postprocess: (d) => ({
          type: "FunctionDeclaration",
          keyword: d[0].value,
          name: d[1].value,
          params: d[3] || [],
          body: d[5],
        }),
      },
      { name: "ParameterList$ebnf$1", symbols: [] },
      { name: "ParameterList$ebnf$1$subexpression$1", symbols: [lexer.has("comma") ? { type: "comma" } : comma, lexer.has("identifier") ? { type: "identifier" } : identifier] },
      {
        name: "ParameterList$ebnf$1",
        symbols: ["ParameterList$ebnf$1", "ParameterList$ebnf$1$subexpression$1"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "ParameterList",
        symbols: [lexer.has("identifier") ? { type: "identifier" } : identifier, "ParameterList$ebnf$1"],
        postprocess: (d) => {
          const list = [d[0].value];
          for (const item of d[1]) {
            list.push(item[1].value);
          }
          return list;
        },
      },
      { name: "Block$ebnf$1", symbols: [] },
      {
        name: "Block$ebnf$1",
        symbols: ["Block$ebnf$1", "Statement"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "Block",
        symbols: [lexer.has("lbrace") ? { type: "lbrace" } : lbrace, "Block$ebnf$1", lexer.has("rbrace") ? { type: "rbrace" } : rbrace],
        postprocess: (d) => ({
          type: "Block",
          body: d[1],
        }),
      },
      { name: "IfStatement$ebnf$1", symbols: ["ElseClause"], postprocess: id },
      {
        name: "IfStatement$ebnf$1",
        symbols: [],
        postprocess: function (d) {
          return null;
        },
      },
      {
        name: "IfStatement",
        symbols: [lexer.has("kw_if") ? { type: "kw_if" } : kw_if, lexer.has("lparen") ? { type: "lparen" } : lparen, "Expression", lexer.has("rparen") ? { type: "rparen" } : rparen, "Block", "IfStatement$ebnf$1"],
        postprocess: (d) => ({
          type: "IfStatement",
          keyword: d[0].value,
          condition: d[2],
          consequent: d[4],
          alternate: d[5] || null,
        }),
      },
      { name: "ElseClause", symbols: [lexer.has("kw_else") ? { type: "kw_else" } : kw_else, "Block"], postprocess: (d) => d[1] },
      { name: "ElseClause", symbols: [lexer.has("kw_else") ? { type: "kw_else" } : kw_else, "IfStatement"], postprocess: (d) => d[1] },
      {
        name: "WhileStatement",
        symbols: [lexer.has("kw_while") ? { type: "kw_while" } : kw_while, lexer.has("lparen") ? { type: "lparen" } : lparen, "Expression", lexer.has("rparen") ? { type: "rparen" } : rparen, "Block"],
        postprocess: (d) => ({
          type: "WhileStatement",
          keyword: d[0].value,
          condition: d[2],
          body: d[4],
        }),
      },
      {
        name: "ReturnStatement",
        symbols: [lexer.has("kw_return") ? { type: "kw_return" } : kw_return, "Expression", lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: (d) => ({
          type: "ReturnStatement",
          keyword: d[0].value,
          argument: d[1],
        }),
      },
      {
        name: "ReturnStatement",
        symbols: [lexer.has("kw_return") ? { type: "kw_return" } : kw_return, lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: (d) => ({
          type: "ReturnStatement",
          keyword: d[0].value,
          argument: null,
        }),
      },
      {
        name: "AssignmentStatement",
        symbols: ["PostfixExpression", lexer.has("assign_op") ? { type: "assign_op" } : assign_op, "Expression", lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: (d) => ({
          type: "AssignmentStatement",
          target: d[0],
          operator: d[1].value,
          value: d[2],
        }),
      },
      {
        name: "ExpressionStatement",
        symbols: ["Expression", lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: (d) => ({
          type: "ExpressionStatement",
          expression: d[0],
        }),
      },
      { name: "Expression", symbols: ["LogicalOrExpression"], postprocess: id },
      {
        name: "LogicalOrExpression",
        symbols: ["LogicalOrExpression", lexer.has("op_logical") ? { type: "op_logical" } : op_logical, "LogicalAndExpression"],
        postprocess: (d) => ({
          type: "BinaryExpression",
          operator: d[1].value,
          left: d[0],
          right: d[2],
        }),
      },
      { name: "LogicalOrExpression", symbols: ["LogicalAndExpression"], postprocess: id },
      {
        name: "LogicalAndExpression",
        symbols: ["LogicalAndExpression", lexer.has("op_compare") ? { type: "op_compare" } : op_compare, "ComparisonExpression"],
        postprocess: (d) => ({
          type: "BinaryExpression",
          operator: d[1].value,
          left: d[0],
          right: d[2],
        }),
      },
      { name: "LogicalAndExpression", symbols: ["ComparisonExpression"], postprocess: id },
      {
        name: "ComparisonExpression",
        symbols: ["ComparisonExpression", "AdditiveOp", "AdditiveExpression"],
        postprocess: (d) => ({
          type: "BinaryExpression",
          operator: d[1],
          left: d[0],
          right: d[2],
        }),
      },
      { name: "ComparisonExpression", symbols: ["AdditiveExpression"], postprocess: id },
      { name: "AdditiveOp", symbols: [lexer.has("plus") ? { type: "plus" } : plus], postprocess: (d) => d[0].value },
      { name: "AdditiveOp", symbols: [lexer.has("minus") ? { type: "minus" } : minus], postprocess: (d) => d[0].value },
      {
        name: "AdditiveExpression",
        symbols: ["AdditiveExpression", "MultiplicativeOp", "MultiplicativeExpression"],
        postprocess: (d) => ({
          type: "BinaryExpression",
          operator: d[1],
          left: d[0],
          right: d[2],
        }),
      },
      { name: "AdditiveExpression", symbols: ["MultiplicativeExpression"], postprocess: id },
      { name: "MultiplicativeOp", symbols: [lexer.has("times") ? { type: "times" } : times], postprocess: (d) => d[0].value },
      { name: "MultiplicativeOp", symbols: [lexer.has("divide") ? { type: "divide" } : divide], postprocess: (d) => d[0].value },
      { name: "MultiplicativeOp", symbols: [lexer.has("modulo") ? { type: "modulo" } : modulo], postprocess: (d) => d[0].value },
      { name: "MultiplicativeExpression", symbols: ["UnaryExpression"], postprocess: id },
      {
        name: "UnaryExpression",
        symbols: [lexer.has("minus") ? { type: "minus" } : minus, "UnaryExpression"],
        postprocess: (d) => ({
          type: "UnaryExpression",
          operator: "-",
          argument: d[1],
        }),
      },
      {
        name: "UnaryExpression",
        symbols: [lexer.has("op_logical") ? { type: "op_logical" } : op_logical, "UnaryExpression"],
        postprocess: (d) => ({
          type: "UnaryExpression",
          operator: d[0].value,
          argument: d[1],
        }),
      },
      { name: "UnaryExpression", symbols: ["PostfixExpression"], postprocess: id },
      { name: "PostfixExpression$ebnf$1", symbols: [] },
      {
        name: "PostfixExpression$ebnf$1",
        symbols: ["PostfixExpression$ebnf$1", "PostfixSuffix"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "PostfixExpression",
        symbols: ["PrimaryExpression", "PostfixExpression$ebnf$1"],
        postprocess: (d) => {
          let expr = d[0];
          for (const suffix of d[1]) {
            if (suffix.type === "call") {
              expr = {
                type: "CallExpression",
                callee: expr,
                arguments: suffix.arguments,
              };
            } else if (suffix.type === "member") {
              expr = {
                type: "MemberExpression",
                object: expr,
                property: suffix.property,
              };
            }
          }
          return expr;
        },
      },
      { name: "PostfixSuffix", symbols: [lexer.has("dot") ? { type: "dot" } : dot, lexer.has("identifier") ? { type: "identifier" } : identifier], postprocess: (d) => ({ type: "member", property: d[1].value }) },
      { name: "PostfixSuffix$ebnf$1", symbols: ["ArgumentList"], postprocess: id },
      {
        name: "PostfixSuffix$ebnf$1",
        symbols: [],
        postprocess: function (d) {
          return null;
        },
      },
      { name: "PostfixSuffix", symbols: [lexer.has("lparen") ? { type: "lparen" } : lparen, "PostfixSuffix$ebnf$1", lexer.has("rparen") ? { type: "rparen" } : rparen], postprocess: (d) => ({ type: "call", arguments: d[1] || [] }) },
      { name: "ArgumentList$ebnf$1", symbols: [] },
      { name: "ArgumentList$ebnf$1$subexpression$1", symbols: [lexer.has("comma") ? { type: "comma" } : comma, "Expression"] },
      {
        name: "ArgumentList$ebnf$1",
        symbols: ["ArgumentList$ebnf$1", "ArgumentList$ebnf$1$subexpression$1"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "ArgumentList",
        symbols: ["Expression", "ArgumentList$ebnf$1"],
        postprocess: (d) => {
          const list = [d[0]];
          for (const item of d[1]) {
            list.push(item[1]);
          }
          return list;
        },
      },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("identifier") ? { type: "identifier" } : identifier],
        postprocess: (d) => ({
          type: "Identifier",
          name: d[0].value,
        }),
      },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("macro_ident") ? { type: "macro_ident" } : macro_ident],
        postprocess: (d) => ({
          type: "Identifier",
          name: d[0].value.slice(0, -1),
        }),
      },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("number") ? { type: "number" } : number],
        postprocess: (d) => ({
          type: "Literal",
          value: Number(d[0].value),
          raw: d[0].value,
        }),
      },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("string") ? { type: "string" } : string],
        postprocess: (d) => ({
          type: "Literal",
          value: unquote(d[0].value),
          raw: d[0].value,
        }),
      },
      { name: "PrimaryExpression", symbols: [lexer.has("template_string") ? { type: "template_string" } : template_string], postprocess: (d) => parseTemplateLiteral(d[0].value) },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("kw_bool") ? { type: "kw_bool" } : kw_bool],
        postprocess: (d) => {
          const v = d[0].value.toLowerCase();
          return {
            type: "Literal",
            value: v === "true" || v === "yes",
            raw: d[0].value,
          };
        },
      },
      {
        name: "PrimaryExpression",
        symbols: [lexer.has("kw_null") ? { type: "kw_null" } : kw_null],
        postprocess: (d) => ({
          type: "Literal",
          value: null,
          raw: d[0].value,
        }),
      },
      { name: "PrimaryExpression", symbols: [lexer.has("lparen") ? { type: "lparen" } : lparen, "Expression", lexer.has("rparen") ? { type: "rparen" } : rparen], postprocess: (d) => d[1] },
    ],
    ParserStart: "Program",
  };
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = grammar;
  } else {
    window.grammar = grammar;
  }
})();
