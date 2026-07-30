const { Queue, Patient, AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.getQueue = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const queue = await Queue.findAll({
      where: { clinicId },
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

    if (!item) {
      const clinicId = req.user?.clinicId || 1;
      item = await Queue.findOne({
        where: { clinicId, status: { [Op.ne]: 'completed' } },
        order: [['created_at', 'ASC']]
      });
    }

    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    await item.update({ status });
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
    const all = await Queue.findAll({ where: { clinicId } });
    
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
