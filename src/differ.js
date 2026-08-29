const { normalizeAST } = require("./hasher.js");

/**
 * Describes a single semantic difference between two AST nodes.
 * @typedef {{ path: string, a: string, b: string }} AstDifference
 */

/**
 * Recursively diffs two AST nodes (already-normalized or raw; both are
 * normalized internally). Because normalization unifies dialect keywords
 * (def/fn/void -> fn, return/give -> return, if/when -> if, while/repeat ->
 * while) and strips raw literals, pure dialect differences are invisible:
 * semantically identical code always produces `identical: true`.
 *
 * @param {object} nodeA
 * @param {object} nodeB
 * @param {string} [rootLabel="ast"] - Label used for the root path in results.
 * @returns {{ identical: boolean, differences: AstDifference[] }}
 */
function diffAST(nodeA, nodeB, rootLabel = "ast") {
  const differences = [];
  walk(nodeA, nodeB, rootLabel, differences);
  return { identical: differences.length === 0, differences };
}

function walk(a, b, path, differences) {
  if (a === b) {
    return;
  }

  const aType = kindOf(a);
  const bType = kindOf(b);

  // Different kinds entirely (e.g. object vs number, or different node types)
  if (aType !== bType) {
    differences.push({ path, a: describe(a), b: describe(b) });
    return;
  }

  if (aType === "array") {
    if (a.length !== b.length) {
      differences.push({ path, a: `array(${a.length})`, b: `array(${b.length})` });
      return;
    }
    for (let i = 0; i < a.length; i++) {
      walk(a[i], b[i], `${path}[${i}]`, differences);
    }
    return;
  }

  if (aType === "object") {
    // Different AST node types always count as a real difference
    if (a.type !== b.type) {
      differences.push({ path, a: describe(a), b: describe(b) });
      return;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) {
        differences.push({ path: `${path}.${key}`, a: "<absent>", b: describe(b[key]) });
      } else if (!Object.prototype.hasOwnProperty.call(b, key)) {
        differences.push({ path: `${path}.${key}`, a: describe(a[key]), b: "<absent>" });
      } else {
        walk(a[key], b[key], `${path}.${key}`, differences);
      }
    }
    return;
  }

  // Primitives that differ
  differences.push({ path, a: describe(a), b: describe(b) });
}

function kindOf(value) {
  if (value === null || value === undefined) return "nullish";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "primitive";
}

function describe(value) {
  if (value === null || value === undefined) return "<absent>";
  if (typeof value === "object") {
    const json = JSON.stringify(value);
    return json.length > 80 ? json.slice(0, 77) + "..." : json;
  }
  return String(value);
}

/**
 * Convenience: diff two ASTs after canonical normalization.
 * Equivalent to diffAST, but makes the normalization step explicit.
 *
 * @param {object} astA
 * @param {object} astB
 * @param {string} [labelA="a"]
 * @param {string} [labelB="b"]
 * @returns {{ identical: boolean, differences: AstDifference[] }}
 */
function diffPrograms(astA, astB, labelA = "a", labelB = "b") {
  const a = JSON.parse(JSON.stringify(normalizeAST(astA)));
  const b = JSON.parse(JSON.stringify(normalizeAST(astB)));
  const differences = [];
  walk(a, b, labelA, differences);
  return { identical: differences.length === 0, differences };
}

module.exports = {
  diffAST,
  diffPrograms,
};
