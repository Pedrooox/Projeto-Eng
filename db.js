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
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0
    );
`);

// Criação da tabela de produtos (não-medicamentos: higiene, cosméticos, perfumaria, etc.)
db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
        codigo INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        marca TEXT,
        codigo_barras TEXT UNIQUE,
        unidade_medida TEXT,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS gerente (
    Codigo INTEGER PRIMARY KEY AUTOINCREMENT,
    CPF TEXT NOT NULL UNIQUE, 
    Nome TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    Telefone TEXT NOT NULL,
    Senha TEXT NOT NULL
    );
`)
module.exports = db;
