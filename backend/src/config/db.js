/**
 * db.js — SQLite adapter using Node 22's built-in `node:sqlite`
 *
 * Exposes the same async query() interface used across all route files:
 *   const [rows]   = await db.query("SELECT ...", [params])
 *   const [result] = await db.query("INSERT ...", [params])
 *     result → { insertId, affectedRows }
 *
 * node:sqlite is synchronous (like better-sqlite3) so we wrap each call
 * in a resolved Promise to satisfy the existing async/await callers.
 */

const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs   = require("fs");

const DB_PATH     = path.join(__dirname, "../../database/sit_in_system.db");
const SCHEMA_PATH = path.join(__dirname, "../../database/schema.sql");

// ---------------------------------------------------------------------------
// Ensure the database directory exists
// ---------------------------------------------------------------------------
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// ---------------------------------------------------------------------------
// Open (or create) the database file
// ---------------------------------------------------------------------------
const db = new DatabaseSync(DB_PATH);

// Performance / integrity PRAGMAs
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA synchronous = NORMAL;");

// ---------------------------------------------------------------------------
// Bootstrap schema only when the DB is brand-new (no tables yet)
// ---------------------------------------------------------------------------
const tableCheck = db.prepare(
  "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
).get();

if (tableCheck.n === 0) {
  console.log("🔨 New database — running schema initialisation…");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  try {
    db.exec(schema);
    console.log("✅ Schema initialised →", DB_PATH);
  } catch (err) {
    console.error("❌ Schema initialisation failed:", err.message);
    process.exit(1);
  }
} else {
  console.log("✅ Connected to existing SQLite database →", DB_PATH);
}

// ---------------------------------------------------------------------------
// Query wrapper — mirrors the mysql2 promise-pool interface
// ---------------------------------------------------------------------------
const wrapper = {
  /**
   * @param {string} sql
   * @param {any[]}  [params=[]]
   * @returns {Promise<[rows|result]>}
   */
  query(sql, params = []) {
    try {
      const verb = sql.trimStart().slice(0, 6).toUpperCase();
      const isRead =
        verb === "SELECT" || sql.trimStart().toUpperCase().startsWith("WITH");

      if (isRead) {
        const stmt = db.prepare(sql);
        // node:sqlite returns plain objects (not null-prototype) — spread to normalize
        const rows = stmt.all(...params).map((r) => ({ ...r }));
        return Promise.resolve([rows]);
      }

      // INSERT / UPDATE / DELETE / DDL
      const stmt   = db.prepare(sql);
      const result = stmt.run(...params);

      const meta = {
        affectedRows: result.changes ?? 0,
        insertId:     result.lastInsertRowid ?? null,
      };

      return Promise.resolve([meta]);
    } catch (err) {
      console.error("DB error:", err.message, "\nSQL:", sql.slice(0, 120));
      return Promise.reject(err);
    }
  },
};

module.exports = wrapper;
