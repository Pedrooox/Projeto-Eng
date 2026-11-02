const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

router.post("/", (req, res) => {
    const { Cpf, Nome, Email, Telefone, Senha } = req.body;

    const cpfLimpo = Cpf ? String(Cpf).replace(/\D/g, '') : '';
    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : '';

    // Validação de campos obrigatórios
    if (!cpfLimpo || !Nome || !Telefone || !Senha) {
        return res.status(400).json({
            erro: "Campos obrigatórios faltando (CPF, Nome, Telefone e Senha)."
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO gerente (Cpf, Nome, Email, Telefone, Senha)
            VALUES (?, ?, ?, ?, ?)
        `);

        // 1. Executa no banco e guarda o resultado na variável 
        const result = stmt.run(
            cpfLimpo, 
            Nome.trim(),
            Email, 
            teleLimpo, 
            Senha);

        // 2. Retorna a resposta ao cliente utilizando o ID gerado (result.lastInsertRowid)
        return res.status(201).json({
            message: "Gerente cadastrado com sucesso!",
            gerente: {
                codigo: result.lastInsertRowid,
                cpf: cpfLimpo,
                nome: Nome,
                email: Email,
                telefone: teleLimpo
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