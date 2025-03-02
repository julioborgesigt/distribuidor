// /routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Configuração para upload de CSV
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Rota para a página do administrador
router.get('/', adminController.getAdminPage);

// Rota para upload de CSV
router.post('/upload', upload.single('csvFile'), adminController.uploadCSV);

// Rota para listar processos (JSON) - consumida via fetch no front-end
router.get('/processes', adminController.listProcesses);

// Rota para atribuir processos automaticamente
router.post('/assign', adminController.assignProcesses);

// Rota para atribuição manual de um processo
router.post('/manual-assign', adminController.manualAssignProcess);

// Rota para pré-cadastro de usuário
router.post('/pre-cadastro', adminController.preCadastro);

// Rota para reset de senha
router.post('/reset-password', adminController.resetPassword);

router.post('/bulk-assign', adminController.bulkAssign);
router.post('/bulk-delete', adminController.bulkDelete);
router.post('/bulk-cumprido', adminController.bulkCumprido);

module.exports = router;
