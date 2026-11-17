const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Rota POST: Cadastrar novo coletor (/coletor)
router.post('/', (req, res) => {
    const { nome_completo, nome, cpf, telefone, senha } = req.body;
    const nomeValor = nome_completo !== undefined ? nome_completo : nome;

    if (!nomeValor || !nomeValor.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'nome_completo' é obrigatório." });
    }

    if (!cpf || !cpf.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'cpf' é obrigatório." });
    }

    if (!telefone || !telefone.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'telefone' é obrigatório." });
    }

    if (!senha || !senha.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'senha' é obrigatório." });
    }

    const nomeFormatado = nomeValor.toString().trim();
    const cpfFormatado = cpf.toString().trim();
    const telefoneFormatado = telefone.toString().trim();
    const senhaFormatada = senha.toString().trim();

    try {
        const stmt = db.prepare(`
            INSERT INTO coletores (nome_completo, cpf, telefone, senha, status)
            VALUES (?, ?, ?, ?, 'ativo')
        `);

        const info = stmt.run(nomeFormatado, cpfFormatado, telefoneFormatado, senhaFormatada);

        return res.status(201).json({
            message: "Coletor cadastrado com sucesso!",
            coletor: {
                codigo: info.lastInsertRowid,
                nome_completo: nomeFormatado,
                cpf: cpfFormatado,
                telefone: telefoneFormatado,
                status: 'ativo'
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ erro: "Já existe um coletor cadastrado com o CPF ou telefone informado." });
        }
        console.error("Erro ao cadastrar coletor:", error);
        return res.status(500).json({ erro: "Erro interno no servidor ao tentar cadastrar o coletor." });
    }
});

// Rota GET: Listar coletores ativos (/coletor)
router.get('/', (req, res) => {
    try {
        const coletores = db.prepare(`
            SELECT codigo, nome_completo, cpf, telefone, status, data_cadastro
            FROM coletores
            WHERE status = 'ativo'
            ORDER BY codigo DESC
        `).all();

        return res.status(200).json(coletores);
    } catch (error) {
        console.error("Erro ao listar coletores:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar a lista de coletores." });
    }
});

module.exports = router;
