// SQLite adapter (Node 22+ built-in node:sqlite) exposing the interface core/api.js expects.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const raw = new DatabaseSync(file);
  raw.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const cache = new Map();
  const stmt = (sql) => { let s = cache.get(sql); if (!s) { s = raw.prepare(sql); cache.set(sql, s); } return s; };
  const norm = (row) => (row ? { ...row } : undefined);
  return {
    exec: (sql) => raw.exec(sql),
    all: (sql, params = []) => stmt(sql).all(...params).map(norm),
    get: (sql, params = []) => norm(stmt(sql).get(...params)),
    run: (sql, params = []) => { const r = stmt(sql).run(...params); return { id: Number(r.lastInsertRowid), changes: Number(r.changes) }; },
    close: () => raw.close()
  };
}
module.exports = { openDb };
