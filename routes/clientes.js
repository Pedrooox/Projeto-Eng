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

// PUT - Atualizar cliente ativo
router.put("/:codigo", (req, res) => {
    const { codigo } = req.params;
    const { Nome, Email, Telefone } = req.body;

    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : null;

    if (!Email || !Email.trim()) {
        return res.status(400).json({
            erro: "O campo E-mail é obrigatório."
        });
    }

    try {
        const stmt = db.prepare(`
            UPDATE cliente
            SET Nome = ?, Email = ?, Telefone = ?
            WHERE Codigo = ? AND status = 'ativo'
        `);

        const info = stmt.run(
            Nome ? Nome.trim() : null,
            Email.trim(),
            teleLimpo || null,
            codigo
        );

        if (info.changes === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado ou inativo."
            });
        }

        return res.status(200).json({
            message: "Cadastro de Cliente alterado com sucesso!",
            cliente: {
                codigo: Number(codigo),
                nome: Nome ? Nome.trim() : null,
                email: Email.trim(),
                telefone: teleLimpo || null
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar cadastro do Cliente:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar o Cliente." });
    }
});

// DELETE - Exclusão lógica (altera status para 'inativo')
router.delete("/:codigo", (req, res) => {
    const { codigo } = req.params;

    try {
        const stmt = db.prepare(`
            UPDATE cliente 
            SET status = 'inativo' 
            WHERE Codigo = ? AND status = 'ativo'
        `);
        const info = stmt.run(codigo);

        if (info.changes === 0) {
            return res.status(404).json({ erro: "Cliente não encontrado ou já está inativo." });
        }

        return res.status(200).json({ message: "Cliente inativado com sucesso!" });
    } catch (error) {
        console.error("Erro ao inativar o cliente:", error);
        return res.status(500).json({ erro: "Erro interno ao inativar o cadastro do cliente." });
    }
});

module.exports = router;