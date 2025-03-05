// /routes/user.js
const express = require('express');
const router = express.Router();
const userPageController = require('../controllers/userPageController');
const userController = require('../controllers/UserController');
const autenticarJWT = require('../middlewares/autenticarJWT');


// Aplica o middleware a todas as rotas deste módulo:
router.use(autenticarJWT);

// Rota para a página do usuário
router.get('/usuario', userPageController.getUserPage);

// Rota protegida para obter os processos do usuário (ex: /processos)
router.get('/processos', userController.listUserProcesses);

router.post('/cumprir', autenticarJWT, userController.marcarCumprido);
router.post('/update-observacoes', autenticarJWT, userController.updateObservacoes);



module.exports = router;
