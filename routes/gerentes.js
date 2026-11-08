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

router.put("/:codigo", (req, res) => {  
    const { codigo } = req.params; 
    const { Nome, Email, Telefone, Senha} = req.body;

    const teleLimpo = Telefone ? String(Telefone).replace(/\D/g, '') : '';

    if ( !Nome || !teleLimpo || !Senha) {
        return res.status(400).json({
            erro: "Campos obrigatórios faltando (Nome, Telefone e Senha)."
        });
    }

    try {
        const smt = db.prepare (`
            UPDATE gerente
            SET Nome = ?, Email = ?, Telefone = ?, Senha = ?
            WHERE codigo = ?
            `);

        // Passagem dos parâmetros na ordem exata das '?' do SQL
        const info = smt.run(
            Nome.trim(), 
            Email.trim(), 
            teleLimpo,  
            Senha.trim(),
            codigo   
        );

        if (info.changes === 0) {
            return res.status(404).json({ 
                erro: "Gerente não encontrado." 
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