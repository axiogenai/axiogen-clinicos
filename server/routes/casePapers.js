const express = require('express');
const router = express.Router();
const casePaperController = require('../controllers/casePaperController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', casePaperController.getCasePapers);
router.post('/', casePaperController.createCasePaper);
router.get('/:id', casePaperController.getCasePaper);
router.put('/:id', casePaperController.updateCasePaper);
router.get('/patient/:patientId', casePaperController.getPatientHistory);

module.exports = router;
