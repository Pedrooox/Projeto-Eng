const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Rota POST: Cadastrar produto não-medicamento (higiene, cosméticos, perfumaria, etc.)
router.post('/', (req, res) => {
    const { nome, categoria, marca, codigo_barras, unidade_medida, preco, quantidade } = req.body;

    const precoNumerico = Number(preco);
    const qtdNumerica = quantidade !== undefined ? Number(quantidade) : 0;

    if (!nome || !nome.toString().trim() || !categoria || !categoria.toString().trim()) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes: 'nome' e 'categoria' são obrigatórios."
        });
    }

    if (isNaN(precoNumerico) || precoNumerico <= 0) {
        return res.status(400).json({
            erro: "Preço inválido: o preço deve ser um número maior que zero."
        });
    }

    if (isNaN(qtdNumerica) || qtdNumerica < 0) {
        return res.status(400).json({
            erro: "Quantidade inválida: a quantidade deve ser um número maior ou igual a zero."
        });
    }

    const codBarrasFormatado = codigo_barras && codigo_barras.toString().trim() ? codigo_barras.toString().trim() : null;

    // Verificar se já existe outro produto com o mesmo código de barras
    if (codBarrasFormatado) {
        const existeCodigo = db.prepare('SELECT codigo FROM produtos WHERE codigo_barras = ?').get(codBarrasFormatado);
        if (existeCodigo) {
            return res.status(409).json({
                erro: "Código de barras já cadastrado em outro produto."
            });
        }
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO produtos (nome, categoria, marca, codigo_barras, unidade_medida, preco, quantidade)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            nome.toString().trim(),
            categoria.toString().trim(),
            marca ? marca.toString().trim() : null,
            codBarrasFormatado,
            unidade_medida ? unidade_medida.toString().trim() : 'unidade',
            precoNumerico,
            qtdNumerica
        );

        return res.status(201).json({
            message: "Produto cadastrado com sucesso!",
            produto: {
                codigo: info.lastInsertRowid,
                nome: nome.toString().trim(),
                categoria: categoria.toString().trim(),
                marca: marca ? marca.toString().trim() : null,
                codigo_barras: codBarrasFormatado,
                unidade_medida: unidade_medida ? unidade_medida.toString().trim() : 'unidade',
                preco: precoNumerico,
                quantidade: qtdNumerica
            }
        });
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        return res.status(500).json({ erro: "Erro interno no servidor ao tentar cadastrar o produto." });
    }
});

// Rota GET: Listar produtos com suporte a busca/filtro por termo ou categoria
router.get('/', (req, res) => {
    const { termo, categoria } = req.query;

    try {
        let query = 'SELECT * FROM produtos';
        const params = [];
        const conditions = [];

        if (termo && termo.trim()) {
            conditions.push('(nome LIKE ? OR marca LIKE ? OR codigo_barras LIKE ?)');
            const termoLike = `%${termo.trim()}%`;
            params.push(termoLike, termoLike, termoLike);
        }

        if (categoria && categoria.trim()) {
            conditions.push('categoria LIKE ?');
            params.push(`%${categoria.trim()}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY codigo DESC';

        const produtos = db.prepare(query).all(...params);
        return res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return res.status(500).json({ erro: "Erro ao buscar a listagem de produtos." });
    }
});

// Rota GET: Consultar produto por código
router.get('/:codigo', (req, res) => {
    const { codigo } = req.params;

    try {
        const produto = db.prepare('SELECT * FROM produtos WHERE codigo = ?').get(codigo);

        if (!produto) {
            return res.status(404).json({ erro: "Produto não encontrado." });
        }

        return res.status(200).json(produto);
    } catch (error) {
        console.error("Erro ao buscar produto por código:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar o produto." });
    }
});

// Rota PUT: Atualizar produto por código
router.put('/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { nome, categoria, marca, codigo_barras, unidade_medida, preco, quantidade } = req.body;

    const precoNumerico = Number(preco);
    const qtdNumerica = Number(quantidade);

    if (!nome || !nome.toString().trim() || !categoria || !categoria.toString().trim()) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes: 'nome' e 'categoria' são obrigatórios."
        });
    }

    if (isNaN(precoNumerico) || precoNumerico <= 0) {
        return res.status(400).json({
            erro: "Preço inválido: o preço deve ser um número maior que zero."
        });
    }

    if (isNaN(qtdNumerica) || qtdNumerica < 0) {
        return res.status(400).json({
            erro: "Quantidade inválida: a quantidade deve ser um número maior ou igual a zero."
        });
    }

    const codBarrasFormatado = codigo_barras && codigo_barras.toString().trim() ? codigo_barras.toString().trim() : null;

    try {
        // Verificar se o produto existe
        const produtoExistente = db.prepare('SELECT * FROM produtos WHERE codigo = ?').get(codigo);
        if (!produtoExistente) {
            return res.status(404).json({ erro: "Produto não encontrado." });
        }

        // Verificar código de barras duplicado em outro produto
        if (codBarrasFormatado) {
            const barcodeInUse = db.prepare('SELECT codigo FROM produtos WHERE codigo_barras = ? AND codigo != ?').get(codBarrasFormatado, codigo);
            if (barcodeInUse) {
                return res.status(409).json({
                    erro: "Código de barras já utilizado por outro produto."
                });
            }
        }

        const stmt = db.prepare(`
            UPDATE produtos
            SET nome = ?, categoria = ?, marca = ?, codigo_barras = ?, unidade_medida = ?, preco = ?, quantidade = ?
            WHERE codigo = ?
        `);

        stmt.run(
            nome.toString().trim(),
            categoria.toString().trim(),
            marca ? marca.toString().trim() : null,
            codBarrasFormatado,
            unidade_medida ? unidade_medida.toString().trim() : 'unidade',
            precoNumerico,
            qtdNumerica,
            codigo
        );

        return res.status(200).json({
            message: "Produto alterado com sucesso!",
            produto: {
                codigo: Number(codigo),
                nome: nome.toString().trim(),
                categoria: categoria.toString().trim(),
                marca: marca ? marca.toString().trim() : null,
                codigo_barras: codBarrasFormatado,
                unidade_medida: unidade_medida ? unidade_medida.toString().trim() : 'unidade',
                preco: precoNumerico,
                quantidade: qtdNumerica
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar o produto." });
    }
});

// Rota DELETE: Remover produto por código
router.delete('/:codigo', (req, res) => {
    const { codigo } = req.params;

    try {
        const stmt = db.prepare('DELETE FROM produtos WHERE codigo = ?');
        const info = stmt.run(codigo);

        if (info.changes === 0) {
            return res.status(404).json({ erro: "Produto não encontrado." });
        }

        return res.status(200).json({ message: "Produto removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar o produto:", error);
        return res.status(500).json({ erro: "Erro interno ao remover o produto." });
    }
});

module.exports = router;

