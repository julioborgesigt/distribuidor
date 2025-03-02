// /middlewares/autenticarJWT.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seuSegredoAqui'; // mesmo valor usado no authController

const autenticarJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401); // n\u00e3o autorizado
  const token = authHeader.split(' ')[1]; // formato "Bearer TOKEN"
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // proibido se token inv\u00e1lido ou expirado
    req.userId = decoded.id;
    next();
  });
};

module.exports = autenticarJWT;
