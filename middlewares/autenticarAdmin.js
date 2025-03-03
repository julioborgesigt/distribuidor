// /middlewares/autenticarAdmin.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seuSegredoAqui'; // Use o mesmo segredo que no authController

const autenticarAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401); // não autorizado
  const token = authHeader.split(' ')[1]; // formato "Bearer TOKEN"
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // token inválido ou expirado
    if (!decoded.admin) { 
      // Se o token não tiver a propriedade admin true, acesso negado
      return res.status(403).json({ error: 'Acesso de administrador negado.' });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = autenticarAdmin;
