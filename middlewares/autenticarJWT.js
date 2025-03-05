const jwt = require('jsonwebtoken');
const JWT_SECRET = 'b7f8a2d4e3f7c78e8e9a3d0b5f6d8a3e7c9f2b8e4d1a5c0e2d3f9b6a7d8e4c1f'; // mesmo valor usado no authController

const autenticarJWT = (req, res, next) => {
  console.log("autenticarJWT: Iniciando autenticação do JWT");
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log("autenticarJWT: authHeader ausente");
    return res.sendStatus(401); // Não autorizado
  }
  console.log("autenticarJWT: Token recebido:", authHeader.split(' ')[1]);
  const token = authHeader.split(' ')[1]; // formato "Bearer TOKEN"
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("autenticarJWT: Erro ao decodificar token:", err);
      return res.sendStatus(403); // Proibido se token inválido ou expirado
    }
    console.log("autenticarJWT: Token decodificado:", decoded);
    req.userId = decoded.id;
    console.log("autenticarJWT: Autenticação finalizada, prosseguindo para o próximo middleware");
    next();
  });
};

module.exports = autenticarJWT;
