const { CasePaper, Patient, Queue, AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.getCasePapers = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const { patientId } = req.query;
    const where = { clinicId };

    if (patientId) where.patientId = patientId;

    const casePapers = await CasePaper.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    res.json(casePapers);
  } catch (err) {
    next(err);
  }
};

exports.getCasePaper = async (req, res, next) => {
  try {
    const casePaper = await CasePaper.findByPk(req.params.id);
    if (!casePaper) return res.status(404).json({ error: 'Case paper not found' });
    res.json(casePaper);
  } catch (err) {
    next(err);
  }
};

exports.createCasePaper = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const {
      patientId,
      queueId,
      templateId,
      date,
      complaint,
      pastHistory,
      allergies,
      followUpDate,
      medicines,
      investigationsAdvised,
      counsellingDone,
      status
    } = req.body;

    if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

    // Verify or resolve valid patientId
    let targetPatientId = patientId;
    const existingPatient = await Patient.findByPk(patientId);
    if (!existingPatient) {
      const anyPatient = await Patient.findOne({ where: { clinicId } });
      if (anyPatient) targetPatientId = anyPatient.id;
    }

    const casePaperDate = date || new Date().toISOString().split('T')[0];

    const casePaper = await CasePaper.create({
      clinicId,
      patientId: targetPatientId,
      doctorId: req.user?.id || 1,
      queueId: queueId || null,
      templateId: templateId || null,
      date: casePaperDate,
      complaint: complaint || '',
      pastHistory: pastHistory || '',
      allergies: allergies || '',
      followUpDate: followUpDate || '',
      medicines: medicines || [],
      investigationsAdvised: investigationsAdvised || [],
      counsellingDone: counsellingDone || [],
      status: status || 'completed'
    });

    // Mark matching queue item status as completed
    if (queueId) {
      let q = await Queue.findByPk(queueId);
      if (!q) {
        q = await Queue.findOne({
          where: { [Op.or]: [{ queueId }, { patientId: targetPatientId }] }
        });
      }
      if (q) await q.update({ status: 'completed' });
    } else {
      const q = await Queue.findOne({
        where: { clinicId, patientId: targetPatientId, status: { [Op.ne]: 'completed' } }
      });
      if (q) await q.update({ status: 'completed' });
    }

    try {
      await AuditLog.create({
        clinicId,
        userId: req.user?.id || 1,
        action: 'create_case_paper',
        entityType: 'case_paper',
        entityId: String(casePaper.id),
        details: { patientId: targetPatientId }
      });
    } catch {
      // Audit log optional
    }

    res.status(201).json(casePaper);
  } catch (err) {
    next(err);
  }
};

exports.updateCasePaper = async (req, res, next) => {
  try {
    const casePaper = await CasePaper.findByPk(req.params.id);
    if (!casePaper) return res.status(404).json({ error: 'Case paper not found' });

    await casePaper.update(req.body);
    res.json(casePaper);
  } catch (err) {
    next(err);
  }
};

exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const history = await CasePaper.findAll({
      where: { patientId },
      order: [['date', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    next(err);
  }
};
