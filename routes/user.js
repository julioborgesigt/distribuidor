// /routes/user.js
const express = require('express');
const router = express.Router();
const userPageController = require('../controllers/userPageController');
const userController = require('../controllers/UserController');
const autenticarJWT = require('../middlewares/autenticarJWT');
const autenticarAdmin = require('../middlewares/autenticarAdmin');

// Aplica o middleware a todas as rotas deste módulo:
router.use(autenticarAdmin);

// Rota para a página do usuário
router.get('/usuario', userPageController.getUserPage);

// Rota protegida para obter os processos do usuário (ex: /processos)
router.get('/processos', autenticarAdmin, userController.listUserProcesses);

router.post('/cumprir', autenticarAdmin, userController.marcarCumprido);
router.post('/update-observacoes', autenticarAdmin, userController.updateObservacoes);



module.exports = router;
