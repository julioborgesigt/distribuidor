// server.js
const express = require('express');
const path = require('path');
const { sequelize, User, Process } = require('./models');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Para poder interpretar JSON e dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de administrador
app.use('/admin', adminRoutes);
app.use('/', authRoutes);   // para login e primeiro acesso
app.use('/', userRoutes);   // para rotas de usu\u00e1rio (ex: /processos)


// Sincroniza com o banco e realiza seed inicial
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Banco de dados sincronizado.');

    
    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar o banco de dados:', err);
  });
