const express = require('express');
const router = express.Router();
const db = require('../db');

// POST - Cadastrar gerente
router.post("/", (req, res) => {
    const { Cpf, Nome, Email, Telefone, Senha } = req.body;

    const cpfLimpo = Cpf ? String(Cpf).replace(/\D/g, '') : '';
    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : '';

    if (!cpfLimpo || !Nome || !teleLimpo || !Senha) {
        return res.status(400).json({
            erro: "Campos obrigatórios faltando (CPF, Nome, Telefone e Senha)."
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO gerente (Cpf, Nome, Email, Telefone, Senha)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            cpfLimpo,
            Nome.trim(),
            Email ? Email.trim() : null,
            teleLimpo,
            Senha
        );

        return res.status(201).json({
            message: "Gerente cadastrado com sucesso!",
            gerente: {
                codigo: result.lastInsertRowid,
                cpf: cpfLimpo,
                nome: Nome.trim(),
                email: Email ? Email.trim() : null,
                telefone: teleLimpo,
                status: "ativo"
            }
        });
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Este CPF já está cadastrado para outro gerente." });
        }

        console.error("Erro ao inserir gerente:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// GET - Listar apenas gerentes ativos
router.get("/", (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                Codigo as codigo, 
                Cpf as cpf, 
                Nome as nome, 
                Email as email, 
                Telefone as telefone,
                status,
                data_cadastro
            FROM gerente
            WHERE status = 'ativo'
        `);
        const gerentes = stmt.all();

        return res.status(200).json(gerentes);
    } catch (error) {
        console.error("Erro ao buscar gerentes:", error);
        return res.status(500).json({ error: "Erro interno ao buscar lista de gerentes." });
    }
});

// PUT - Atualizar gerente ativo
router.put("/:codigo", (req, res) => {
    const { codigo } = req.params;
    const { Nome, Email, Telefone, Senha } = req.body;

    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : '';

    if (!Nome || !teleLimpo || !Senha) {
        return res.status(400).json({
            erro: "Campos obrigatórios faltando (Nome, Telefone e Senha)."
        });
    }

    try {
        const stmt = db.prepare(`
            UPDATE gerente
            SET Nome = ?, Email = ?, Telefone = ?, Senha = ?
            WHERE Codigo = ? AND status = 'ativo'
        `);

        const info = stmt.run(
            Nome.trim(),
            Email ? Email.trim() : null,
            teleLimpo,
            Senha.trim(),
            codigo
        );

        if (info.changes === 0) {
            return res.status(404).json({
                erro: "Gerente não encontrado ou inativo."
            });
        }

        return res.status(200).json({
            message: "Cadastro de Gerente alterado com sucesso",
            gerente: {
                codigo: Number(codigo),
                nome: Nome.trim(),
                email: Email ? Email.trim() : null,
                telefone: teleLimpo
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar cadastro do Gerente:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar o Gerente." });
    }
});

// DELETE - Exclusão lógica (altera status para 'inativo')
router.delete("/:codigo", (req, res) => {
    const { codigo } = req.params;

    try {
        const stmt = db.prepare(`
            UPDATE gerente 
            SET status = 'inativo' 
            WHERE Codigo = ? AND status = 'ativo'
        `);
        const info = stmt.run(codigo);

        if (info.changes === 0) {
            return res.status(404).json({ erro: "Gerente não encontrado ou já está inativo." });
        }

        return res.status(200).json({ message: "Gerente inativado com sucesso!" });
    } catch (error) {
        console.error("Erro ao inativar o gerente:", error);
        return res.status(500).json({ error: "Erro interno ao inativar o cadastro do gerente." });
    }
});

module.exports = router;