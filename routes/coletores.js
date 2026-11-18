const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Valida e normaliza campos obrigatórios de entrada para cadastro/edição
function validarCamposColetor(body, exigirSenha = true) {
    const { nome_completo, nome, cpf, telefone, senha } = body || {};
    const nomeValor = nome_completo !== undefined ? nome_completo : nome;

    if (!nomeValor || !nomeValor.toString().trim()) {
        return { erro: "O campo 'nome_completo' é obrigatório." };
    }
    if (!cpf || !cpf.toString().trim()) {
        return { erro: "O campo 'cpf' é obrigatório." };
    }
    if (!telefone || !telefone.toString().trim()) {
        return { erro: "O campo 'telefone' é obrigatório." };
    }
    if (exigirSenha && (!senha || !senha.toString().trim())) {
        return { erro: "O campo 'senha' é obrigatório." };
    }

    return {
        dados: {
            nomeFormatado: nomeValor.toString().trim(),
            cpfFormatado: cpf.toString().trim(),
            telefoneFormatado: telefone.toString().trim(),
            senhaFormatada: senha && senha.toString().trim() ? senha.toString().trim() : null
        }
    };
}

// Rota POST: Cadastrar novo coletor (/coletor)
router.post('/', (req, res) => {
    const { erro, dados } = validarCamposColetor(req.body, true);
    if (erro) {
        return res.status(400).json({ erro });
    }

    const { nomeFormatado, cpfFormatado, telefoneFormatado, senhaFormatada } = dados;

    try {
        const stmt = db.prepare(`
            INSERT INTO coletores (nome_completo, cpf, telefone, senha, status)
            VALUES (?, ?, ?, ?, 'ativo')
        `);

        const info = stmt.run(nomeFormatado, cpfFormatado, telefoneFormatado, senhaFormatada);

        return res.status(201).json({
            message: "Coletor cadastrado com sucesso!",
            coletor: {
                codigo: info.lastInsertRowid,
                nome_completo: nomeFormatado,
                cpf: cpfFormatado,
                telefone: telefoneFormatado,
                status: 'ativo'
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ erro: "Já existe um coletor cadastrado com o CPF ou telefone informado." });
        }
        console.error("Erro ao cadastrar coletor:", error);
        return res.status(500).json({ erro: "Erro interno no servidor ao tentar cadastrar o coletor." });
    }
});

// Rota GET: Listar coletores ativos (/coletor)
router.get('/', (req, res) => {
    try {
        const coletores = db.prepare(`
            SELECT codigo, nome_completo, cpf, telefone, status, data_cadastro
            FROM coletores
            WHERE status = 'ativo'
            ORDER BY codigo DESC
        `).all();

        return res.status(200).json(coletores);
    } catch (error) {
        console.error("Erro ao listar coletores:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar a lista de coletores." });
    }
});

// Rota GET: Consultar coletor específico por código (/coletor/:codigo)
router.get('/:codigo', (req, res) => {
    const { codigo } = req.params;

    try {
        const coletor = db.prepare(`
            SELECT codigo, nome_completo, cpf, telefone, status, data_cadastro
            FROM coletores
            WHERE codigo = ? AND status = 'ativo'
        `).get(codigo);

        if (!coletor) {
            return res.status(404).json({ erro: "Coletor não encontrado." });
        }

        return res.status(200).json(coletor);
    } catch (error) {
        console.error("Erro ao buscar coletor:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar dados do coletor." });
    }
});

// Rota PUT: Editar dados do coletor (/coletor/:codigo)
router.put('/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { erro, dados } = validarCamposColetor(req.body, false);
    if (erro) {
        return res.status(400).json({ erro });
    }

    const { nomeFormatado, cpfFormatado, telefoneFormatado, senhaFormatada } = dados;

    try {
        const existente = db.prepare("SELECT * FROM coletores WHERE codigo = ? AND status = 'ativo'").get(codigo);
        if (!existente) {
            return res.status(404).json({ erro: "Coletor não encontrado." });
        }

        const senhaFinal = senhaFormatada || existente.senha;

        db.prepare(`
            UPDATE coletores
            SET nome_completo = ?, cpf = ?, telefone = ?, senha = ?
            WHERE codigo = ?
        `).run(nomeFormatado, cpfFormatado, telefoneFormatado, senhaFinal, codigo);

        return res.status(200).json({
            message: "Dados do coletor atualizados com sucesso!",
            coletor: {
                codigo: Number(codigo),
                nome_completo: nomeFormatado,
                cpf: cpfFormatado,
                telefone: telefoneFormatado,
                status: existente.status
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ erro: "Já existe outro coletor cadastrado com o CPF ou telefone informado." });
        }
        console.error("Erro ao atualizar coletor:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar dados do coletor." });
    }
});

// Rota DELETE: Excluir coletor mediante confirmação (/coletor/:codigo)
router.delete('/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { confirmacao } = req.body || {};
    const confirmacaoQuery = req.query.confirmacao;

    if (confirmacao === false || confirmacaoQuery === 'false') {
        return res.status(400).json({
            erro: "Exclusão cancelada: é necessário confirmar a remoção do coletor."
        });
    }

    try {
        const coletor = db.prepare("SELECT codigo, nome_completo FROM coletores WHERE codigo = ? AND status = 'ativo'").get(codigo);
        if (!coletor) {
            return res.status(404).json({ erro: "Coletor não encontrado." });
        }

        if (req.query.hard === 'true') {
            db.prepare('DELETE FROM coletores WHERE codigo = ?').run(codigo);
        } else {
            db.prepare("UPDATE coletores SET status = 'inativo' WHERE codigo = ?").run(codigo);
        }

        return res.status(200).json({
            message: "Coletor removido com sucesso!",
            codigo: Number(codigo),
            nome_completo: coletor.nome_completo
        });
    } catch (error) {
        console.error("Erro ao remover coletor:", error);
        return res.status(500).json({ erro: "Erro interno ao remover o coletor." });
    }
});

module.exports = router;
