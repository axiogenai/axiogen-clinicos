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
    const { id, name, age, gender, phone, village, pastHistory, allergies, notes, validity } = req.body;

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
      validity: validityDate
    });

    await AuditLog.create({
      clinicId,
      userId: req.user?.id || 1,
      action: 'create_patient',
      entityType: 'patient',
      entityId: patient.id,
      details: { name: patient.name }
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
    const clinicId = req.user?.clinicId || 1;

    let patient = await Patient.findByPk(id);
    if (!patient) {
      const cleanPhone = id.replace(/\D/g, '');
      patient = await Patient.findOne({
        where: {
          clinicId,
          [Op.or]: [
            { id },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            { name: id }
          ]
        }
      });
    }

    if (!patient) return res.status(404).json({ error: 'Patient record not found in database' });

    const targetPhone = patient.phone;
    const targetId = patient.id;

    // Delete patient record from primary DB (Supabase/PostgreSQL)
    await patient.destroy();

    // Also clean up any lingering Queue entries with matching patientId or phone
    const { Queue } = require('../models');
    await Queue.destroy({
      where: {
        clinicId,
        [Op.or]: [
          { patientId: targetId },
          ...(targetPhone ? [{ phone: targetPhone }] : [])
        ]
      }
    });

    // ── Dual-Delete: Also purge from local SQLite on Oracle VM ──
    // When DATABASE_URL is set (Supabase), the local SQLite file is not the
    // active database but may still hold stale records from before migration.
    // We delete from it in the background so patients don't resurface if the
    // server ever falls back to SQLite mode.
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
          // Delete matching patients from SQLite
          await sqliteDb.query(
            `DELETE FROM patients WHERE id = :id OR phone = :phone OR name = :name`,
            { replacements: { id: targetId, phone: targetPhone || '', name: patient.name } }
          );
          // Delete matching queue entries from SQLite
          await sqliteDb.query(
            `DELETE FROM queues WHERE patient_id = :patientId OR phone = :phone`,
            { replacements: { patientId: targetId, phone: targetPhone || '' } }
          );
          await sqliteDb.close();
        }
      } catch (sqliteErr) {
        // Non-critical — SQLite cleanup failure should never block the API response
        console.warn('⚠️ SQLite dual-delete warning (non-critical):', sqliteErr.message);
      }
    }

    res.json({ message: 'Patient and all associated queue records permanently deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.renewPatientValidity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Always strictly 2 months from today on renewal
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    const newValidity = d.toISOString().slice(0, 10);

    await patient.update({ validity: newValidity });

    await AuditLog.create({
      clinicId: req.user?.clinicId || 1,
      userId: req.user?.id || 1,
      action: 'renew_patient',
      entityType: 'patient',
      entityId: patient.id,
      details: { newValidity, months: 2 }
    });

    res.json({ message: 'Patient validity renewed for 2 months successfully', validity: newValidity, patient });
  } catch (err) {
    next(err);
  }
};
