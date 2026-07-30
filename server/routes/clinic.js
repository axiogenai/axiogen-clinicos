const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/settings', clinicController.getSettings);
router.put('/settings', clinicController.updateSettings);

module.exports = router;
