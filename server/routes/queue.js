const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { verifyToken } = require('../middleware/auth');
const { addClient, removeClient } = require('../services/sseService');

router.use(verifyToken);

// Real-time SSE endpoint — browser connects here to get instant queue push updates
router.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering on Railway
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  addClient(res);

  // Heartbeat every 25s to keep connection alive through Railway proxy
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

router.get('/', queueController.getQueue);
router.get('/stats', queueController.getQueueStats);
router.post('/auto-backup', queueController.autoBackupQueue);
router.post('/', queueController.addToQueue);
router.put('/:id', queueController.updateQueueStatus);
router.delete('/:id', queueController.removeFromQueue);

module.exports = router;

