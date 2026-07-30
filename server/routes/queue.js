const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', queueController.getQueue);
router.get('/stats', queueController.getQueueStats);
router.post('/', queueController.addToQueue);
router.put('/:id', queueController.updateQueueStatus);
router.delete('/:id', queueController.removeFromQueue);

module.exports = router;
