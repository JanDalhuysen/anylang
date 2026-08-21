const crypto = require("crypto");

/**
 * Normalizes an AST node to produce a canonical representation.
 * Strips syntactic sugar, keywords, and non-semantic properties so
 * identical logic produces identical ASTs.
 */
function normalizeAST(node) {
  if (node === null || node === undefined) {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => normalizeAST(item));
  }

  if (typeof node !== "object") {
    return node;
  }

  const normalized = {};
  const keys = Object.keys(node).sort();

  for (const key of keys) {
    // Strip superficial syntactic variations
    if (key === "keyword") {
      // Unify function declaration keywords (def/fn/void/sub -> fn)
      if (node.type === "FunctionDeclaration") {
        normalized[key] = "fn";
        continue;
      }
      // Unify return keywords (return/give/yield/result -> return)
      if (node.type === "ReturnStatement") {
        normalized[key] = "return";
        continue;
      }
      // Unify if keywords (if/when -> if)
      if (node.type === "IfStatement" && (node.keyword === "if" || node.keyword === "when")) {
        normalized[key] = "if";
        continue;
      }
      // Unify while keywords (while/repeat -> while)
      if (node.type === "WhileStatement" && (node.keyword === "while" || node.keyword === "repeat")) {
        normalized[key] = "while";
        continue;
      }
    }

    // Strip raw formatting representation from literals
    if (key === "raw") {
      continue;
    }

    normalized[key] = normalizeAST(node[key]);
  }

  return normalized;
}

/**
 * Deterministic JSON stringifier (ensures sorted keys).
 */
function deterministicStringify(obj) {
  return JSON.stringify(normalizeAST(obj));
}

/**
 * Computes a SHA-256 hash of a normalized AST node.
 * @param {object} astNode
 * @param {number} [length] - Optional length to truncate hash (default: full 64 chars)
 * @returns {string} Hex hash string
 */
function hashAST(astNode, length = 64) {
  const json = deterministicStringify(astNode);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return length ? hash.slice(0, length) : hash;
}

/**
 * Extracts all top-level terms (functions and variable declarations) from a Program AST.
 * @param {object} programAst
 * @returns {Array<{name: string, type: string, node: object, hash: string, shortHash: string}>}
 */
function extractTerms(programAst) {
  if (!programAst || programAst.type !== "Program" || !Array.isArray(programAst.body)) {
    return [];
  }

  const terms = [];
  for (const stmt of programAst.body) {
    if (stmt.type === "FunctionDeclaration") {
      const hash = hashAST(stmt);
      terms.push({
        name: stmt.name,
        type: "function",
        node: stmt,
        hash,
        shortHash: `#${hash.slice(0, 8)}`,
      });
    } else if (stmt.type === "VariableDeclaration") {
      const hash = hashAST(stmt);
      terms.push({
        name: stmt.name,
        type: "variable",
        node: stmt,
        hash,
        shortHash: `#${hash.slice(0, 8)}`,
      });
    }
  }

  return terms;
}

module.exports = {
  normalizeAST,
  deterministicStringify,
  hashAST,
  extractTerms,
};
