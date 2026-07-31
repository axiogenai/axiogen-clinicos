const { Queue, Patient, AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.getQueue = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const queue = await Queue.findAll({
      where: { clinicId, date },
      order: [['created_at', 'ASC']]
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

    const idToUse = queueId || `Q${Date.now()}`;
    const timeAdded = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentDate = date || new Date().toISOString().split('T')[0];

    const queueItem = await Queue.create({
      queueId: idToUse,
      clinicId,
      patientId: patientId || null,
      name,
      age: age ? parseInt(age, 10) : null,
      phone: phone || '',
      village: village || '',
      complaint: complaint || '',
      notes: notes || '',
      date: currentDate,
      timeAdded,
      status: 'waiting'
    });

    await AuditLog.create({
      clinicId,
      userId: req.user?.id || 1,
      action: 'add_to_queue',
      entityType: 'queue',
      entityId: idToUse,
      details: { patientName: name }
    });

    res.status(201).json(queueItem);
  } catch (err) {
    next(err);
  }
};

exports.updateQueueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    let item = await Queue.findOne({
      where: {
        [Op.or]: [
          { queueId: id },
          { patientId: id },
          { name: id }
        ]
      }
    });

    if (!item) {
      item = await Queue.findByPk(id);
    }

    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    await item.update({ status });
    console.log(`✅ [QUEUE STATUS UPDATED] Queue item ${item.queueId} (${item.name}) updated to status: '${status}'`);
    res.json(item);
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
