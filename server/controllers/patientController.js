const { Patient, AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const clinicId = req.user?.clinicId || 1;
    const where = { clinicId };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { village: { [Op.like]: `%${search}%` } }
      ];
    }

    const patients = await Patient.findAll({ where, order: [['updated_at', 'DESC']] });
    res.json(patients);
  } catch (err) {
    next(err);
  }
};

exports.searchPatients = async (req, res, next) => {
  try {
    const { q } = req.query;
    const clinicId = req.user?.clinicId || 1;
    if (!q || !q.trim()) return res.json([]);

    const query = q.trim();
    const dialect = Patient.sequelize ? Patient.sequelize.getDialect() : 'sqlite';
    const likeOp = dialect === 'postgres' ? Op.iLike : Op.like;

    const patients = await Patient.findAll({
      where: {
        clinicId,
        [Op.or]: [
          { name: { [likeOp]: `${query}%` } },
          { name: { [likeOp]: `% ${query}%` } },
          { phone: { [likeOp]: `${query}%` } },
          { village: { [likeOp]: `${query}%` } }
        ]
      },
      order: [['name', 'ASC']],
      limit: 50
    });
    res.json(patients);
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const { id, name, age, gender, phone, village, pastHistory, allergies, notes, validity, casePaperNo } = req.body;

    const trimmedName = (name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ error: 'Patient full name is required (at least 2 characters)' });
    }
    if (!/^[a-zA-Z\s\.\-']+$/.test(trimmedName)) {
      return res.status(400).json({ error: 'Patient name should only contain letters, spaces, dots or hyphens' });
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone) {
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'Mobile number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' });
      }
    }

    // Duplicate Mobile Number Check
    if (cleanPhone) {
      const existing = await Patient.findOne({ where: { clinicId, phone: cleanPhone } });
      if (existing) {
        return res.status(409).json({
          error: `A patient with mobile number ${cleanPhone} is already registered (${existing.name}, Village: ${existing.village || 'N/A'}). Duplicate registration is blocked.`,
          existingPatient: existing
        });
      }
    }

    const parsedAge = age !== undefined && age !== null && age !== '' ? parseInt(age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120)) {
      return res.status(400).json({ error: 'Age must be a valid number between 0 and 120' });
    }

    const patientId = id || `PT${String(Date.now()).slice(-4)}`;

    // Default validity: strictly 2 months from today
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    const validityDate = validity || d.toISOString().slice(0, 10);

    const patient = await Patient.create({
      id: patientId,
      clinicId,
      name: name.trim(),
      age: parsedAge,
      gender: gender || 'M',
      phone: cleanPhone,
      village: village ? village.trim() : '',
      pastHistory: pastHistory || '',
      allergies: allergies || '',
      notes: notes || '',
      validity: validityDate,
      casePaperNo: (casePaperNo || '').trim() || null
    });

    await AuditLog.create({
      clinicId,
      userId: req.user?.id || 1,
      action: 'create_patient',
      entityType: 'patient',
      entityId: patient.id,
      details: { name: patient.name, casePaperNo: patient.casePaperNo }
    });

    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
};

exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await patient.update(req.body);
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cleanPhone = (id || '').replace(/\D/g, '');

    // Search by ID, phone, casePaperNo, or name
    let patient = await Patient.findByPk(id);
    if (!patient) {
      patient = await Patient.findOne({
        where: {
          [Op.or]: [
            { id },
            ...(cleanPhone && cleanPhone.length >= 4 ? [{ phone: cleanPhone }] : []),
            { name: id }
          ]
        }
      });
    }

    const targetPhone = patient ? patient.phone : (cleanPhone.length >= 10 ? cleanPhone : null);
    const targetId = patient ? patient.id : id;
    const targetName = patient ? patient.name : id;

    // 1. Delete patient record from PostgreSQL
    if (patient) {
      await patient.destroy();
    } else {
      await Patient.destroy({
        where: {
          [Op.or]: [
            { id: targetId },
            ...(targetPhone ? [{ phone: targetPhone }] : []),
            { name: targetName }
          ]
        }
      });
    }

    // 2. Cascade delete from Queue (today's active queue)
    const { Queue, OpdRegister, CasePaper } = require('../models');
    await Queue.destroy({
      where: {
        [Op.or]: [
          { patientId: targetId },
          ...(targetPhone ? [{ phone: targetPhone }] : []),
          { name: targetName }
        ]
      }
    });

    // 3. Cascade delete from OPD Register (daily, monthly, yearly registers)
    await OpdRegister.destroy({
      where: {
        [Op.or]: [
          { patientId: targetId },
          ...(targetPhone ? [{ phone: targetPhone }] : []),
          { patientName: targetName }
        ]
      }
    });

    // 4. Cascade delete from CasePapers
    await CasePaper.destroy({
      where: {
        [Op.or]: [
          { patientId: targetId },
          { patientName: targetName }
        ]
      }
    });

    // 5. Dual-Delete: Also purge from local SQLite on Oracle VM if present
    if (process.env.DATABASE_URL) {
      try {
        const path = require('path');
        const { Sequelize } = require('sequelize');
        const sqlitePath = path.resolve(__dirname, '../database.sqlite');
        const fs = require('fs');
        if (fs.existsSync(sqlitePath)) {
          const sqliteDb = new Sequelize({
            dialect: 'sqlite',
            storage: sqlitePath,
            logging: false,
          });
          await sqliteDb.query(
            `DELETE FROM patients WHERE id = :id OR phone = :phone OR name = :name`,
            { replacements: { id: targetId, phone: targetPhone || '', name: targetName } }
          );
          await sqliteDb.query(
            `DELETE FROM queues WHERE patient_id = :patientId OR phone = :phone OR name = :name`,
            { replacements: { patientId: targetId, phone: targetPhone || '', name: targetName } }
          );
          await sqliteDb.query(
            `DELETE FROM opd_registers WHERE patient_id = :patientId OR phone = :phone OR patient_name = :name`,
            { replacements: { patientId: targetId, phone: targetPhone || '', name: targetName } }
          );
          await sqliteDb.close();
        }
      } catch (sqliteErr) {
        console.warn('⚠️ SQLite dual-delete warning:', sqliteErr.message);
      }
    }

    res.json({
      message: `Patient ${targetName} permanently deleted from all database registers and queues.`,
      deletedId: targetId
    });
  } catch (err) {
    next(err);
  }
};

exports.renewPatientValidity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { casePaperNo, phone, months = 2 } = req.body || {};

    let patient = await Patient.findByPk(id);
    if (!patient) {
      const cleanPhone = (phone || id || '').replace(/\D/g, '');
      const searchCaseNo = casePaperNo || id;
      patient = await Patient.findOne({
        where: {
          [Op.or]: [
            ...(searchCaseNo ? [{ casePaperNo: searchCaseNo }] : []),
            ...(cleanPhone && cleanPhone.length >= 4 ? [{ phone: cleanPhone }] : []),
            { name: id }
          ]
        }
      });
    }
    if (!patient) return res.status(404).json({ error: 'Patient record not found to renew validity.' });

    // Calculate base date: if patient has existing validity that is in the future, extend from that date.
    // If expired or missing, extend strictly from today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let baseDate = new Date();
    if (patient.validity) {
      const currentExpiry = new Date(patient.validity);
      if (!isNaN(currentExpiry.getTime()) && currentExpiry.getTime() >= today.getTime()) {
        baseDate = new Date(currentExpiry);
      }
    }

    baseDate.setMonth(baseDate.getMonth() + Number(months || 2));
    const newValidity = baseDate.toISOString().slice(0, 10);

    await patient.update({ validity: newValidity });

    await AuditLog.create({
      clinicId: req.user?.clinicId || 1,
      userId: req.user?.id || 1,
      action: 'renew_patient',
      entityType: 'patient',
      entityId: patient.id,
      details: { newValidity, months: Number(months || 2), casePaperNo: patient.casePaperNo, phone: patient.phone }
    });

    res.json({ message: `Patient validity successfully extended to ${newValidity} (+${months} months)`, validity: newValidity, patient });
  } catch (err) {
    next(err);
  }
};
