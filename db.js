const Database = require('better-sqlite3');
const db = new Database('farmacia.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    codigo_barras TEXT NOT NULL UNIQUE,
    preco REAL NOT NULL
  ) STRICT
`);

module.exports = db;