const express = require('express');
const router = express.Router();
const db = require('../db');
const medicamento = [];
router.use(express.json());

router.get("/medicamento",(req, res) => {
    return res.json(medicamento)
})

router.get('/server/:index', checkUserInArray, (req, res) => {
return res.json(req.user);
})


// Rota para criar o medicamento no bd
router.post("/medicamento", (req, res) => {
    const { Nome_comercial, Nome_genérico, Unidade_de_medida, Validade, preco  } = req.body;

    if (!Nome_comercial || !Unidade_de_medida || !Validade || preco === undefined || preco === null || preco <= 0){
        return res.status(400).json ({
            erro: "Campos faltando."
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
                codigo: info.lastInsertRowid, // Código gerado automaticamente pelo SQLite
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


    medicamento.push(Nome_comercial);

    return res.json(medicmento);
})


module.exports = router;