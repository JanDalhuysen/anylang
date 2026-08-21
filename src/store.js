const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { hashAST, extractTerms, deterministicStringify } = require("./hasher.js");

class CodebaseStore {
  /**
   * @param {string} [customDbPath]
   */
  constructor(customDbPath) {
    if (customDbPath === ":memory:") {
      this.dbPath = ":memory:";
    } else {
      const defaultDir = path.resolve(process.cwd(), ".anylang");
      if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
      }
      this.dbPath = customDbPath ? path.resolve(process.cwd(), customDbPath) : path.join(defaultDir, "codebase.sqlite");
    }

    this.db = new DatabaseSync(this.dbPath);
    this.init();
  }

  /**
   * Initializes SQLite tables.
   */
  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS terms (
        hash TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        ast_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS names (
        namespace TEXT NOT NULL,
        name TEXT NOT NULL,
        hash TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (namespace, name),
        FOREIGN KEY (hash) REFERENCES terms(hash)
      );
    `);
  }

  /**
   * Saves an individual AST term (e.g. FunctionDeclaration or VariableDeclaration)
   * into the terms store and registers its name alias in the specified namespace.
   *
   * @param {string} name
   * @param {object} astNode
   * @param {string} [kind="function"]
   * @param {string} [namespace="default"]
   * @returns {{ hash: string, shortHash: string, name: string, namespace: string }}
   */
  saveTerm(name, astNode, kind = "function", namespace = "default") {
    const hash = hashAST(astNode);
    const shortHash = `#${hash.slice(0, 8)}`;
    const astJson = deterministicStringify(astNode);
    const now = Date.now();

    // Insert term if it doesn't already exist (content-addressed immutability)
    const insertTerm = this.db.prepare(`
      INSERT OR IGNORE INTO terms (hash, name, kind, ast_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTerm.run(hash, name, kind, astJson, now);

    // Register or update name alias
    const insertName = this.db.prepare(`
      INSERT OR REPLACE INTO names (namespace, name, hash, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    insertName.run(namespace, name, hash, now);

    return { hash, shortHash, name, namespace, kind };
  }

  /**
   * Ingests a complete Program AST, extracting and storing all top-level functions and variables.
   *
   * @param {object} programAst
   * @param {string} [namespace="default"]
   * @returns {Array<{ hash: string, shortHash: string, name: string, namespace: string, kind: string }>}
   */
  saveProgram(programAst, namespace = "default") {
    const extracted = extractTerms(programAst);
    const saved = [];

    for (const item of extracted) {
      const result = this.saveTerm(item.name, item.node, item.type, namespace);
      saved.push(result);
    }

    return saved;
  }

  /**
   * Retrieves a term AST by its human-readable name in a namespace.
   *
   * @param {string} name
   * @param {string} [namespace="default"]
   * @returns {object|null}
   */
  getTermByName(name, namespace = "default") {
    const query = this.db.prepare(`
      SELECT n.name, n.namespace, n.hash, n.updated_at, t.kind, t.ast_json, t.created_at
      FROM names n
      JOIN terms t ON n.hash = t.hash
      WHERE n.name = ? AND n.namespace = ?
    `);
    const row = query.get(name, namespace);
    if (!row) return null;

    return {
      name: row.name,
      namespace: row.namespace,
      hash: row.hash,
      shortHash: `#${row.hash.slice(0, 8)}`,
      kind: row.kind,
      ast: JSON.parse(row.ast_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Retrieves a term AST directly by its content hash.
   *
   * @param {string} hash
   * @returns {object|null}
   */
  getTermByHash(hash) {
    const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
    const query = this.db.prepare(`
      SELECT hash, name, kind, ast_json, created_at
      FROM terms
      WHERE hash = ? OR hash LIKE ?
    `);
    const row = query.get(cleanHash, `${cleanHash}%`);
    if (!row) return null;

    return {
      hash: row.hash,
      shortHash: `#${row.hash.slice(0, 8)}`,
      name: row.name,
      kind: row.kind,
      ast: JSON.parse(row.ast_json),
      createdAt: row.created_at,
    };
  }

  /**
   * Lists all terms registered in the codebase.
   *
   * @param {string|null} [namespace=null]
   * @returns {Array<object>}
   */
  listTerms(namespace = null) {
    let query;
    let rows;

    if (namespace) {
      query = this.db.prepare(`
        SELECT n.name, n.namespace, n.hash, n.updated_at, t.kind, t.created_at
        FROM names n
        JOIN terms t ON n.hash = t.hash
        WHERE n.namespace = ?
        ORDER BY n.name ASC
      `);
      rows = query.all(namespace);
    } else {
      query = this.db.prepare(`
        SELECT n.name, n.namespace, n.hash, n.updated_at, t.kind, t.created_at
        FROM names n
        JOIN terms t ON n.hash = t.hash
        ORDER BY n.namespace ASC, n.name ASC
      `);
      rows = query.all();
    }

    return rows.map((r) => ({
      name: r.name,
      namespace: r.namespace,
      hash: r.hash,
      shortHash: `#${r.hash.slice(0, 8)}`,
      kind: r.kind,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  /**
   * Renames a term alias without modifying or breaking the underlying content-addressed term.
   *
   * @param {string} oldName
   * @param {string} newName
   * @param {string} [namespace="default"]
   * @returns {boolean}
   */
  renameTerm(oldName, newName, namespace = "default") {
    const existing = this.getTermByName(oldName, namespace);
    if (!existing) {
      throw new Error(`Term '${oldName}' not found in namespace '${namespace}'.`);
    }

    const now = Date.now();
    // Add new alias pointing to the same hash
    const insertNew = this.db.prepare(`
      INSERT OR REPLACE INTO names (namespace, name, hash, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    insertNew.run(namespace, newName, existing.hash, now);

    // Remove old alias
    const deleteOld = this.db.prepare(`
      DELETE FROM names WHERE namespace = ? AND name = ?
    `);
    deleteOld.run(namespace, oldName);

    return true;
  }

  /**
   * Closes database connection.
   */
  close() {
    this.db.close();
  }
}

module.exports = { CodebaseStore };
