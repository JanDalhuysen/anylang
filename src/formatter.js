// Unison-style Dialect Formatter / Semantic Code Projector
// Transforms the canonical AST into any target language syntax flavor

function formatDialect(ast, dialect = "csharp", indentLevel = 0) {
  if (!ast) return "";
  const indent = "  ".repeat(indentLevel);

  switch (ast.type) {
    case "Program": {
      return ast.body.map((stmt) => formatDialect(stmt, dialect, indentLevel)).join("\n");
    }

    case "VariableDeclaration": {
      let kw = "let";
      if (dialect === "csharp" || dialect === "java") kw = "var";
      else if (dialect === "rust") kw = "let";
      else if (dialect === "pythonic") {
        const val = ast.value ? ` = ${formatDialect(ast.value, dialect, 0)}` : " = None";
        return `${indent}${ast.name}${val}`;
      }

      const val = ast.value ? ` = ${formatDialect(ast.value, dialect, 0)}` : "";
      return `${indent}${kw} ${ast.name}${val};`;
    }

    case "FunctionDeclaration": {
      let fnKw = "function";
      if (dialect === "csharp" || dialect === "java") fnKw = "void";
      else if (dialect === "rust") fnKw = "fn";
      else if (dialect === "pythonic") fnKw = "def";

      const params = ast.params.join(", ");
      const body = formatDialect(ast.body, dialect, indentLevel);
      return `${indent}${fnKw} ${ast.name}(${params})\n${body}`;
    }

    case "Block": {
      const inner = ast.body
        .map((stmt) => formatDialect(stmt, dialect, indentLevel + 1))
        .join("\n");
      return `${indent}{\n${inner}\n${indent}}`;
    }

    case "IfStatement": {
      const cond = formatDialect(ast.condition, dialect, 0);
      const consequent = formatDialect(ast.consequent, dialect, indentLevel);
      let res = `${indent}if (${cond})\n${consequent}`;
      if (ast.alternate) {
        if (ast.alternate.type === "IfStatement") {
          res += `\n${indent}else ${formatDialect(ast.alternate, dialect, indentLevel).trimStart()}`;
        } else {
          res += `\n${indent}else\n${formatDialect(ast.alternate, dialect, indentLevel)}`;
        }
      }
      return res;
    }

    case "WhileStatement": {
      const cond = formatDialect(ast.condition, dialect, 0);
      const body = formatDialect(ast.body, dialect, indentLevel);
      return `${indent}while (${cond})\n${body}`;
    }

    case "ReturnStatement": {
      const arg = ast.argument ? ` ${formatDialect(ast.argument, dialect, 0)}` : "";
      const semi = dialect === "pythonic" ? "" : ";";
      return `${indent}return${arg}${semi}`;
    }

    case "AssignmentStatement": {
      const target = formatDialect(ast.target, dialect, 0);
      const val = formatDialect(ast.value, dialect, 0);
      const semi = dialect === "pythonic" ? "" : ";";
      return `${indent}${target} ${ast.operator} ${val}${semi}`;
    }

    case "ExpressionStatement": {
      const expr = formatDialect(ast.expression, dialect, 0);
      const semi = dialect === "pythonic" ? "" : ";";
      return `${indent}${expr}${semi}`;
    }

    case "BinaryExpression": {
      let op = ast.operator;
      if (dialect === "pythonic") {
        if (op === "&&") op = "and";
        if (op === "||") op = "or";
        if (op === "===") op = "==";
      }
      const left = formatDialect(ast.left, dialect, 0);
      const right = formatDialect(ast.right, dialect, 0);
      return `(${left} ${op} ${right})`;
    }

    case "UnaryExpression": {
      let op = ast.operator;
      if (dialect === "pythonic" && op === "!") op = "not ";
      const arg = formatDialect(ast.argument, dialect, 0);
      return `(${op}${arg})`;
    }

    case "CallExpression": {
      const callee = formatDialect(ast.callee, dialect, 0);
      const args = ast.arguments.map((a) => formatDialect(a, dialect, 0)).join(", ");
      return `${callee}(${args})`;
    }

    case "MemberExpression": {
      const obj = formatDialect(ast.object, dialect, 0);
      return `${obj}.${ast.property}`;
    }

    case "Identifier": {
      return ast.name;
    }

    case "Literal": {
      if (dialect === "pythonic") {
        if (ast.value === true) return "True";
        if (ast.value === false) return "False";
        if (ast.value === null) return "None";
      }
      return JSON.stringify(ast.value);
    }

    default:
      throw new Error(`Unknown AST Node: ${ast.type}`);
  }
}

module.exports = { formatDialect };
