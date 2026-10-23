const Database = require('better-sqlite3');
const db = new Database('farmacia.sqlite');

// Criação da tabela de medicamentos para o projeto
db.exec(`
    CREATE TABLE IF NOT EXISTS medicamentos (
        codigo INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_comercial TEXT NOT NULL,
        nome_generico TEXT,
        unidade_medida TEXT,
        validade TEXT,
        preco REAL NOT NULL
    );
`);

module.exports = db;