const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Função auxiliar para gerar e-mail profissional no padrão: nome.sobrenome@farmacia.com
function gerarEmailProfissional(nomeCompleto) {
    if (!nomeCompleto) return null;
    const partes = nomeCompleto
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 0) return 'farmaceutico@farmacia.com';
    if (partes.length === 1) return `${partes[0]}@farmacia.com`;
    return `${partes[0]}.${partes[partes.length - 1]}@farmacia.com`;
}

// Rota POST: Cadastrar Farmacêutico
// Campos: nome_completo, cpf, data_nascimento, crf, senha, email (opcional/auto), telefone (opcional)
router.post(['/farmaceutico', '/farmaceuticos'], (req, res) => {
    const { nome_completo, cpf, data_nascimento, crf, senha, email, telefone } = req.body;

    if (!nome_completo || !nome_completo.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'nome_completo' é obrigatório." });
    }

    if (!cpf || !cpf.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'cpf' é obrigatório." });
    }

    if (!data_nascimento || !data_nascimento.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'data_nascimento' é obrigatório." });
    }

    if (!crf || !crf.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'crf' (Registro CRF) é obrigatório." });
    }

    if (!senha || !senha.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'senha' é obrigatório." });
    }

    const cpfFormatado = cpf.toString().trim();
    const crfFormatado = crf.toString().trim();

    // Validação de CPF já existente
    const cpfExistente = db.prepare('SELECT codigo FROM farmaceuticos WHERE cpf = ?').get(cpfFormatado);
    if (cpfExistente) {
        return res.status(409).json({ erro: "CPF já cadastrado para outro farmacêutico." });
    }

    // Validação de CRF já existente
    const crfExistente = db.prepare('SELECT codigo FROM farmaceuticos WHERE crf = ?').get(crfFormatado);
    if (crfExistente) {
        return res.status(409).json({ erro: "Registro CRF já cadastrado para outro farmacêutico." });
    }

    // Gera o e-mail profissional se não for enviado manualmente
    let emailFinal = email && email.toString().trim()
        ? email.toString().trim().toLowerCase()
        : gerarEmailProfissional(nome_completo);

    if (emailFinal) {
        const emailExistente = db.prepare('SELECT codigo FROM farmaceuticos WHERE email = ?').get(emailFinal);
        if (emailExistente) {
            emailFinal = emailFinal.replace('@', `${Math.floor(100 + Math.random() * 900)}@`);
        }
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO farmaceuticos (nome_completo, cpf, data_nascimento, crf, senha, email, telefone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')
        `);

        const info = stmt.run(
            nome_completo.toString().trim(),
            cpfFormatado,
            data_nascimento.toString().trim(),
            crfFormatado,
            senha.toString().trim(),
            emailFinal,
            telefone ? telefone.toString().trim() : null
        );

        return res.status(201).json({
            message: "Farmacêutico cadastrado com sucesso!",
            farmaceutico: {
                codigo: info.lastInsertRowid,
                nome_completo: nome_completo.toString().trim(),
                cpf: cpfFormatado,
                data_nascimento: data_nascimento.toString().trim(),
                crf: crfFormatado,
                email: emailFinal,
                telefone: telefone ? telefone.toString().trim() : null,
                status: 'ativo'
            }
        });
    } catch (error) {
        console.error("Erro ao cadastrar farmacêutico:", error);
        return res.status(500).json({ erro: "Erro interno no servidor ao tentar cadastrar o farmacêutico." });
    }
});

// Rota GET: Listar Farmacêuticos cadastrados
router.get(['/farmaceutico', '/farmaceuticos'], (req, res) => {
    const { termo, status } = req.query;

    try {
        let query = 'SELECT codigo, nome_completo, cpf, data_nascimento, crf, email, telefone, status, motivo_exclusao, data_cadastro FROM farmaceuticos';
        const params = [];
        const conditions = [];

        // Filtro de status: por padrão, lista apenas os ativos
        if (status && status.toLowerCase() === 'todos') {
            // Sem filtro de status
        } else if (status) {
            conditions.push('status = ?');
            params.push(status.toLowerCase());
        } else {
            conditions.push("status = 'ativo'");
        }

        // Filtro por termo (busca por nome, cpf, crf ou e-mail)
        if (termo && termo.trim()) {
            conditions.push('(nome_completo LIKE ? OR cpf LIKE ? OR crf LIKE ? OR email LIKE ?)');
            const termoLike = `%${termo.trim()}%`;
            params.push(termoLike, termoLike, termoLike, termoLike);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY codigo DESC';

        const farmaceuticos = db.prepare(query).all(...params);
        return res.status(200).json(farmaceuticos);
    } catch (error) {
        console.error("Erro ao listar farmacêuticos:", error);
        return res.status(500).json({ erro: "Erro ao buscar a lista de farmacêuticos." });
    }
});

// Rota GET: Exibir informações gerais de um Farmacêutico específico
router.get(['/farmaceutico/:codigo', '/farmaceuticos/:codigo'], (req, res) => {
    const { codigo } = req.params;

    try {
        const farmaceutico = db.prepare(`
            SELECT codigo, nome_completo, cpf, data_nascimento, crf, email, telefone, status, motivo_exclusao, data_cadastro
            FROM farmaceuticos
            WHERE codigo = ?
        `).get(codigo);

        if (!farmaceutico) {
            return res.status(404).json({ erro: "Farmacêutico não encontrado." });
        }

        return res.status(200).json(farmaceutico);
    } catch (error) {
        console.error("Erro ao buscar dados do farmacêutico:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar dados do farmacêutico." });
    }
});

// Rota PUT: Atualizar dados de um Farmacêutico
router.put(['/farmaceutico/:codigo', '/farmaceuticos/:codigo'], (req, res) => {
    const { codigo } = req.params;
    const { nome_completo, cpf, data_nascimento, crf, senha, email, telefone, status } = req.body;

    if (!nome_completo || !cpf || !data_nascimento || !crf) {
        return res.status(400).json({
            erro: "Campos obrigatórios ausentes: nome_completo, cpf, data_nascimento e crf."
        });
    }

    try {
        const existente = db.prepare('SELECT * FROM farmaceuticos WHERE codigo = ?').get(codigo);
        if (!existente) {
            return res.status(404).json({ erro: "Farmacêutico não encontrado." });
        }

        const cpfFormatado = cpf.toString().trim();
        const crfFormatado = crf.toString().trim();

        // Validar CPF em uso por outro
        const outroCpf = db.prepare('SELECT codigo FROM farmaceuticos WHERE cpf = ? AND codigo != ?').get(cpfFormatado, codigo);
        if (outroCpf) {
            return res.status(409).json({ erro: "CPF já cadastrado para outro farmacêutico." });
        }

        // Validar CRF em uso por outro
        const outroCrf = db.prepare('SELECT codigo FROM farmaceuticos WHERE crf = ? AND codigo != ?').get(crfFormatado, codigo);
        if (outroCrf) {
            return res.status(409).json({ erro: "Registro CRF já cadastrado para outro farmacêutico." });
        }

        const stmt = db.prepare(`
            UPDATE farmaceuticos
            SET nome_completo = ?, cpf = ?, data_nascimento = ?, crf = ?, senha = ?, email = ?, telefone = ?, status = ?
            WHERE codigo = ?
        `);

        stmt.run(
            nome_completo.toString().trim(),
            cpfFormatado,
            data_nascimento.toString().trim(),
            crfFormatado,
            senha ? senha.toString().trim() : existente.senha,
            email ? email.toString().trim().toLowerCase() : existente.email,
            telefone ? telefone.toString().trim() : existente.telefone,
            status ? status.toString().trim().toLowerCase() : existente.status,
            codigo
        );

        return res.status(200).json({
            message: "Dados do farmacêutico atualizados com sucesso!",
            farmaceutico: {
                codigo: Number(codigo),
                nome_completo: nome_completo.toString().trim(),
                cpf: cpfFormatado,
                data_nascimento: data_nascimento.toString().trim(),
                crf: crfFormatado,
                email: email ? email.toString().trim().toLowerCase() : existente.email,
                telefone: telefone ? telefone.toString().trim() : existente.telefone,
                status: status || existente.status
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar farmacêutico:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar farmacêutico." });
    }
});

// Rota DELETE: Remover Farmacêutico com Motivo Obrigatório
router.delete(['/farmaceutico/:codigo', '/farmaceuticos/:codigo'], (req, res) => {
    const { codigo } = req.params;
    const { motivo_exclusao, motivo } = req.body || {};
    const motivoFinal = motivo_exclusao || motivo || req.query.motivo;

    // Critério de aceitação: campo OBRIGATÓRIO para preencher o "Motivo da exclusão"
    if (!motivoFinal || !motivoFinal.toString().trim()) {
        return res.status(400).json({
            erro: "O motivo da exclusão é obrigatório para remover o farmacêutico."
        });
    }

    try {
        const farmaceutico = db.prepare('SELECT * FROM farmaceuticos WHERE codigo = ?').get(codigo);
        if (!farmaceutico) {
            return res.status(404).json({ erro: "Farmacêutico não encontrado." });
        }

        // Exclusão lógica (soft-delete): inativa o profissional e grava o motivo da exclusão
        db.prepare(`
            UPDATE farmaceuticos
            SET status = 'inativo', motivo_exclusao = ?
            WHERE codigo = ?
        `).run(motivoFinal.toString().trim(), codigo);

        return res.status(200).json({
            message: "Farmacêutico removido com sucesso!",
            codigo: Number(codigo),
            nome_completo: farmaceutico.nome_completo,
            crf: farmaceutico.crf,
            motivo_exclusao: motivoFinal.toString().trim()
        });
    } catch (error) {
        console.error("Erro ao remover farmacêutico:", error);
        return res.status(500).json({ erro: "Erro interno ao remover o farmacêutico." });
    }
});

module.exports = router;
