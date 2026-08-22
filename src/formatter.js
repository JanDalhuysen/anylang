// Unison-style Dialect Formatter / Semantic Code Projector
// Transforms the canonical AST into any target language syntax flavor

function getCalleePath(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const objPath = getCalleePath(node.object);
    return objPath ? `${objPath}.${node.property}` : node.property;
  }
  return "";
}

const PRINT_FUNCTIONS = new Set(["print", "println", "echo", "puts", "printf", "console.log", "fmt.Println", "fmt.Print", "fmt.Printf", "System.out.println", "System.out.print", "Console.WriteLine", "Console.Write"]);

// Splits a leading Rust-style format string (e.g. the "{}" in println!("{}", x))
// away from the real arguments so other dialects don't see it.
function splitFormatArgs(args) {
  if (args.length >= 1 && args[0].type === "Literal" && typeof args[0].value === "string") {
    const placeholders = (args[0].value.match(/\{\}/g) || []).length;
    if (placeholders > 0 && placeholders === args.length - 1) {
      return { formatString: args[0], values: args.slice(1) };
    }
  }
  return { formatString: null, values: args };
}

function formatPrintCall(calleePath, args, dialect) {
  const isNoNewline = calleePath === "print" || calleePath === "fmt.Print" || calleePath === "System.out.print" || calleePath === "Console.Write";
  const { formatString, values } = splitFormatArgs(args);

  if (dialect === "rust") {
    const macroName = isNoNewline ? "print!" : "println!";
    if (formatString) {
      const parts = [JSON.stringify(formatString.value), ...values.map((v) => formatDialect(v, dialect, 0))];
      return `${macroName}(${parts.join(", ")})`;
    }
    if (values.length === 0) {
      return `${macroName}()`;
    }
    if (values.length === 1) {
      const arg = values[0];
      if (arg.type === "Literal" && typeof arg.value === "string" && !arg.value.includes("{") && !arg.value.includes("}")) {
        return `${macroName}(${JSON.stringify(arg.value)})`;
      }
      return `${macroName}("{}", ${formatDialect(arg, dialect, 0)})`;
    }
    const placeholders = values.map(() => "{}").join(" ");
    const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
    return `${macroName}("${placeholders}", ${formattedArgs})`;
  }

  if (dialect === "pythonic") {
    const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
    if (isNoNewline) {
      return `print(${formattedArgs}, end="")`;
    }
    return `print(${formattedArgs})`;
  }

  if (dialect === "csharp") {
    const method = isNoNewline ? "Console.Write" : "Console.WriteLine";
    const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
    return `${method}(${formattedArgs})`;
  }

  if (dialect === "java") {
    const method = isNoNewline ? "System.out.print" : "System.out.println";
    const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
    return `${method}(${formattedArgs})`;
  }

  if (dialect === "javascript") {
    const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
    return `console.log(${formattedArgs})`;
  }

  const formattedArgs = values.map((a) => formatDialect(a, dialect, 0)).join(", ");
  return `println(${formattedArgs})`;
}

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
      const inner = ast.body.map((stmt) => formatDialect(stmt, dialect, indentLevel + 1)).join("\n");
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
        if (op === "!==") op = "!=";
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
      const calleePath = getCalleePath(ast.callee);

      // Normalize standard library output/print calls into dialect-specific forms
      if (PRINT_FUNCTIONS.has(calleePath)) {
        return formatPrintCall(calleePath, ast.arguments, dialect);
      }

      // Normalize length calls: len(x), size(x), count(x)
      if ((calleePath === "len" || calleePath === "size" || calleePath === "count") && ast.arguments.length === 1) {
        const target = formatDialect(ast.arguments[0], dialect, 0);
        if (dialect === "rust") return `${target}.len()`;
        if (dialect === "pythonic") return `len(${target})`;
        if (dialect === "csharp") return `${target}.Length`;
        if (dialect === "javascript") return `${target}.length`;
      }

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

    case "TemplateLiteral": {
      if (dialect === "pythonic") {
        const inner = ast.parts
          .map((part) => {
            if (part.type === "Literal") {
              return part.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\{/g, "{{").replace(/\}/g, "}}");
            } else if (part.type === "TemplateExpression") {
              return `{${part.expression}}`;
            }
            return "";
          })
          .join("");
        return `f"${inner}"`;
      }

      if (dialect === "csharp") {
        const inner = ast.parts
          .map((part) => {
            if (part.type === "Literal") {
              return part.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\{/g, "{{").replace(/\}/g, "}}");
            } else if (part.type === "TemplateExpression") {
              return `{${part.expression}}`;
            }
            return "";
          })
          .join("");
        return `$"${inner}"`;
      }

      if (dialect === "rust") {
        const inner = ast.parts
          .map((part) => {
            if (part.type === "Literal") {
              return part.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\{/g, "{{").replace(/\}/g, "}}");
            } else if (part.type === "TemplateExpression") {
              return `{${part.expression}}`;
            }
            return "";
          })
          .join("");
        return `format!("${inner}")`;
      }

      // Default: JavaScript style backtick template literal
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
      throw new Error(`Unknown AST Node: ${ast.type}`);
  }
}

module.exports = { formatDialect };
