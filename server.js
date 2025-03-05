// server.js
const express = require('express');
const path = require('path');
const { sequelize, User, Process } = require('./models');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET; // Esse valor é usado no seu middleware

// Middlewares para interpretar JSON e dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos (favicon, CSS, imagens, etc.)
// Isso permite que o navegador acesse arquivos como /favicon.ico sem precisar de autenticação.
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial (página de login, por exemplo)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas públicas: login e primeiro acesso
app.use('/', authRoutes);

// Rotas protegidas: usuário e administrador
app.use('/admin', adminRoutes);
app.use('/', userRoutes); // Essa rota protege, por exemplo, '/processos'

// Sincroniza com o banco de dados e inicia o servidor
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Banco de dados sincronizado.');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar o banco de dados:', err);
  });
