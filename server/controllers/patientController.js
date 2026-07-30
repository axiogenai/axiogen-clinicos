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
    if (!q) return res.json([]);

    const patients = await Patient.findAll({
      where: {
        clinicId,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
    res.json(patients);
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const { id, name, age, gender, phone, village, pastHistory, allergies, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Patient name is required' });

    const patientId = id || `PT${String(Date.now()).slice(-4)}`;

    const patient = await Patient.create({
      id: patientId,
      clinicId,
      name,
      age: age ? parseInt(age, 10) : null,
      gender: gender || 'M',
      phone: phone || '',
      village: village || '',
      pastHistory: pastHistory || '',
      allergies: allergies || '',
      notes: notes || ''
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
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await patient.destroy();
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    next(err);
  }
};
