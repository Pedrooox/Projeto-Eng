// public/main.js
const API_URL = '/medicamentos'; // Sua rota do Express

// 1. LISTAR (GET)
async function carregarMedicamentos() {
    const res = await fetch(API_URL);
    const medicamentos = await res.json();
    // Atualizar a tabela...
}

// 2. CADASTRAR (POST)
async function criarMedicamento(dados) {
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
}

// 3. ATUALIZAR (PUT)
async function atualizarMedicamento(id, dados) {
    await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
}

// 4. EXCLUIR (DELETE)
async function deletarMedicamento(id) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
}