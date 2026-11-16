const express = require('express');
const router = express.Router();
const db = require('../db');

// POST - Cadastrar cliente
router.post("/", (req, res) => {
    const { Cpf, Nome, Email, Telefone } = req.body;

    const cpfLimpo = Cpf ? String(Cpf).replace(/\D/g, '') : '';
    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : null;

    // Validação dos campos obrigatórios definidos na issue (CPF e E-mail)
    if (!cpfLimpo || !Email || !Email.trim()) {
        return res.status(400).json({
            erro: "Campos obrigatórios faltando (CPF e E-mail)."
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO cliente (Cpf, Nome, Email, Telefone)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(
            cpfLimpo,
            Nome ? Nome.trim() : null,
            Email.trim(),
            teleLimpo || null
        );

        return res.status(201).json({
            message: "Cliente cadastrado com sucesso!",
            cliente: {
                codigo: result.lastInsertRowid,
                cpf: cpfLimpo,
                nome: Nome ? Nome.trim() : null,
                email: Email.trim(),
                telefone: teleLimpo || null,
                status: "ativo"
            }
        });
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({
                erro: "Este CPF já está cadastrado para outro cliente."
            });
        }

        console.error("Erro ao inserir cliente:", error);
        return res.status(500).json({ erro: "Erro interno no servidor." });
    }
});