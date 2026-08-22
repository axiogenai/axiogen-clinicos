const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', patientController.getPatients);
router.get('/search', patientController.searchPatients);
router.post('/', patientController.createPatient);
router.get('/:id', patientController.getPatient);
router.put('/:id', patientController.updatePatient);
router.post('/renew-validity', patientController.renewPatientValidity);
router.post('/:id/renew', patientController.renewPatientValidity);
router.delete('/:id', patientController.deletePatient);

module.exports = router;
