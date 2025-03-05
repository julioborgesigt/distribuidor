// /controllers/userPageController.js
const path = require('path');

exports.getUserPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'usuario.html'));
};
