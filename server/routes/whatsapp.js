const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.get('/status', whatsappController.getStatus);
router.post('/trigger-auto-send', whatsappController.triggerAutoSend);
router.post('/settings', whatsappController.updateSettings);

module.exports = router;
