// /middlewares/autenticarAdmin.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seuSegredoAqui';

const autenticarAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('Autenticação: authHeader ausente');
    return res.sendStatus(401);
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Autenticação: erro na verificação do token:', err);
      return res.sendStatus(403);
    }
    console.log('Token decodificado:', decoded);
    if (!decoded.admin) {
      console.log('Autenticação: acesso de administrador negado para o token:', decoded);
      return res.status(403).json({ error: 'Acesso de administrador negado.' });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = autenticarAdmin;
