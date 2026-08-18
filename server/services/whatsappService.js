const { CasePaper, Patient, Queue } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { getISTDateStr, getISTTimeString, getISTTimeInfo } = require('../utils/timezone');


// Sent message log store to prevent duplicate reminders
const sentLog = new Set();

function formatWhatsAppDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const marathiMonths = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
    const month = marathiMonths[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats WhatsApp text message for a patient follow-up reminder
 */
function buildReminderMessage(patientName, followUpDate, doctorName = 'डॉ. प्रमोद सुरेश शिनगारे') {
  const formattedDate = formatWhatsAppDate(followUpDate);

  return (
    `🌿 *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक* 🌿\n` +
    `त्वचा • केस • नख विकार तज्ञ\n\n` +
    `🙏 *नमस्कार*\n\n` +
    `आपल्या उत्तम आरोग्याच्या दिशेने आणखी एक पाऊल…\n\n` +
    `आपली पुढील त्वचारोग तपासणी \n` +
    `*${doctorName}* यांच्यासोबत *${formattedDate}* रोजी नियोजित करण्यात आली आहे.\n\n` +
    `*📍 पत्ता :*\n` +
    `एस. टी. स्टँडजवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती, पेठ वडगाव.\n\n` +
    `*🕙 तपासणीची वेळ :*\n` +
    `सकाळी १०:०० ते सायंकाळी ६:००\n\n` +
    `*📞 संपर्क :*\n` +
    `७२४९७२७१०४ | ९६५७७२७१०४\n\n` +
    `*📌 विनंती :*\n` +
    `कृपया नियोजित वेळेत क्लिनिकला भेट द्यावी.\n\n` +
    `💚 *आपल्या विश्वासाबद्दल मनःपूर्वक आभार!*\n` +
    `आपले निरोगी, सुंदर आणि आत्मविश्वासपूर्ण आयुष्य हेच आमचे ध्येय आहे. आपणास सर्वोत्तम उपचार आणि सेवा देण्यासाठी आम्ही सदैव कटिबद्ध आहोत.\n\n` +
    `आपल्या उत्तम आरोग्यासाठी हार्दिक शुभेच्छा! 🌸\n` +
    `    🌿 “निरोगी त्वचा • सुंदर व्यक्तिमत्त्व • आत्मविश्वासपूर्ण जीवन.”\n\n` +
    `– *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक*\n` +
    `डॉ. प्रमोद शिनगारे (त्वचारोगतज्ञ), पेठ वडगाव`
  );
}

/**
 * Annual Calendar of Major Indian / Marathi Festivals
 */
const FESTIVAL_CALENDAR = {
  '01-01': {
    name: 'नवीन वर्ष (New Year 2026)',
    message: 'नवीन वर्षाच्या आपणास व आपल्या परिवारास हार्दिक हार्दिक शुभेच्छा! हे नवीन वर्ष आपल्या आयुष्यात सुख, समृद्धी, समाधान आणि उत्तम आरोग्य घेऊन येवो!'
  },
  '01-14': {
    name: 'मकर संक्रांती (Makar Sankranti)',
    message: 'तिळगूळ घ्या, गोड गोड बोला! मकर संक्रांतीच्या आपणास व आपल्या कुटुंबास मनःपूर्वक शुभेच्छा! आपले नाते असेच गोड आणि दृढ राहो!'
  },
  '01-26': {
    name: 'प्रजासत्ताक दिन (Republic Day)',
    message: 'भारतीय प्रजासत्ताक दिनाच्या सर्व देशवासीयांना हार्दिक हार्दिक शुभेच्छा! जय हिंद, जय भारत! 🇮🇳'
  },
  '02-19': {
    name: 'छत्रपती शिवाजी महाराज जयंती (Shiv Jayanti)',
    message: 'प्रौढ प्रताप पुरंदर, क्षत्रियकुलावतंस, सिंहासनाधीश्वर, श्रीमंत छत्रपती शिवाजी महाराज यांच्या जयंतीनिमित्त त्रिवार मानाचा मुजरा! 🚩'
  },
  '03-14': {
    name: 'होळी / धुलिवंदन (Holi)',
    message: 'रंगांची उधळण, आनंदाची बरसात! होळी व धुलिवंदनाच्या आपणास व आपल्या कुटुंबास रंगीबेरंगी हार्दिक शुभेच्छा! 🎨'
  },
  '03-30': {
    name: 'गुढीपाडवा (Gudi Padwa)',
    message: 'मराठी नूतन वर्षाच्या व गुढीपाडव्याच्या आपणास व आपल्या परिवारास हार्दिक मनःपूर्वक शुभेच्छा! नवीन वर्ष आरोग्यदायी व भरभराटीचे जावो! 🚩'
  },
  '04-14': {
    name: 'डॉ. बाबासाहेब आंबेडकर जयंती (Ambedkar Jayanti)',
    message: 'भारतीय घटनेचे शिल्पकार, भारतरत्न डॉ. बाबासाहेब आंबेडकर यांच्या जयंतीनिमित्त विनम्र अभिवादन! 🙏'
  },
  '05-01': {
    name: 'महाराष्ट्र दिन व कामगार दिन (Maharashtra Day)',
    message: 'महाराष्ट्र दिन व जागतिक कामगार दिनाच्या सर्व बांधवांना हार्दिक हार्दिक शुभेच्छा! जय महाराष्ट्र! 🚩'
  },
  '08-15': {
    name: 'स्वातंत्र्य दिन (Independence Day)',
    message: 'भारतीय स्वातंत्र्य दिनाच्या सर्वांना हार्दिक शुभेच्छा! चला आपल्या देशाच्या प्रगतीसाठी व आरोग्यासाठी एकत्र येऊया! 🇮🇳'
  },
  '08-27': {
    name: 'गणेश चतुर्थी (Ganesh Chaturthi)',
    message: 'गणपती बाप्पा मोरया! गणेश चतुर्थीच्या व श्री गणेशाच्या आगमनानिमित्त हार्दिक शुभेच्छा! बाप्पा आपल्या सर्व चिंता दूर करो व उत्तम आरोग्य प्रदान करो! 🌺'
  },
  '10-02': {
    name: 'महात्मा गांधी जयंती (Gandhi Jayanti)',
    message: 'राष्ट्रपिता महात्मा गांधी व लाल बहादूर शास्त्री यांच्या जयंतीनिमित्त विनम्र अभिवादन! 🙏'
  },
  '10-12': {
    name: 'दसरा / विजयादशमी (Dussehra)',
    message: 'आपट्याची पाने, सोन्याची खाण, दसऱ्याच्या दिवशी द्या एकमेकांना मानाचा मान! विजयादशमी व दसऱ्याच्या हार्दिक शुभेच्छा! 🏹'
  },
  '11-01': {
    name: 'दिवाळी (Diwali - Laxmi Pujan)',
    message: 'दिव्यांच्या लखलखाटात आणि आनंदाच्या वातावरणात साजरी होणाऱ्या दीपावलीच्या आपणास व आपल्या संपूर्ण परिवारास हार्दिक शुभेच्छा! आरोग्य, समृद्धी व समाधान लाभो! 🪔'
  },
  '11-02': {
    name: 'बळीप्रतिपदा व पाडवा (Diwali Padwa)',
    message: 'दीपावली पाडवा व नवीन वर्षाच्या मंगलमय शुभेच्छा! आपले आयुष्य सुख-समृद्धीने व उत्तम आरोग्याने उजळून निघो! 🪔'
  },
  '11-03': {
    name: 'भाऊबीज (Bhau Beej)',
    message: 'बहीण-भावाच्या पवित्र प्रेमाचे प्रतीक असणाऱ्या भाऊबीज सणाच्या हार्दिक हार्दिक शुभेच्छा! 🌸'
  }
};

/**
 * Automatically sends Festival Greetings to ALL registered patients on holiday/festival dates
 */
async function processFestivalWishes(overrideDateStr = null) {
  const { dateStr } = getISTTimeInfo();
  const targetDate = overrideDateStr || dateStr;
  const monthDay = targetDate.slice(5); // 'MM-DD'

  const festival = FESTIVAL_CALENDAR[monthDay];
  if (!festival && !overrideDateStr) {
    return { status: 'no_festival', date: targetDate, message: 'No festival scheduled for today.' };
  }

  const activeFestival = festival || {
    name: 'उत्सवाच्या हार्दिक शुभेच्छा (Festive Greetings)',
    message: 'आपणास व आपल्या संपूर्ण कुटुंबास सण आणि उत्सवाच्या शिनगारे स्किन क्लिनिकतर्फे हार्दिक हार्दिक शुभेच्छा!'
  };

  const results = {
    festivalName: activeFestival.name,
    date: targetDate,
    totalPatients: 0,
    sentCount: 0,
    skippedCount: 0,
  };

  try {
    const allPatients = await Patient.findAll();
    results.totalPatients = allPatients.length;

    for (const patient of allPatients) {
      if (!patient || !patient.phone || patient.phone.length < 10) {
        results.skippedCount++;
        continue;
      }

      const logKey = `FESTIVAL_${activeFestival.name}_${patient.id}_${targetDate}`;
      if (sentLog.has(logKey)) {
        results.skippedCount++;
        continue;
      }

      const messageText = (
        `🌿 *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक* 🌿\n` +
        `त्वचा • केस • नख विकार तज्ञ\n\n` +
        `🙏 *नमस्कार*\n\n` +
        `🎉 *${activeFestival.name}*\n\n` +
        `${activeFestival.message}\n\n` +
        `आपणास व आपल्या संपूर्ण परिवारास शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक परिवारातर्फे हार्दिक मनःपूर्वक शुभेच्छा! 🌸\n\n` +
        `📍 *पत्ता :*\n` +
        `एस. टी. स्टँडजवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती, पेठ वडगाव.\n` +
        `📞 *संपर्क :* ७२४९७२७१०४ | ९६५७७२७१०४\n\n` +
        `– *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक*\n` +
        `डॉ. प्रमोद शिनगारे (त्वचारोगतज्ञ), पेठ वडगाव`
      );

      const dispatchSuccess = await dispatchWhatsAppMessage(patient.phone, messageText);
      if (dispatchSuccess) {
        sentLog.add(logKey);
        results.sentCount++;
      } else {
        results.skippedCount++;
      }

      // Humanized 10-12 second delay between messages to prevent WhatsApp anti-spam flagging
      const humanDelay = 2000; // Safe 2-second delay between messages
      await new Promise(r => setTimeout(r, humanDelay));
    }

    console.log(`🎉 [FESTIVAL ENGINE] Completed sending '${activeFestival.name}' greetings to ${results.sentCount}/${results.totalPatients} patients.`);
  } catch (err) {
    console.error('❌ Error in processFestivalWishes:', err);
  }

  return results;
}



/**
 * Returns tomorrow's date string (YYYY-MM-DD) strictly in Indian Standard Time (Asia/Kolkata)
 * Reminders are automatically sent 1 day BEFORE the scheduled appointment date
 */
function getTomorrowISTDateStr() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(tomorrow);

  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;

  return `${year}-${month}-${day}`;
}

/**
 * Background Auto-Send Engine: Sends WhatsApp messages to all patients scheduled for follow-up on targetDate
 * Default targetDate is TOMORROW (1 day earlier than appointment date)
 */
async function processBackgroundFollowUps(targetDate = null) {
  const dateStr = targetDate || getTomorrowISTDateStr();
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

      // Humanized 10-12 second delay between messages to avoid WhatsApp rate limiting
      const humanDelay = 2000; // Safe 2-second delay between messages
      await new Promise(r => setTimeout(r, humanDelay));
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
    const rawClean = phone.replace(/\D/g, '');
    if (rawClean.length < 10) return false;
    const cleanPhone = rawClean.slice(-10);
    const formattedPhone = `91${cleanPhone}`;

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
  const dateStr = targetDate || getISTDateStr();
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
      'Consulting Doctor': 'Dr. Pramod Suresh Shingare',
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
  let lastFestivalDate = '';
  let lastEndDayDate = ''; // Tracks midnight auto End Day & Save

  const checkIntervalMs = 60 * 1000; // Check every 1 minute

  const runChecks = async () => {
    const { dateStr, hour, minute } = getISTTimeInfo();

    // ── Midnight Auto End Day & Save (12:00 AM IST) ──
    // At midnight, the calendar date rolls over. We save for YESTERDAY.
    // This replicates exactly what the "End Day & Save" button does.
    if (hour === 0 && lastEndDayDate !== dateStr) {
      lastEndDayDate = dateStr;
      // Yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      console.log(`🌙 [MIDNIGHT AUTO END-DAY IST ${dateStr}] Auto-saving OPD Register for ${yesterdayStr}...`);
      try {
        const { OpdRegister, Queue, Patient, CasePaper } = require('../models');
        const { Op } = require('sequelize');
        const clinicId = 1;
        const [yStr, mStr, dStr] = yesterdayStr.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);
        const day = parseInt(dStr, 10);

        const queueItems = await Queue.findAll({
          where: { clinicId, date: yesterdayStr },
          order: [['created_at', 'ASC']]
        });

        let srNo = 1;
        for (const q of queueItems) {
          const patient = q.patientId ? await Patient.findByPk(q.patientId) : null;
          const casePaper = q.patientId ? await CasePaper.findOne({
            where: { clinicId, patientId: q.patientId, date: yesterdayStr }
          }) : null;

          const [record] = await OpdRegister.findOrCreate({
            where: { clinicId, date: yesterdayStr, queueId: q.queueId },
            defaults: {
              clinicId, date: yesterdayStr, year, month, day, srNo,
              opdNo: q.queueId || `OPD-${yesterdayStr.replace(/-/g, '')}-${String(srNo).padStart(3, '0')}`,
              queueId: q.queueId,
              patientId: q.patientId,
              patientName: q.name,
              age: q.age || patient?.age || 0,
              gender: patient?.gender || 'M',
              phone: q.phone || patient?.phone || '',
              village: q.village || patient?.village || '',
              complaint: q.complaint || casePaper?.complaint || '',
              diagnosis: casePaper?.pastHistory || '',
              medicines: casePaper?.medicines || [],
              investigations: casePaper?.investigationsAdvised || [],
              counselling: casePaper?.counsellingDone || [],
              followUpDate: casePaper?.followUpDate || '',
              timeAdded: q.timeAdded,
              status: casePaper ? 'completed' : q.status
            }
          });
          if (record) {
            await record.update({
              patientName: q.name,
              age: q.age || patient?.age || record.age,
              phone: q.phone || patient?.phone || record.phone,
              village: q.village || patient?.village || record.village,
              complaint: q.complaint || casePaper?.complaint || record.complaint,
              status: casePaper ? 'completed' : q.status,
              medicines: casePaper?.medicines || record.medicines,
              followUpDate: casePaper?.followUpDate || record.followUpDate
            });
          }
          srNo++;
        }

        // Also write the JSON disk archive on Oracle VM
        try {
          const fs = require('fs');
          const path = require('path');
          const registerDir = path.join(__dirname, '../registers', String(year), String(month).padStart(2, '0'));
          if (!fs.existsSync(registerDir)) fs.mkdirSync(registerDir, { recursive: true });
          const jsonPath = path.join(registerDir, `opd_register_${yesterdayStr}.json`);
          const allSynced = await OpdRegister.findAll({ where: { clinicId, date: yesterdayStr } });
          fs.writeFileSync(jsonPath, JSON.stringify({ date: yesterdayStr, year, month, day, totalPatients: allSynced.length, records: allSynced }, null, 2));
          console.log(`💾 [MIDNIGHT DISK REGISTER]: Archive saved for ${yesterdayStr} → ${jsonPath}`);
        } catch (diskErr) {
          console.warn('Disk archive notice:', diskErr.message);
        }

        console.log(`✅ [MIDNIGHT AUTO END-DAY]: OPD Register auto-saved for ${yesterdayStr} (${srNo - 1} patients).`);
      } catch (err) {
        console.error('❌ Midnight auto End-Day Save error:', err);
      }
    }

    // Trigger automated festival wishes at 8:30 AM IST or later on holiday dates
    const monthDay = dateStr.slice(5);
    if (hour >= 8 && FESTIVAL_CALENDAR[monthDay] && lastFestivalDate !== dateStr) {
      lastFestivalDate = dateStr;
      console.log(`🎉 [FESTIVAL ENGINE IST ${dateStr}] Today is ${FESTIVAL_CALENDAR[monthDay].name}! Triggering auto festival greetings...`);
      try {
        await processFestivalWishes(dateStr);
      } catch (err) {
        console.error('❌ Festival wishes error:', err);
      }
    }

    // Trigger daily reminders if it is 9 AM IST or later, and we haven't sent for today yet
    if (hour >= 9 && lastReminderDate !== dateStr) {
      lastReminderDate = dateStr;
      console.log(`⏰ [IST ${dateStr} ${hour}:${minute}] Triggering 1-Day Prior WhatsApp Follow-Up Reminders...`);
      try {
        const summary = await processBackgroundFollowUps();
        console.log(`✅ 1-Day Prior WhatsApp Reminders Complete (Target Date: ${summary.date}): Sent ${summary.sentCount}/${summary.totalEligible}`);
      } catch (err) {
        console.error('❌ Scheduler reminder error:', err);
      }
    }

    // Run backup at 23:00 (11 PM) IST
    if (hour === 23 && lastBackupDate !== dateStr) {
      lastBackupDate = dateStr;
      console.log(`⏰ [IST ${dateStr}] Triggering Daily Automated Background Register Backup & 7-Day Purge...`);
      await autoBackupDailyQueue(dateStr);
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

  // Run immediately on start, then every 1 minute
  runChecks();
  setInterval(runChecks, checkIntervalMs);
}

// Auto-start background scheduler engine for WhatsApp reminders & festival wishes
initBackgroundScheduler();

module.exports = {
  buildReminderMessage,
  processBackgroundFollowUps,
  processFestivalWishes,
  FESTIVAL_CALENDAR,
  dispatchWhatsAppMessage,
  initBackgroundScheduler,
};
