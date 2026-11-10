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

// Criação da tabela de farmacêuticos
db.exec(`
    CREATE TABLE IF NOT EXISTS farmaceuticos (
        codigo INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        data_nascimento TEXT NOT NULL,
        crf TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        email TEXT UNIQUE,
        telefone TEXT,
        status TEXT NOT NULL DEFAULT 'ativo',
        motivo_exclusao TEXT,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = db;
