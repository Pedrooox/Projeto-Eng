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

router.put("/Alterar_medicamento/:codigo", (req, res) => {
    const { codigo } = req.params;
    const { nome_comercial, nome_generico, unidade_medida, validade, preco } = req.body; 
    const preco_number = Number(preco);

    if (!nome_comercial || !unidade_medida || !validade || isNaN(preco_number) || preco_number <= 0) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes ou preço inválido."
        });
    }

    try {
        const stmt = db.prepare(' UPDATE medicamentoS SET nome_comercial = ?, nome_generico = ?, unidade_medida = ?, validade = ?, preco = ? WHERE  codigo = ?');
        
        const info = stmt.run(
            nome_comercial.trim(),
            nome_generico ? nome_generico.trim() : null,
            unidade_medida.trim(),
            validade,
            preco_number,
            codigo
        );

        if (info.changes == 0){
            return res.status(404).json({ 
                erro: "Medicamento não encontrado" });
        }
    
        return res.status(200).json({
            message: "Medicamento alterado!",
            medicamento: {
                codigo: Number(codigo),
                nome_comercial,
                nome_generico,
                unidade_medida,
                validade,
                preco: preco_number
                }
            });
        } catch (error){
            console.error("Erro ao atualizar medicamento:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar o medicamento." });
        }
});

module.exports = router;