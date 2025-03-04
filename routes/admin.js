const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticarAdmin = require('../middlewares/autenticarAdmin');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Aplica o middleware a todas as rotas deste módulo
router.use(autenticarAdmin);

router.get('/', adminController.getAdminPage);
router.post('/upload', upload.single('csvFile'), adminController.uploadCSV);
router.get('/processes', adminController.listProcesses);
router.post('/assign', adminController.assignProcesses);
router.post('/manual-assign', adminController.manualAssignProcess);
router.post('/pre-cadastro', adminController.preCadastro);
router.post('/reset-password', adminController.resetPassword);
router.post('/bulk-assign', adminController.bulkAssign);
router.post('/bulk-delete', adminController.bulkDelete);
router.post('/bulk-cumprido', adminController.bulkCumprido);

module.exports = router;
