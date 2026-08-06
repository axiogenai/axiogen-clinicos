const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', medicineController.getMedicines);
router.get('/search', medicineController.searchMedicines);
router.get('/count', medicineController.getMedicineCount);
router.post('/bulk', medicineController.bulkImportMedicines);
router.post('/', medicineController.createMedicine);
router.put('/:id', medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;

