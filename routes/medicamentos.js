const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Rota POST: Cadastrar medicamento
router.post("/", (req, res) => {
    const { nome_comercial, nome_generico, unidade_medida, validade, preco, quantidade } = req.body;
    
    const precoNumerico = Number(preco);
    const qtdNumerica = Number(quantidade);

    if (!nome_comercial || !unidade_medida || !validade || isNaN(precoNumerico) || precoNumerico <= 0 || isNaN(qtdNumerica) || qtdNumerica < 0) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes, preço ou quantidade inválidos."
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO medicamentos (nome_comercial, nome_generico, unidade_medida, validade, preco, quantidade)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            nome_comercial.trim(),
            nome_generico ? nome_generico.trim() : null,
            unidade_medida.trim(),
            validade,
            precoNumerico,
            qtdNumerica
        );

        return res.status(201).json({
            message: "Medicamento cadastrado com sucesso!",
            medicamento: {
                codigo: info.lastInsertRowid,
                nome_comercial,
                nome_generico,
                unidade_medida,
                validade,
                preco: precoNumerico,
                quantidade: qtdNumerica
            }
        });
    } catch (error) {
        console.error("Erro ao inserir medicamento:", error);
        return res.status(500).json({ error: "Erro interno no servidor ao tentar cadastrar o medicamento." });
    }
});

// Rota GET: Listar catálogo de medicamentos
router.get("/", (req, res) => {
    try {
        const medicamentos = db.prepare('SELECT * FROM medicamentos ORDER BY codigo DESC').all();
        return res.status(200).json(medicamentos);
    } catch (error) {
        console.error("Erro ao buscar medicamentos:", error);
        return res.status(500).json({ error: "Erro ao buscar a listagem de medicamentos." });
    }
});

// Rota PUT: Alterar medicamento por código
router.put("/:codigo", (req, res) => {
    const { codigo } = req.params;
    const { nome_comercial, nome_generico, unidade_medida, validade, preco, quantidade } = req.body; 
    
    const precoNumerico = Number(preco);
    const qtdNumerica = Number(quantidade);

    if (!nome_comercial || !unidade_medida || !validade || isNaN(precoNumerico) || precoNumerico <= 0 || isNaN(qtdNumerica) || qtdNumerica < 0) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes, preço ou quantidade inválidos."
        });
    }

    try {
        const stmt = db.prepare(`
            UPDATE medicamentos 
            SET nome_comercial = ?, nome_generico = ?, unidade_medida = ?, validade = ?, preco = ?, quantidade = ?
            WHERE codigo = ?
        `);
        
        const info = stmt.run(
            nome_comercial.trim(),
            nome_generico ? nome_generico.trim() : null,
            unidade_medida.trim(),
            validade,
            precoNumerico,
            qtdNumerica,
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
                preco: precoNumerico,
                quantidade: qtdNumerica
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar medicamento:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar o medicamento." });
    }
});

// Rota DELETE: deletar algum medicamento
router.delete("/:codigo", (req, res) => {
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