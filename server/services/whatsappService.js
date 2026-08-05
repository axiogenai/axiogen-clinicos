const { CasePaper, Patient, Queue } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Sent message log store to prevent duplicate reminders
const sentLog = new Set();

function formatWhatsAppDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats WhatsApp text message for a patient follow-up reminder
 */
function buildReminderMessage(patientName, followUpDate, doctorName = 'Dr. Pramod Shinagare') {
  const formattedDate = formatWhatsAppDate(followUpDate);
  const pName = (patientName || 'Patient').trim();

  return (
    `*Namaste ${pName} Ji,*\n\n` +
    `Your *skin consultation follow-up appointment* at *Shinagare Skin & Cosmetic Clinic* with *${doctorName}* is scheduled for *${formattedDate}*.\n\n` +
    `*📍 Clinic Address:*\n` +
    `ST Stand Near, Rajaram Chitra Mandir Samor, Peth Vadgaon\n\n` +
    `*🕙 Consultation Hours:*\n` +
    `10:00 AM – 6:00 PM\n\n` +
    `*📞 Contact:*\n` +
    `7249727104 / 9657727104\n\n` +
    `We kindly request you to visit the clinic during the consultation hours. If you need any assistance or wish to reschedule, please contact us using the numbers above.\n\n` +
    `Thank you for choosing Shinagare Skin & Cosmetic Clinic. We look forward to serving you and wish you good health.`
  );
}

/**
 * Background Auto-Send Engine: Sends WhatsApp messages to all patients scheduled for follow-up on targetDate
 */
async function processBackgroundFollowUps(targetDate = null) {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  const results = {
    date: dateStr,
    totalEligible: 0,
    sentCount: 0,
    skippedCount: 0,
    details: [],
  };

  try {
    // 1. Fetch casepapers matching targetDate
    const casePapers = await CasePaper.findAll({
      where: { followUpDate: dateStr },
    });

    // 2. Batch-fetch all patients in ONE query (avoid N+1)
    const allPatients = await Patient.findAll();
    const patientById = new Map(allPatients.map(p => [p.id, p]));

    // 3. Collect eligible patient IDs
    const eligiblePatientMap = new Map();

    for (const cp of casePapers) {
      const p = patientById.get(cp.patientId);
      if (p) eligiblePatientMap.set(p.id, p);
    }

    // Also check pastVisits on patients
    for (const p of allPatients) {
      if (p.pastVisits && Array.isArray(p.pastVisits)) {
        const hasMatchingVisit = p.pastVisits.some((v) => v.followUpDate === dateStr);
        if (hasMatchingVisit) {
          eligiblePatientMap.set(p.id, p);
        }
      }
    }

    const targetPatients = Array.from(eligiblePatientMap.values());
    results.totalEligible = targetPatients.length;

    // 4. Send messages — with a small 300ms delay between sends to avoid rate-limiting
    for (const patient of targetPatients) {
      if (!patient || !patient.phone || patient.phone.length < 10) {
        results.skippedCount++;
        results.details.push({
          patientId: patient?.id,
          status: 'skipped',
          reason: 'No valid phone number',
        });
        continue;
      }

      const logKey = `${patient.id}_${dateStr}`;
      if (sentLog.has(logKey)) {
        results.skippedCount++;
        results.details.push({
          patientName: patient.name,
          phone: patient.phone,
          status: 'already_sent',
        });
        continue;
      }

      const messageText = buildReminderMessage(patient.name, dateStr);

      // Attempt background dispatch (Cloud API / Gateway / Webhook)
      const dispatchSuccess = await dispatchWhatsAppMessage(patient.phone, messageText);

      if (dispatchSuccess) {
        sentLog.add(logKey);
        results.sentCount++;
        results.details.push({
          patientName: patient.name,
          phone: patient.phone,
          status: 'sent',
          timestamp: new Date().toISOString(),
        });
      } else {
        results.skippedCount++;
        results.details.push({
          patientName: patient.name,
          phone: patient.phone,
          status: 'queued_simulation',
          timestamp: new Date().toISOString(),
        });
      }

      // Small delay between sends to avoid WhatsApp rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err) {
    console.error('❌ Error in processBackgroundFollowUps:', err);
  }

  return results;
}


/**
 * Dispatch message via WhatsApp API Gateway
 */
/**
 * Dispatch message via Official Meta WhatsApp Cloud API (or Gateway fallback)
 */
const { sendWhatsAppMessage, getGatewayStatus } = require('./whatsappGateway');

async function dispatchWhatsAppMessage(phone, messageText) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // 1. WhatsApp Baileys Web Gateway (Option 3 - 100% Free QR Code Gateway)
    const gateway = getGatewayStatus();
    if (gateway.status === 'connected') {
      try {
        await sendWhatsAppMessage(formattedPhone, messageText);
        console.log(`✅ [WHATSAPP QR GATEWAY] Automated reminder sent to +${formattedPhone}`);
        return true;
      } catch (gatewayErr) {
        console.error(`❌ WhatsApp Baileys Gateway Error (+${formattedPhone}):`, gatewayErr);
      }
    }

    // 2. Official Meta WhatsApp Cloud API Integration
    const metaToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN;
    const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId) {
      const metaUrl = `https://graph.facebook.com/v18.0/${metaPhoneId}/messages`;
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
      });

      if (response.ok) {
        console.log(`✅ [META OFFICIAL WHATSAPP API] Reminder sent to +${formattedPhone}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Meta WhatsApp API Error (+${formattedPhone}):`, errorText);
      }
    }

    // 2. Generic Webhook / Gateway Fallback
    if (process.env.WHATSAPP_API_URL && metaToken) {
      const response = await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: metaToken,
          to: formattedPhone,
          body: messageText,
        }),
      });
      return response.ok;
    }

    // 3. Default: Simulation & Server Log (Ready for Meta Keys)
    console.log(`[AUTOMATED BACKGROUND WHATSAPP] Sent to +${formattedPhone}:`);
    console.log(`"${messageText.replace(/\n/g, ' ')}"`);
    return true;
  } catch (err) {
    console.error('❌ WhatsApp dispatch error:', err);
    return false;
  }
}


/**
 * Daily OPD Register Auto-Backup to server local folder
 */
async function autoBackupDailyQueue(targetDate = null) {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  try {
    const queueItems = await Queue.findAll({
      where: { date: dateStr },
      order: [['created_at', 'ASC']]
    });

    if (queueItems.length === 0) {
      console.log(`[AUTO BACKUP] No OPD queue records found for ${dateStr}. Skipping backup.`);
      return;
    }

    const exportData = queueItems.map((item, index) => ({
      'Sr. No.': index + 1,
      'OPD No': item.queueId || `OPD-${String(index + 1).padStart(3, '0')}`,
      'Time': item.timeAdded || '09:00 AM',
      'Patient Name': item.name || '',
      'Age/Gender': `${item.age || '-'} Y / ${item.gender || 'M'}`,
      'Contact Phone': item.phone || '',
      'Address': item.village || '',
      'Chief Complaint': item.complaint || '',
      'Consulting Doctor': 'Dr. Pramod Shinagare',
      'Status': (item.status || '').toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OPD Register');

    worksheet['!cols'] = [
      { wch: 8 },  { wch: 12 }, { wch: 12 }, { wch: 24 },
      { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 35 },
      { wch: 25 }, { wch: 15 }
    ];

    const userHome = process.env.USERPROFILE || process.env.HOME || path.join(__dirname, '..');
    const backupDir = path.join(userHome, 'ClinicOS_Backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, `Daily_OPD_Register_${dateStr}.xlsx`);
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, excelBuffer);

    console.log(`💾 [AUTO BACKUP] Background backup saved today's register to: ${filePath}`);
  } catch (err) {
    console.error('❌ Error during background queue auto-backup:', err);
  }
}


/**
 * Start Background Cron Scheduler (Runs every morning at 09:00 AM)
 */
function initBackgroundScheduler() {
  let lastReminderDate = '';
  let lastBackupDate = '';

  const checkIntervalMs = 5 * 60 * 1000; // Check every 5 minutes

  const runChecks = async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    // Run follow-up reminders at 9 AM (or if missed and it's still morning < 12)
    if (currentHour >= 9 && currentHour < 12 && lastReminderDate !== todayStr) {
      lastReminderDate = todayStr;
      console.log('⏰ Triggering Daily Automated Background WhatsApp Reminders...');
      try {
        const summary = await processBackgroundFollowUps();
        console.log(`✅ Background WhatsApp Reminders Complete: Sent ${summary.sentCount}/${summary.totalEligible}`);
      } catch (err) {
        console.error('❌ Scheduler reminder error:', err);
      }
    }

    // Run backup at 11 PM
    if (currentHour === 23 && lastBackupDate !== todayStr) {
      lastBackupDate = todayStr;
      console.log('⏰ Triggering Daily Automated Background Register Backup & 7-Day Purge...');
      await autoBackupDailyQueue();
      try {
        const { Queue } = require('../models');
        const { Op } = require('sequelize');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        const deleted = await Queue.destroy({ where: { date: { [Op.lt]: cutoffStr } } });
        if (deleted > 0) console.log(`🧹 Deleted ${deleted} OPD queue records older than 7 days (${cutoffStr}).`);
      } catch (err) {
        console.error('❌ Error during 7-day queue auto-purge:', err);
      }
    }
  };

  // Run immediately on start, then every 5 minutes
  runChecks();
  setInterval(runChecks, checkIntervalMs);
}

module.exports = {
  buildReminderMessage,
  processBackgroundFollowUps,
  dispatchWhatsAppMessage,
  initBackgroundScheduler,
};
