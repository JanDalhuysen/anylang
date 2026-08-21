# -----------------------------------------------------------------------------
# AnyLang Grammar (Nearley EBNF)
# -----------------------------------------------------------------------------
@{%
const { lexer } = require("./scanner.js");

function unquote(str) {
  return str.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
}
%}

@lexer lexer

# -----------------------------------------------------------------------------
# Top-Level Program & Statements
# -----------------------------------------------------------------------------
Program -> Statement:* {%
  (d) => ({
    type: "Program",
    body: d[0]
  })
%}

Statement
    -> VariableDeclaration {% id %}
     | FunctionDeclaration {% id %}
     | IfStatement         {% id %}
     | WhileStatement      {% id %}
     | ReturnStatement     {% id %}
     | AssignmentStatement {% id %}
     | ExpressionStatement {% id %}
     | Block               {% id %}

# --- Variable Declarations (e.g., let x = 10; int x = 10; const name = "Ada";) ---
VariableDeclaration -> %kw_var %identifier (%assign_op Expression):? %semicolon {%
  (d) => ({
    type: "VariableDeclaration",
    keyword: d[0].value,
    name: d[1].value,
    value: d[2] ? d[2][1] : null
  })
%}

# --- Function Declarations (e.g., def add(a, b) { ... }, void main() { ... }) ---
FunctionDeclaration -> %kw_fn %identifier %lparen ParameterList:? %rparen Block {%
  (d) => ({
    type: "FunctionDeclaration",
    keyword: d[0].value,
    name: d[1].value,
    params: d[3] || [],
    body: d[5]
  })
%}

ParameterList -> %identifier (%comma %identifier):* {%
  (d) => {
    const list = [d[0].value];
    for (const item of d[1]) {
      list.push(item[1].value);
    }
    return list;
  }
%}

Block -> %lbrace Statement:* %rbrace {%
  (d) => ({
    type: "Block",
    body: d[1]
  })
%}

# --- Control Flow: If / Unless / When ---
IfStatement -> %kw_if %lparen Expression %rparen Block ElseClause:? {%
  (d) => ({
    type: "IfStatement",
    keyword: d[0].value,
    condition: d[2],
    consequent: d[4],
    alternate: d[5] || null
  })
%}

ElseClause
    -> %kw_else Block {%
        (d) => d[1]
       %}
     | %kw_else IfStatement {%
        (d) => d[1]
       %}

# --- Loops: While / Until / Repeat ---
WhileStatement -> %kw_while %lparen Expression %rparen Block {%
  (d) => ({
    type: "WhileStatement",
    keyword: d[0].value,
    condition: d[2],
    body: d[4]
  })
%}

# --- Returns: return / give / yield / result ---
ReturnStatement
    -> %kw_return Expression %semicolon {%
        (d) => ({
          type: "ReturnStatement",
          keyword: d[0].value,
          argument: d[1]
        })
       %}
     | %kw_return %semicolon {%
        (d) => ({
          type: "ReturnStatement",
          keyword: d[0].value,
          argument: null
        })
       %}

# --- Assignments (e.g., x = 5; x += 1; obj.prop = 2;) ---
AssignmentStatement -> PostfixExpression %assign_op Expression %semicolon {%
  (d) => ({
    type: "AssignmentStatement",
    target: d[0],
    operator: d[1].value,
    value: d[2]
  })
%}

ExpressionStatement -> Expression %semicolon {%
  (d) => ({
    type: "ExpressionStatement",
    expression: d[0]
  })
%}

# -----------------------------------------------------------------------------
# Expressions & Precedence Hierarchy
# -----------------------------------------------------------------------------
Expression -> LogicalOrExpression {% id %}

LogicalOrExpression
    -> LogicalOrExpression %op_logical LogicalAndExpression {%
        (d) => ({
          type: "BinaryExpression",
          operator: d[1].value,
          left: d[0],
          right: d[2]
        })
       %}
     | LogicalAndExpression {% id %}

LogicalAndExpression
    -> LogicalAndExpression %op_compare ComparisonExpression {%
        (d) => ({
          type: "BinaryExpression",
          operator: d[1].value,
          left: d[0],
          right: d[2]
        })
       %}
     | ComparisonExpression {% id %}

ComparisonExpression
    -> ComparisonExpression AdditiveOp AdditiveExpression {%
        (d) => ({
          type: "BinaryExpression",
          operator: d[1],
          left: d[0],
          right: d[2]
        })
       %}
     | AdditiveExpression {% id %}

AdditiveOp -> %plus {% (d) => d[0].value %} | %minus {% (d) => d[0].value %}

AdditiveExpression
    -> AdditiveExpression MultiplicativeOp MultiplicativeExpression {%
        (d) => ({
          type: "BinaryExpression",
          operator: d[1],
          left: d[0],
          right: d[2]
        })
       %}
     | MultiplicativeExpression {% id %}

MultiplicativeOp
    -> %times   {% (d) => d[0].value %}
     | %divide  {% (d) => d[0].value %}
     | %modulo  {% (d) => d[0].value %}

MultiplicativeExpression
    -> UnaryExpression {% id %}

UnaryExpression
    -> %minus UnaryExpression {%
        (d) => ({
          type: "UnaryExpression",
          operator: "-",
          argument: d[1]
        })
       %}
     | %op_logical UnaryExpression {%
        (d) => ({
          type: "UnaryExpression",
          operator: d[0].value,
          argument: d[1]
        })
       %}
     | PostfixExpression {% id %}

PostfixExpression
    -> PrimaryExpression PostfixSuffix:* {%
        (d) => {
          let expr = d[0];
          for (const suffix of d[1]) {
            if (suffix.type === "call") {
              expr = {
                type: "CallExpression",
                callee: expr,
                arguments: suffix.arguments
              };
            } else if (suffix.type === "member") {
              expr = {
                type: "MemberExpression",
                object: expr,
                property: suffix.property
              };
            }
          }
          return expr;
        }
       %}

PostfixSuffix
    -> %dot %identifier {%
        (d) => ({ type: "member", property: d[1].value })
       %}
     | %lparen ArgumentList:? %rparen {%
        (d) => ({ type: "call", arguments: d[1] || [] })
       %}

ArgumentList -> Expression (%comma Expression):* {%
  (d) => {
    const list = [d[0]];
    for (const item of d[1]) {
      list.push(item[1]);
    }
    return list;
  }
%}

PrimaryExpression
    -> %identifier {%
        (d) => ({
          type: "Identifier",
          name: d[0].value
        })
       %}
     | %number {%
        (d) => ({
          type: "Literal",
          value: Number(d[0].value),
          raw: d[0].value
        })
       %}
     | %string {%
        (d) => ({
          type: "Literal",
          value: unquote(d[0].value),
          raw: d[0].value
        })
       %}
     | %kw_bool {%
        (d) => {
          const v = d[0].value.toLowerCase();
          return {
            type: "Literal",
            value: (v === "true" || v === "yes"),
            raw: d[0].value
          };
        }
       %}
     | %kw_null {%
        (d) => ({
          type: "Literal",
          value: null,
          raw: d[0].value
        })
       %}
     | %lparen Expression %rparen {%
        (d) => d[1]
       %}



