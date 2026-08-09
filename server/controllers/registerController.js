const { OpdRegister, Queue, Patient, CasePaper } = require('../models');
const { Op } = require('sequelize');

/**
 * Get Day-Wise OPD Register
 */
exports.getDailyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const date = req.query.date || new Date().toISOString().split('T')[0];

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
 */
exports.getMonthlyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

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
 * Get Year-Wise OPD Register
 */
exports.getYearlyRegister = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);

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
    const targetDate = req.body?.date || req.query?.date || new Date().toISOString().split('T')[0];

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

    res.json({
      success: true,
      message: `OPD Register successfully synced for date ${targetDate}`,
      count: syncedRecords.length,
      records: syncedRecords
    });
  } catch (err) {
    next(err);
  }
};
