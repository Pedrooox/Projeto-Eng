const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Rota POST: Criar medicamento no banco de dados
router.post("/Cadatro_medicamento", (req, res) => {
    const { nome_comercial, nome_generico, unidade_medida, validade, preco } = req.body;

    const precoNumerico = Number(preco);

    if (!nome_comercial || !unidade_medida || !validade || isNaN(precoNumerico) || precoNumerico <= 0) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes ou preço inválido."
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO medicamentos (nome_comercial, nome_generico, unidade_medida, validade, preco)
            VALUES (?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            nome_comercial.trim(),
            nome_generico ? nome_generico.trim() : null,
            unidade_medida.trim(),
            validade,
            precoNumerico
        );

        return res.status(201).json({
            message: "Medicamento cadastrado com sucesso!",
            medicamento: {
                codigo: info.lastInsertRowid,
                nome_comercial,
                nome_generico,
                unidade_medida,
                validade,
                preco: precoNumerico
            }
        });
    } catch (error) {
        console.error("Erro ao inserir medicamento:", error);
        return res.status(500).json({ error: "Erro interno no servidor ao tentar cadastrar o medicamento." });
    }
});

// Rota GET: Listar catálogo de medicamentos
router.get("/Listar_medicamento", (req, res) => {
    try {
        const medicamentos = db.prepare('SELECT * FROM medicamentos ORDER BY codigo DESC').all();
        return res.status(200).json(medicamentos);
    } catch (error) {
        console.error("Erro ao buscar medicamentos:", error);
        return res.status(500).json({ error: "Erro ao buscar a listagem de medicamentos." });
    }
});

// Rota PUT: Alterar medicamento por código
router.put("/Alterar_medicamento/:codigo", (req, res) => {
    const { codigo } = req.params;
    const { nome_comercial, nome_generico, unidade_medida, validade, preco } = req.body; 
    const precoNumerico = Number(preco);

    if (!nome_comercial || !unidade_medida || !validade || isNaN(precoNumerico) || precoNumerico <= 0) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes ou preço inválido."
        });
    }

    try {
        const stmt = db.prepare(`
            UPDATE medicamentos 
            SET nome_comercial = ?, nome_generico = ?, unidade_medida = ?, validade = ?, preco = ? 
            WHERE codigo = ?
        `);
        
        const info = stmt.run(
            nome_comercial.trim(),
            nome_generico ? nome_generico.trim() : null,
            unidade_medida.trim(),
            validade,
            precoNumerico,
            codigo
        );

        if (info.changes === 0) {
            return res.status(404).json({ 
                erro: "Medicamento não encontrado." 
            });
        }
    
        return res.status(200).json({
            message: "Medicamento alterado com sucesso!",
            medicamento: {
                codigo: Number(codigo),
                nome_comercial,
                nome_generico,
                unidade_medida,
                validade,
                preco: precoNumerico
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar medicamento:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar o medicamento." });
    }
});

// Rota DELETE: deleta algum medicamento
router.delete("/Deletar_medicamento/:codigo", (req, res) => {
    const { codigo } = req.params;

    try {
        const stmt = db.prepare('DELETE FROM medicamentos WHERE codigo = ?');
        const info = stmt.run(codigo);

        if (info.changes === 0) {
            return res.status(404).json({ erro: "Medicamento não encontrado." });
        }

        return res.status(200).json({ message: "Medicamento removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar o medicamento:", error);
        return res.status(500).json({ error: "Erro interno ao remover o medicamento." });
    }
});

module.exports = router;