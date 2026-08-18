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
  // Respond immediately so HTTP connection never times out after 2-3 messages
  res.json({
    success: true,
    message: `Automated background WhatsApp reminders initiated for ${date || 'scheduled appointments'}. All messages are being sent in the background.`,
  });
  // Execute full batch dispatch asynchronously in background
  processBackgroundFollowUps(date).then(summary => {
    console.log(`✅ Completed follow-up batch: Sent ${summary.sentCount}/${summary.totalEligible} messages.`);
  }).catch(err => {
    console.error('❌ Error during background follow-up batch:', err);
  });
};

const triggerFestivalWishes = async (req, res) => {
  const { date } = req.body;
  res.json({
    success: true,
    message: `Festival greetings batch initiated in background. Messages are being sent to all registered patients.`,
  });
  processFestivalWishes(date).then(summary => {
    console.log(`✅ Completed festival batch: Sent ${summary.sentCount}/${summary.totalPatients} messages.`);
  }).catch(err => {
    console.error('❌ Error during background festival batch:', err);
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

const handleMetaWebhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'clinicos_meta_webhook_secret_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Meta Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

const handleMetaWebhookEvent = (req, res) => {
  res.status(200).send('EVENT_RECEIVED');
};

module.exports = {
  getStatus,
  triggerAutoSend,
  triggerFestivalWishes,
  sendSingleReminder,
  disconnectGateway,
  restartGateway,
  updateSettings,
  handleMetaWebhookVerify,
  handleMetaWebhookEvent,
};
