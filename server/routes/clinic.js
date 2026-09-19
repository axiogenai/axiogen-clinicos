const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { verifyToken } = require('../middleware/auth');

// Public Clinical Translation & Sentence Parsing endpoints
router.post('/translate', clinicController.translateText);
router.post('/parse-sentence', clinicController.parseSentence);

// Protected Clinic Settings
router.use(verifyToken);
router.get('/settings', clinicController.getSettings);
router.put('/settings', clinicController.updateSettings);

module.exports = router;
