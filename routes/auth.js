// /routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const authPageController = require('../controllers/authPageController');


// Rota para a página de login
router.get('/login', authPageController.getLoginPage);


// Rota para login (POST) e primeiro acesso
router.post('/login', authController.login);
router.post('/primeiro-login', authController.firstLogin);

module.exports = router;
