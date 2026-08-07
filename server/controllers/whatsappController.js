const { processBackgroundFollowUps, buildReminderMessage, processFestivalWishes } = require('../services/whatsappService');
const { getGatewayStatus, sendWhatsAppMessage, logoutGateway, initWhatsAppGateway } = require('../services/whatsappGateway');

let isAutoScheduleEnabled = true;

const getStatus = (req, res) => {
  const gatewayStatus = getGatewayStatus();
  res.json({
    autoScheduleEnabled: isAutoScheduleEnabled,
    dailyTime: '09:00 AM',
    status: gatewayStatus.status === 'connected' ? 'active' : 'inactive',
    gateway: gatewayStatus
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

const triggerFestivalWishes = async (req, res) => {
  const { date } = req.body;
  const summary = await processFestivalWishes(date);
  res.json({
    success: true,
    message: `Automated festival greetings processed for ${summary.festivalName || 'Festival'}`,
    summary,
  });
};

const sendSingleReminder = async (req, res, next) => {
  try {
    const { phone, patientName, name, message, followUpDate } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const pName = (patientName || name || 'Patient').trim();
    const dateStr = followUpDate || new Date().toISOString().split('T')[0];

    const finalMsg = (message && message.trim())
      ? (message.includes('{name}') ? message.replace(/\{name\}/g, pName) : message)
      : buildReminderMessage(pName, dateStr);

    const result = await sendWhatsAppMessage(phone, finalMsg);
    res.json({ success: true, result, formattedMessage: finalMsg });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp message' });
  }
};

const disconnectGateway = async (req, res) => {
  await logoutGateway();
  res.json({ success: true, message: 'WhatsApp Gateway session disconnected' });
};

const restartGateway = async (req, res) => {
  await initWhatsAppGateway();
  res.json({ success: true, gateway: getGatewayStatus() });
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
  triggerFestivalWishes,
  sendSingleReminder,
  disconnectGateway,
  restartGateway,
  updateSettings,
};
