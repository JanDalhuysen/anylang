// AnyLang Transpiler: Generates executable JavaScript from the AnyLang AST

function transpile(ast, indentLevel = 0) {
  if (!ast) return "";
  const indent = "  ".repeat(indentLevel);

  switch (ast.type) {
    case "Program": {
      return ast.body.map((stmt) => transpile(stmt, indentLevel)).join("\n");
    }

    case "VariableDeclaration": {
      const kw = ast.keyword === "const" ? "const" : "let";
      const val = ast.value ? ` = ${transpile(ast.value, 0)}` : "";
      return `${indent}${kw} ${ast.name}${val};`;
    }

    case "FunctionDeclaration": {
      const params = ast.params.join(", ");
      const body = transpile(ast.body, indentLevel);
      return `${indent}function ${ast.name}(${params})\n${body}`;
    }

    case "Block": {
      const inner = ast.body.map((stmt) => transpile(stmt, indentLevel + 1)).join("\n");
      return `${indent}{\n${inner}\n${indent}}`;
    }

    case "IfStatement": {
      let cond = transpile(ast.condition, 0);
      if (ast.keyword === "unless") {
        cond = `!(${cond})`;
      }
      const consequent = transpile(ast.consequent, indentLevel);
      let res = `${indent}if (${cond})\n${consequent}`;
      if (ast.alternate) {
        if (ast.alternate.type === "IfStatement") {
          res += `\n${indent}else ${transpile(ast.alternate, indentLevel).trimStart()}`;
        } else {
          res += `\n${indent}else\n${transpile(ast.alternate, indentLevel)}`;
        }
      }
      return res;
    }

    case "WhileStatement": {
      let cond = transpile(ast.condition, 0);
      if (ast.keyword === "until") {
        cond = `!(${cond})`;
      }
      const body = transpile(ast.body, indentLevel);
      return `${indent}while (${cond})\n${body}`;
    }

    case "ReturnStatement": {
      const arg = ast.argument ? ` ${transpile(ast.argument, 0)}` : "";
      return `${indent}return${arg};`;
    }

    case "AssignmentStatement": {
      const target = transpile(ast.target, 0);
      const val = transpile(ast.value, 0);
      return `${indent}${target} ${ast.operator} ${val};`;
    }

    case "ExpressionStatement": {
      return `${indent}${transpile(ast.expression, 0)};`;
    }

    case "BinaryExpression": {
      const opMap = {
        and: "&&",
        or: "||",
        is: "===",
        "is not": "!==",
      };
      const op = opMap[ast.operator] || ast.operator;
      const left = transpile(ast.left, 0);
      const right = transpile(ast.right, 0);
      return `(${left} ${op} ${right})`;
    }

    case "UnaryExpression": {
      const op = ast.operator === "not" ? "!" : ast.operator;
      const arg = transpile(ast.argument, 0);
      return `(${op}${arg})`;
    }

    case "CallExpression": {
      const callee = transpile(ast.callee, 0);
      const args = ast.arguments.map((a) => transpile(a, 0)).join(", ");
      return `${callee}(${args})`;
    }

    case "MemberExpression": {
      const obj = transpile(ast.object, 0);
      return `${obj}.${ast.property}`;
    }

    case "Identifier": {
      return ast.name;
    }

    case "Literal": {
      return JSON.stringify(ast.value);
    }

    case "TemplateLiteral": {
      const inner = ast.parts
        .map((part) => {
          if (part.type === "Literal") {
            return part.value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
          } else if (part.type === "TemplateExpression") {
            return `\${${part.expression}}`;
          }
          return "";
        })
        .join("");
      return `\`${inner}\``;
    }

    default:
      throw new Error(`Unknown AST Node Type: ${ast.type}`);
  }
}

module.exports = { transpile };
