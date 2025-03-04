// /controllers/authController.js
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'b7f8a2d4e3f7c78e8e9a3d0b5f6d8a3e7c9f2b8e4d1a5c0e2d3f9b6a7d8e4c1f'; // Substitua por um valor seguro

exports.login = async (req, res) => {
  // Extraímos também adminLogin do corpo da requisição
  const { matricula, senha, adminLogin } = req.body;
  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      console.log(`Usuário não encontrado: ${matricula}`);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Se o login for solicitado como admin mas o usuário não é admin
    if (adminLogin && !user.admin_padrao) {
      console.log(`Acesso de administrador negado para a matrícula: ${matricula}`);
      return res.status(403).json({ error: 'Acesso de administrador negado.' });
    }
    
    // Logs para depuração
    console.log(`Senha fornecida: ${senha}`);
    console.log(`Senha armazenada: ${user.senha}`);
    console.log(`Valor de senha_padrao: ${user.senha_padrao}`);

    let senhaValida = false;
    if (user.senha_padrao) {
      // Primeiro login: senha em texto plano
      senhaValida = (senha === user.senha);
    } else {
      // Senha já foi trocada e está hasheada
      senhaValida = bcrypt.compareSync(senha, user.senha);
    }
    
    if (!senhaValida) {
      console.log(`Senha incorreta para a matrícula: ${matricula}`);
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    if (user.senha_padrao) {
      console.log("Este é seu primeiro login.");
      return res.json({ firstLogin: true, userId: user.id });
    } else {
      console.log("Este não é seu primeiro login.");
      // Gera token com apenas o id (a flag admin será verificada na consulta ao BD)
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.firstLogin = async (req, res) => {
  const { userId, novaSenha } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    // Atualiza a senha com hash e marca que não é mais a senha padrão
    user.senha = bcrypt.hashSync(novaSenha, 10);
    user.senha_padrao = false;
    await user.save();
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno' });
  }
};