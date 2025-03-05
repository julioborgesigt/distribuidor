// /middlewares/autenticarJWT.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'b7f8a2d4e3f7c78e8e9a3d0b5f6d8a3e7c9f2b8e4d1a5c0e2d3f9b6a7d8e4c1f'; // mesmo valor usado no authController

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
