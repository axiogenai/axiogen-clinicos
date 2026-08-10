const { OpdRegister, Queue, Patient, CasePaper } = require('../models');
const { Op } = require('sequelize');
const { getISTDateStr } = require('../utils/timezone');

/**
 * Get Day-Wise OPD Register
 */
exports.getDailyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const date = req.query.date || getISTDateStr();

    const records = await OpdRegister.findAll({
      where: { clinicId, date },
      order: [['sr_no', 'ASC'], ['created_at', 'ASC']]
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Month-Wise OPD Register
/**
 * Helper to auto-sync all records for a month
 */
async function syncMonthRecords(clinicId, year, month) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  // Find all queue items for the month
  const queueItems = await Queue.findAll({
    where: {
      clinicId,
      date: { [Op.like]: `${monthStr}%` }
    },
    order: [['date', 'ASC'], ['created_at', 'ASC']]
  });

  // Group queue items by date to assign correct srNo
  const dateGroups = {};
  queueItems.forEach(q => {
    const d = q.date || `${monthStr}-01`;
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(q);
  });

  for (const dateKey of Object.keys(dateGroups)) {
    const [yStr, mStr, dStr] = dateKey.split('-');
    const day = parseInt(dStr, 10);
    let srNo = 1;

    for (const q of dateGroups[dateKey]) {
      const patient = q.patientId ? await Patient.findByPk(q.patientId) : null;
      const casePaper = q.patientId ? await CasePaper.findOne({
        where: { clinicId, patientId: q.patientId, date: dateKey }
      }) : null;

      const [record] = await OpdRegister.findOrCreate({
        where: { clinicId, date: dateKey, queueId: q.queueId },
        defaults: {
          clinicId,
          date: dateKey,
          year,
          month,
          day,
          srNo,
          opdNo: q.queueId || `OPD-${dateKey.replace(/-/g, '')}-${String(srNo).padStart(3, '0')}`,
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
  }
}

/**
 * Get Month-Wise OPD Register (Auto-syncs all days in the month)
 */
exports.getMonthlyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

    // Auto-sync month records first
    await syncMonthRecords(clinicId, year, month).catch(e => console.warn('Month auto-sync notice:', e.message));

    const records = await OpdRegister.findAll({
      where: { clinicId, year, month },
      order: [['date', 'ASC'], ['sr_no', 'ASC']]
    });

    // Summary statistics for month
    const totalPatients = records.length;
    const completedCount = records.filter(r => r.status === 'completed').length;
    const waitingCount = records.filter(r => r.status === 'waiting').length;

    // Group by Day
    const dailyBreakdown = {};
    records.forEach(r => {
      if (!dailyBreakdown[r.date]) {
        dailyBreakdown[r.date] = { date: r.date, count: 0, completed: 0 };
      }
      dailyBreakdown[r.date].count += 1;
      if (r.status === 'completed') dailyBreakdown[r.date].completed += 1;
    });

    res.json({
      year,
      month,
      summary: { totalPatients, completedCount, waitingCount, daysCount: Object.keys(dailyBreakdown).length },
      dailyBreakdown: Object.values(dailyBreakdown),
      records
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Year-Wise OPD Register (Auto-syncs all months in the year)
 */
exports.getYearlyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);

    // Sync current and previous months of the year
    for (let m = 1; m <= 12; m++) {
      await syncMonthRecords(clinicId, year, m).catch(() => {});
    }

    const records = await OpdRegister.findAll({
      where: { clinicId, year },
      order: [['date', 'ASC'], ['sr_no', 'ASC']]
    });

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthRecords = records.filter(r => r.month === m);
      return {
        month: m,
        totalPatients: monthRecords.length,
        completed: monthRecords.filter(r => r.status === 'completed').length,
        cancelled: monthRecords.filter(r => r.status === 'cancelled').length
      };
    });

    res.json({
      year,
      totalPatients: records.length,
      monthlyBreakdown,
      records
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Auto-Sync & Create Register Records from Queue & CasePapers for a specific date
 */
exports.syncRegisterForDate = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const targetDate = req.body?.date || req.query?.date || getISTDateStr();

    const [yStr, mStr, dStr] = targetDate.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const day = parseInt(dStr, 10);

    // Fetch all Queue items for targetDate
    const queueItems = await Queue.findAll({
      where: { clinicId, date: targetDate },
      order: [['created_at', 'ASC']]
    });

    // Sync queue items into permanent OpdRegister table
    const syncedRecords = [];
    let srNo = 1;

    for (const q of queueItems) {
      const patient = q.patientId ? await Patient.findByPk(q.patientId) : null;
      const casePaper = q.patientId ? await CasePaper.findOne({
        where: { clinicId, patientId: q.patientId, date: targetDate }
      }) : null;

      const [record] = await OpdRegister.findOrCreate({
        where: { clinicId, date: targetDate, queueId: q.queueId },
        defaults: {
          clinicId,
          date: targetDate,
          year,
          month,
          day,
          srNo,
          opdNo: q.queueId || `OPD-${targetDate.replace(/-/g, '')}-${String(srNo).padStart(3, '0')}`,
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

      // Update if already exists
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

      syncedRecords.push(record);
      srNo++;
    }

    // Write permanent register backup files directly to Oracle Cloud VM disk
    try {
      const fs = require('fs');
      const path = require('path');
      const registerDir = path.join(__dirname, '../registers', String(year), String(month).padStart(2, '0'));
      if (!fs.existsSync(registerDir)) {
        fs.mkdirSync(registerDir, { recursive: true });
      }

      const jsonPath = path.join(registerDir, `opd_register_${targetDate}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        date: targetDate,
        year,
        month,
        day,
        totalPatients: syncedRecords.length,
        records: syncedRecords
      }, null, 2));

      console.log(`💾 [ORACLE DISK REGISTER]: Permanent register archive saved to ${jsonPath}`);
    } catch (diskErr) {
      console.warn('Oracle disk archive notice:', diskErr.message);
    }

    res.json({
      success: true,
      message: `OPD Register successfully synced & archived on Oracle VM for date ${targetDate}`,
      count: syncedRecords.length,
      records: syncedRecords
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a single OPD Register entry by ID
 */
exports.deleteRegisterEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clinicId = req.user?.clinicId || 1;
    const record = await OpdRegister.findOne({ where: { id, clinicId } });
    if (!record) return res.status(404).json({ error: 'OPD register entry not found' });
    await record.destroy();
    res.json({ message: 'OPD register entry deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear ALL OPD Register entries for the clinic (reset to 0)
 */
exports.clearAllRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const deleted = await OpdRegister.destroy({ where: { clinicId } });
    res.json({ message: `Cleared ${deleted} OPD register entries. Numbers will restart from 1 on next sync.`, deleted });
  } catch (err) {
    next(err);
  }
};
