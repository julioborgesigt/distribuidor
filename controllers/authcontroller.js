// /controllers/authController.js
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seuSegredoAqui'; // Substitua por um valor seguro

exports.login = async (req, res) => {
  const { matricula, senha } = req.body;
  try {
    const user = await User.findOne({ where: { matricula } });
    if (!user) {
      console.log(`Usuário não encontrado: ${matricula}`);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Logs para depuração
    console.log(`Senha fornecida: ${senha}`);
    console.log(`Senha armazenada: ${user.senha}`);
    console.log(`Valor de senha_padrao: ${user.senha_padrao}`);

    let senhaValida = false;
    if (user.senha_padrao) {
      // Se for primeiro login, a senha está em texto plano
      senhaValida = (senha === user.senha);
    } else {
      // Senha já foi trocada, logo, está hasheada
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
    // Atualiza a senha com hash e marca que n\u00e3o \u00e9 mais a senha padr\u00e3o
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
