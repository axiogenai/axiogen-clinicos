const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.get('/status', whatsappController.getStatus);
router.post('/trigger-auto-send', whatsappController.triggerAutoSend);
router.post('/send-single', whatsappController.sendSingleReminder);
router.post('/disconnect', whatsappController.disconnectGateway);
router.post('/restart', whatsappController.restartGateway);
router.post('/settings', whatsappController.updateSettings);

module.exports = router;
