const express = require('express');
// Importa o arquivo de rotas de medicamentos
const medicamentosRoutes = require('./routes/medicamentos');
// Importa o arquivo de rotas de produtos
const produtosRoutes = require('./routes/produtos');
// Importa o arquivo de rotas de gerentes (nome correto do arquivo: gerentes.js)
const gerentesRoutes = require('./routes/gerentes');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Conecta as rotas da aplicação
app.use('/medicamento', medicamentosRoutes);
app.use('/produto', produtosRoutes);
app.use('/gerente', gerentesRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
