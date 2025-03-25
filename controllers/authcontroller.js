// /controllers/authController.js
const { User } = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'b7f8a2d4e3f7c78e8e9a3d0b5f6d8a3e7c9f2b8e4d1a5c0e2d3f9b6a7d8e4c1f'; // Substitua por um valor seguro

exports.login = async (req, res) => {
  console.log("login: Iniciando login, corpo da requisição:", req.body);
  const { matricula, senha, loginType } = req.body;
  try {
    const user = await User.findOne({ where: { matricula } });
    console.log("login: Usuário encontrado?", user ? "Sim" : "Não");
    if (!user) {
      console.log(`login: Usuário não encontrado: ${matricula}`);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Validação de login conforme o tipo selecionado
    if (loginType === 'admin_super' && !user.admin_super) {
      console.log(`login: Acesso de Admin Super negado para a matrícula: ${matricula}`);
      return res.status(403).json({ error: 'Acesso de Admin Super negado.' });
    }
    if (loginType === 'admin_padrao' && !user.admin_padrao) {
      console.log(`login: Acesso de Admin Padrão negado para a matrícula: ${matricula}`);
      return res.status(403).json({ error: 'Acesso de Admin Padrão negado.' });
    }
    
    let senhaValida = false;
    if (user.senha_padrao) {
      console.log("login: Verificando senha padrão (primeiro login)...");
      senhaValida = (senha === user.senha);
    } else {
      console.log("login: Comparando senha com bcryptjs...");
      senhaValida = bcryptjs.compareSync(senha, user.senha);
    }
    
    console.log("login: Resultado da verificação de senha:", senhaValida);
    if (!senhaValida) {
      console.log(`login: Senha incorreta para a matrícula: ${matricula}`);
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    if (user.senha_padrao) {
      console.log("login: Este é seu primeiro login.");
      return res.json({ firstLogin: true, userId: user.id });
    } else {
      console.log("login: Este não é seu primeiro login. Gerando token...");
      const token = jwt.sign({ id: user.id, loginType }, JWT_SECRET, { expiresIn: '8h' });
      console.log("login: Token gerado:", token);
      // Cria o objeto de usuário que será enviado na resposta
      let loginUser = {
        id: user.id,
        matricula: user.matricula,
        admin_padrao: user.admin_padrao,
        admin_super: user.admin_super
      };
      // Se o loginType for "admin_padrao", mesmo tendo ambos setados, força admin_super a false
      if (loginType === 'admin_padrao') {
        console.log("login: Login solicitado como admin_padrao; forçando admin_super para false.");
        loginUser.admin_super = false;
      }
      return res.json({ token, user: loginUser });
    }
  } catch (error) {
    console.error("login: Erro interno:", error);
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
    user.senha = bcryptjs.hashSync(novaSenha, 10);
    user.senha_padrao = false;
    await user.save();
    const token = jwt.sign({ id: user.id, loginType }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno' });
  }
};