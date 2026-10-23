const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

// 1. Criar a tabela (com EXISTS no plural)
db.exec(`
  CREATE TABLE IF NOT EXISTS Medicamentos (
    codigo INTEGER PRIMARY KEY AUTOINCREMENT,
    Nome_comercial TEXT NOT NULL,
    Nome_generico TEXT,
    Unidade_de_medida TEXT,
    Validade REAL,
    Preco REAL NOT NULL
  ) STRICT
`);



// 3. Exportar no final do arquivo
module.exports = db;