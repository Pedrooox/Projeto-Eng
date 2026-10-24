const express = require('express');
// Importa o arquivo de rotas de medicamentos
const medicamentosRoutes = require('./routes/medicamentos');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Conecta as rotas de medicamentos na URL /api/medicamentos
app.use('/', medicamentosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});