// /middlewares/autenticarUsuario.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = 'b7f8a2d4e3f7c78e8e9a3d0b5f6d8a3e7c9f2b8e4d1a5c0e2d3f9b6a7d8e4c1f';


const autenticarUsuario = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('Autenticação: authHeader ausente');
    return res.sendStatus(401);
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('Autenticação: erro na verificação do token:', err);
      return res.sendStatus(403);
    }
    console.log('Token decodificado:', decoded);
    try {
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log('Autenticação: usuário não encontrado');
        return res.sendStatus(404);
      }
      // Armazena o loginType separadamente
      req.loginType = decoded.loginType || null;
      req.user = user;
      req.userId = user.id;
      next();
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return res.sendStatus(500);
    }
  });
};


module.exports = autenticarUsuario;

