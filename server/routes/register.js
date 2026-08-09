const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/daily', registerController.getDailyRegister);
router.get('/monthly', registerController.getMonthlyRegister);
router.get('/yearly', registerController.getYearlyRegister);
router.post('/sync', registerController.syncRegisterForDate);

module.exports = router;
