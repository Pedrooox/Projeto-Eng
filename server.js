const express = require('express');

// Importa os arquivos de rotas
const medicamentosRoutes = require('./routes/medicamentos');
const produtosRoutes = require('./routes/produtos');
const farmaceuticosRoutes = require('./routes/farmaceuticos');
const gerentesRoutes = require('./routes/gerentes');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Conecta as rotas da aplicação
app.use('/medicamento', medicamentosRoutes);
app.use('/produto', produtosRoutes);
app.use('/farmaceutico', farmaceuticosRoutes);
app.use('/gerente', gerentesRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});