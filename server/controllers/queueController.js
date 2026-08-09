const { Queue, Patient, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { broadcastQueueUpdate } = require('../services/sseService');

const autoPurgeOldQueueItems = async (clinicId = 1) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const deleted = await Queue.destroy({
      where: {
        clinicId,
        date: {
          [Op.lt]: cutoffDateStr
        }
      }
    });
    if (deleted > 0) {
      console.log(`🧹 [7-DAY AUTOMATIC PURGE] Deleted ${deleted} OPD queue items older than 7 days (prior to ${cutoffDateStr}).`);
    }
  } catch (err) {
    console.error('❌ Error during 7-day queue auto-purge:', err);
  }
};

exports.getQueue = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // Automatically purge OPD queue items older than 7 days
    autoPurgeOldQueueItems(clinicId).catch(() => {});

    const queue = await Queue.findAll({
      where: { clinicId, date },
      order: [['created_at', 'DESC']]
    });
    res.json(queue);
  } catch (err) {
    next(err);
  }
};

exports.addToQueue = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const { queueId, patientId, name, age, phone, village, complaint, notes, date } = req.body;

    const currentDate = date || new Date().toISOString().split('T')[0];

    // Check if patient is already in today's queue
    if (patientId) {
      const existingInQueue = await Queue.findOne({
        where: {
          clinicId,
          date: currentDate,
          patientId,
          status: { [Op.ne]: 'cancelled' }
        }
      });
      if (existingInQueue) {
        return res.status(409).json({
          error: `Patient '${name}' is already in today's consultation queue (Status: ${existingInQueue.status.toUpperCase()}).`
        });
      }
    } else if (phone && phone.replace(/\D/g, '').length === 10) {
      const cleanPhone = phone.replace(/\D/g, '');
      const existingInQueue = await Queue.findOne({
        where: {
          clinicId,
          date: currentDate,
          phone: cleanPhone,
          status: { [Op.ne]: 'cancelled' }
        }
      });
      if (existingInQueue) {
        return res.status(409).json({
          error: `Patient with mobile number '${cleanPhone}' is already in today's OPD queue.`
        });
      }
    }

    const idToUse = queueId || `Q${Date.now()}`;
    const timeAdded = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const queueItem = await Queue.create({
      queueId: idToUse,
      clinicId,
      patientId: patientId || null,
      name,
      age: age ? parseInt(age, 10) : null,
      phone: phone ? phone.replace(/\D/g, '') : '',
      village: village || '',
      complaint: complaint || '',
      notes: notes || '',
      date: currentDate,
      timeAdded,
      status: 'waiting'
    });

    // Auto-sync into OpdRegister database table
    try {
      const { OpdRegister } = require('../models');
      const [yStr, mStr, dStr] = currentDate.split('-');
      await OpdRegister.findOrCreate({
        where: { clinicId, date: currentDate, queueId: idToUse },
        defaults: {
          clinicId,
          date: currentDate,
          year: parseInt(yStr, 10),
          month: parseInt(mStr, 10),
          day: parseInt(dStr, 10),
          queueId: idToUse,
          patientId: patientId || null,
          patientName: name,
          age: age ? parseInt(age, 10) : null,
          phone: phone ? phone.replace(/\D/g, '') : '',
          village: village || '',
          complaint: complaint || '',
          timeAdded,
          status: 'waiting'
        }
      });
    } catch (e) {
      console.warn('OpdRegister auto-sync notice:', e.message);
    }

    await AuditLog.create({
      clinicId,
      userId: req.user?.id || 1,
      action: 'add_to_queue',
      entityType: 'queue',
      entityId: idToUse,
      details: { patientName: name }
    });

    res.status(201).json(queueItem);
    broadcastQueueUpdate(); // Push real-time update to all connected browsers
  } catch (err) {
    next(err);
  }
};

exports.updateQueueStatus = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.phone) updateData.phone = updateData.phone.replace(/\D/g, '');
    if (updateData.age) updateData.age = parseInt(updateData.age, 10);
    const id = req.params.id;

    const [updatedCount] = await Queue.update(
      updateData,
      {
        where: {
          [Op.or]: [
            { queueId: id },
            { patientId: id },
            { name: id }
          ]
        }
      }
    );

    // If patientId is present and patient details were provided, update Patient record too
    const pId = req.body.patientId || id;
    if (pId) {
      try {
        const patientFields = {};
        if (req.body.name) patientFields.name = req.body.name;
        if (req.body.age) patientFields.age = parseInt(req.body.age, 10);
        if (req.body.gender) patientFields.gender = req.body.gender;
        if (req.body.phone) patientFields.phone = req.body.phone.replace(/\D/g, '');
        if (req.body.village) patientFields.village = req.body.village;
        if (req.body.pastHistory) patientFields.pastHistory = req.body.pastHistory;
        if (req.body.allergies) patientFields.allergies = req.body.allergies;

        if (Object.keys(patientFields).length > 0) {
          await Patient.update(patientFields, {
            where: {
              [Op.or]: [
                { id: pId },
                ...(req.body.phone ? [{ phone: req.body.phone.replace(/\D/g, '') }] : [])
              ]
            }
          });
        }
      } catch (e) {}
    }

    console.log(`✅ [QUEUE STATUS/DETAILS UPDATED] Updated queue item '${id}'`);
    res.json({ success: true, updatedCount, data: updateData });
    broadcastQueueUpdate(); // Push real-time update to all connected browsers
  } catch (err) {
    next(err);
  }
};

exports.removeFromQueue = async (req, res, next) => {
  try {
    const id = req.params.id;
    let item = await Queue.findByPk(id);
    if (!item) {
      item = await Queue.findOne({
        where: {
          [Op.or]: [
            { queueId: id },
            { patientId: id },
            { name: id }
          ]
        }
      });
    }

    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    await item.destroy();
    res.json({ message: 'Removed from queue' });
    broadcastQueueUpdate(); // Push real-time update to all connected browsers
  } catch (err) {
    next(err);
  }
};

exports.getQueueStats = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const all = await Queue.findAll({ where: { clinicId, date } });
    
    const stats = {
      total: all.length,
      waiting: all.filter(q => q.status === 'waiting').length,
      inConsultation: all.filter(q => q.status === 'in-consultation' || q.status === 'in_consultation').length,
      completed: all.filter(q => q.status === 'completed').length,
      cancelled: all.filter(q => q.status === 'cancelled').length
    };
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

exports.autoBackupQueue = async (req, res, next) => {
  try {
    const { date, items } = req.body;
    if (!date || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing date or items array' });
    }

    const exportData = items.map(item => ({
      'Sr. No.': item.srNo || '',
      'OPD No': item.opdNo || '',
      'Time': item.time || '',
      'Patient Name': item.name || '',
      'Age/Gender': `${item.age} Y / ${item.gender}`,
      'Contact Phone': item.phone || '',
      'Address': item.village || '',
      'Chief Complaint': item.complaint || '',
      'Consulting Doctor': item.doctor || '',
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

    const filename = `Daily_OPD_Register_${date}.xlsx`;
    const filePath = path.join(backupDir, filename);

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, excelBuffer);

    console.log(`💾 Auto-backup saved daily register to: ${filePath}`);

    res.json({
      success: true,
      message: 'Daily register auto-backup completed successfully',
      path: filePath
    });
  } catch (err) {
    console.error('❌ Error during daily register auto-backup:', err);
    next(err);
  }
};
