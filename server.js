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
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de administrador
app.use('/admin', adminRoutes);
app.use('/', authRoutes);   // para login e primeiro acesso
app.use('/', userRoutes);   // para rotas de usu\u00e1rio (ex: /processos)


// Sincroniza com o banco e realiza seed inicial
sequelize.sync({ })
  .then(async () => {
    console.log('Banco de dados sincronizado.');

    // SEED: Cria usuários e processos iniciais se não existirem
    // --------------------------------------------------------
    // 1) Admin
    let admin = await User.findOne({ where: { matricula: '30109511' } });
    if (!admin) {
      admin = await User.create({
        matricula: '30109511',
        nome: 'Administrador Padrão',
        senha: '87634512'
      });
    }

    // 2) Usuário 1 (joão)
    let user1 = await User.findOne({ where: { matricula: '12345678' } });
    if (!user1) {
      user1 = await User.create({
        matricula: '12345678',
        nome: 'joão',
        senha: '12345678'
      });
    }

    // 3) Usuário 2 (francisco)
    let user2 = await User.findOne({ where: { matricula: '87654321' } });
    if (!user2) {
      user2 = await User.create({
        matricula: '87654321',
        nome: 'francisco',
        senha: '87654321'
      });
    }

    // 4) Processos
    // --------------------------------------------------------
    // Processo 1
    let proc1 = await Process.findOne({
      where: { numero_processo: '0030218-07.2011.8.06.0091' }
    });
    if (!proc1) {
      await Process.create({
        numero_processo: '0030218-07.2011.8.06.0091',
        prazo_processual: '5 dias',
        classe_principal: 'Ação Penal - Procedimento Ordinário',
        assunto_principal: 'Crimes do Sistema Nacional de Armas',
        tarjas: 'Réu Preso',
        data_intimacao: '2025-02-27',
        userId: user1.id  // atribuído ao user1 (joão)
      });
    }

    // Processo 2
    let proc2 = await Process.findOne({
      where: { numero_processo: '0200139-53.2024.8.06.0302' }
    });
    if (!proc2) {
      await Process.create({
        numero_processo: '0200139-53.2024.8.06.0302',
        prazo_processual: '60 dias',
        classe_principal: 'Inquérito Policial',
        assunto_principal: 'Roubo Majorado',
        tarjas: '',
        data_intimacao: '2025-02-27',
        userId: user1.id  // atribuído ao user1 (joão)
      });
    }

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar o banco de dados:', err);
  });
