const express = require('express');
// Importa o arquivo de rotas de medicamentos
const medicamentosRoutes = require('./routes/medicamentos');
// Importa o arquivo de rotas de produtos
const produtosRoutes = require('./routes/produtos');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Conecta as rotas de medicamentos e produtos
app.use('/', medicamentosRoutes);
app.use('/', produtosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
