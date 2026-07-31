const { processBackgroundFollowUps } = require('../services/whatsappService');

let isAutoScheduleEnabled = true;

const getStatus = (req, res) => {
  res.json({
    autoScheduleEnabled: isAutoScheduleEnabled,
    dailyTime: '09:00 AM',
    status: 'active',
  });
};

const triggerAutoSend = async (req, res) => {
  const { date } = req.body;
  const summary = await processBackgroundFollowUps(date);
  res.json({
    success: true,
    message: `Automated background WhatsApp reminders processed for ${summary.date}`,
    summary,
  });
};

const updateSettings = (req, res) => {
  const { autoScheduleEnabled } = req.body;
  if (typeof autoScheduleEnabled === 'boolean') {
    isAutoScheduleEnabled = autoScheduleEnabled;
  }
  res.json({
    success: true,
    autoScheduleEnabled: isAutoScheduleEnabled,
  });
};

module.exports = {
  getStatus,
  triggerAutoSend,
  updateSettings,
};
