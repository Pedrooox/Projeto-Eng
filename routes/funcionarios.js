const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Função auxiliar para gerar e-mail profissional a partir do nome
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

    if (partes.length === 0) return 'colaborador@farmacia.com';
    if (partes.length === 1) return `${partes[0]}@farmacia.com`;
    return `${partes[0]}.${partes[partes.length - 1]}@farmacia.com`;
}

// Rota POST: Cadastrar novo colaborador/funcionário
router.post(['/funcionario', '/colaborador'], (req, res) => {
    const { nome_completo, cpf, data_nascimento, endereco, curriculo, cargo, email } = req.body;

    if (!nome_completo || !nome_completo.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'nome_completo' é obrigatório." });
    }

    if (!cpf || !cpf.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'cpf' é obrigatório." });
    }

    if (!data_nascimento || !data_nascimento.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'data_nascimento' é obrigatório." });
    }

    if (!cargo || !cargo.toString().trim()) {
        return res.status(400).json({ erro: "O campo 'cargo' é obrigatório." });
    }

    const cpfFormatado = cpf.toString().trim();
    // Validação de CPF já existente
    const cpfExistente = db.prepare('SELECT codigo FROM funcionarios WHERE cpf = ?').get(cpfFormatado);
    if (cpfExistente) {
        return res.status(409).json({ erro: "CPF já cadastrado para outro colaborador." });
    }

    // Se o e-mail não for informado manualmente, gera automaticamente
    let emailFinal = email && email.toString().trim()
        ? email.toString().trim().toLowerCase()
        : gerarEmailProfissional(nome_completo);

    // Validação de e-mail duplicado
    if (emailFinal) {
        const emailExistente = db.prepare('SELECT codigo FROM funcionarios WHERE email = ?').get(emailFinal);
        if (emailExistente) {
            // Caso o e-mail gerado já exista, adiciona o código aleatório para evitar colisão
            emailFinal = emailFinal.replace('@', `${Math.floor(100 + Math.random() * 900)}@`);
        }
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO funcionarios (nome_completo, cpf, data_nascimento, endereco, curriculo, cargo, email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')
        `);

        const info = stmt.run(
            nome_completo.toString().trim(),
            cpfFormatado,
            data_nascimento.toString().trim(),
            endereco ? endereco.toString().trim() : null,
            curriculo ? curriculo.toString().trim() : null,
            cargo.toString().trim(),
            emailFinal
        );

        return res.status(201).json({
            message: "Colaborador cadastrado com sucesso!",
            funcionario: {
                codigo: info.lastInsertRowid,
                nome_completo: nome_completo.toString().trim(),
                cpf: cpfFormatado,
                data_nascimento: data_nascimento.toString().trim(),
                endereco: endereco ? endereco.toString().trim() : null,
                curriculo: curriculo ? curriculo.toString().trim() : null,
                cargo: cargo.toString().trim(),
                email: emailFinal,
                status: 'ativo'
            }
        });
    } catch (error) {
        console.error("Erro ao cadastrar funcionário:", error);
        return res.status(500).json({ erro: "Erro interno no servidor ao tentar cadastrar o colaborador." });
    }
});

// Rota GET: Listar funcionários e seus cargos (suporta filtro de cargo e status)
router.get(['/funcionario', '/colaborador'], (req, res) => {
    const { cargo, status, termo } = req.query;

    try {
        let query = 'SELECT * FROM funcionarios';
        const params = [];
        const conditions = [];

        // Filtro por status (padrão: ativos)
        if (status && status.toLowerCase() === 'todos') {
            // Não filtra por status
        } else if (status) {
            conditions.push('status = ?');
            params.push(status.toLowerCase());
        } else {
            // Por padrão, lista os colaboradores ativos
            conditions.push("status = 'ativo'");
        }

        // Filtro por cargo
        if (cargo && cargo.trim()) {
            conditions.push('cargo LIKE ?');
            params.push(`%${cargo.trim()}%`);
        }

        // Busca por termo (nome, cpf ou email)
        if (termo && termo.trim()) {
            conditions.push('(nome_completo LIKE ? OR cpf LIKE ? OR email LIKE ?)');
            const termoLike = `%${termo.trim()}%`;
            params.push(termoLike, termoLike, termoLike);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY codigo DESC';

        const funcionarios = db.prepare(query).all(...params);
        return res.status(200).json(funcionarios);
    } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
        return res.status(500).json({ erro: "Erro ao buscar a lista de funcionários." });
    }
});

// Rota GET: Obter informações gerais de um colaborador específico por código
router.get(['/funcionario/:codigo', '/colaborador/:codigo'], (req, res) => {
    const { codigo } = req.params;

    try {
        const funcionario = db.prepare('SELECT * FROM funcionarios WHERE codigo = ?').get(codigo);

        if (!funcionario) {
            return res.status(404).json({ erro: "Colaborador não encontrado." });
        }

        return res.status(200).json(funcionario);
    } catch (error) {
        console.error("Erro ao buscar dados do funcionário:", error);
        return res.status(500).json({ erro: "Erro interno ao buscar dados do colaborador." });
    }
});

// Rota PUT: Atualizar dados de um colaborador existente
router.put(['/funcionario/:codigo', '/colaborador/:codigo'], (req, res) => {
    const { codigo } = req.params;
    const { nome_completo, cpf, data_nascimento, endereco, curriculo, cargo, email, status } = req.body;

    if (!nome_completo || !cpf || !data_nascimento || !cargo) {
        return res.status(400).json({
            erro: "Campos obrigatórios: nome_completo, cpf, data_nascimento e cargo."
        });
    }

    try {
        const funcionarioExistente = db.prepare('SELECT * FROM funcionarios WHERE codigo = ?').get(codigo);
        if (!funcionarioExistente) {
            return res.status(404).json({ erro: "Colaborador não encontrado." });
        }

        // Validar CPF duplicado com outro colaborador
        const cpfFormatado = cpf.toString().trim();
        const outroCpf = db.prepare('SELECT codigo FROM funcionarios WHERE cpf = ? AND codigo != ?').get(cpfFormatado, codigo);
        if (outroCpf) {
            return res.status(409).json({ erro: "CPF já utilizado por outro colaborador." });
        }

        const stmt = db.prepare(`
            UPDATE funcionarios
            SET nome_completo = ?, cpf = ?, data_nascimento = ?, endereco = ?, curriculo = ?, cargo = ?, email = ?, status = ?
            WHERE codigo = ?
        `);

        stmt.run(
            nome_completo.toString().trim(),
            cpfFormatado,
            data_nascimento.toString().trim(),
            endereco ? endereco.toString().trim() : null,
            curriculo ? curriculo.toString().trim() : null,
            cargo.toString().trim(),
            email ? email.toString().trim().toLowerCase() : funcionarioExistente.email,
            status ? status.toString().trim().toLowerCase() : funcionarioExistente.status,
            codigo
        );

        return res.status(200).json({
            message: "Dados do colaborador atualizados com sucesso!",
            funcionario: {
                codigo: Number(codigo),
                nome_completo: nome_completo.toString().trim(),
                cpf: cpfFormatado,
                data_nascimento: data_nascimento.toString().trim(),
                endereco: endereco ? endereco.toString().trim() : null,
                curriculo: curriculo ? curriculo.toString().trim() : null,
                cargo: cargo.toString().trim(),
                email: email ? email.toString().trim().toLowerCase() : funcionarioExistente.email,
                status: status || funcionarioExistente.status
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar colaborador:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar colaborador." });
    }
});

// Rota DELETE: Remover colaborador informando motivo da exclusão
router.delete(['/funcionario/:codigo', '/colaborador/:codigo'], (req, res) => {
    const { codigo } = req.params;
    const { motivo_exclusao, motivo } = req.body || {};
    const motivoFinal = motivo_exclusao || motivo || req.query.motivo || 'Motivo não informado';
    const hardDelete = req.query.hard === 'true';

    try {
        const funcionario = db.prepare('SELECT * FROM funcionarios WHERE codigo = ?').get(codigo);
        if (!funcionario) {
            return res.status(404).json({ erro: "Colaborador não encontrado." });
        }

        if (hardDelete) {
            db.prepare('DELETE FROM funcionarios WHERE codigo = ?').run(codigo);
            return res.status(200).json({
                message: "Colaborador excluído permanentemente com sucesso!"
            });
        }

        // Exclusão lógica (soft delete) com registro do motivo da exclusão
        db.prepare(`
            UPDATE funcionarios
            SET status = 'inativo', motivo_exclusao = ?
            WHERE codigo = ?
        `).run(motivoFinal.toString().trim(), codigo);

        return res.status(200).json({
            message: "Colaborador removido com sucesso!",
            codigo: Number(codigo),
            nome: funcionario.nome_completo,
            motivo_exclusao: motivoFinal.toString().trim()
        });
    } catch (error) {
        console.error("Erro ao remover funcionário:", error);
        return res.status(500).json({ erro: "Erro interno ao remover o colaborador." });
    }
});

module.exports = router;
