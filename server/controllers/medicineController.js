const { Medicine } = require('../models');
const { Op } = require('sequelize');

exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll({
      order: [['name', 'ASC']],
      limit: 500
    });
    res.json(medicines);
  } catch (err) {
    next(err);
  }
};

exports.getMedicineCount = async (req, res, next) => {
  try {
    const count = await Medicine.count();
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.searchMedicines = async (req, res, next) => {
  try {
    const { q } = req.query;
    const likeOp = Op.iLike || Op.like;

    if (!q || !q.trim()) {
      const defaultMeds = await Medicine.findAll({
        order: [['name', 'ASC']],
        limit: 50
      });
      return res.json(defaultMeds);
    }

    const query = q.trim();

    // STRICT PREFIX ONLY: show medicines whose name starts with query
    // Includes common form prefixes so 'Tab. Amox', 'Cap. Amox' etc also match when user types 'Amox'
    const results = await Medicine.findAll({
      where: {
        [Op.or]: [
          { name: { [likeOp]: `${query}%` } },
          { name: { [likeOp]: `Tab. ${query}%` } },
          { name: { [likeOp]: `Cap. ${query}%` } },
          { name: { [likeOp]: `Syp. ${query}%` } },
          { name: { [likeOp]: `Cream ${query}%` } },
          { name: { [likeOp]: `Lotion ${query}%` } },
          { name: { [likeOp]: `Gel ${query}%` } },
          { name: { [likeOp]: `Ointment ${query}%` } },
          { name: { [likeOp]: `Soap ${query}%` } },
          { name: { [likeOp]: `Cap ${query}%` } },
          { name: { [likeOp]: `Tab ${query}%` } },
          { name: { [likeOp]: `Syp ${query}%` } },
          { brand: { [likeOp]: `${query}%` } }
        ]
      },
      order: [['name', 'ASC']],
      limit: 1000
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.createMedicine = async (req, res, next) => {
  try {
    const { productId, name, brand, strength, form, dosage, frequency, duration, category, stockQty, expiryDate, availability, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Medicine name required' });

    const id = `med_${Date.now()}`;
    const medicine = await Medicine.create({
      id,
      productId: productId || id,
      name,
      brand: brand || '',
      strength: strength || '',
      form: form || 'Tablet',
      dosage: dosage || '',
      frequency: frequency || '',
      duration: duration || '',
      category: category || 'General',
      stockQty: stockQty || 100,
      expiryDate: expiryDate || '',
      availability: availability !== undefined ? availability : true,
      notes: notes || ''
    });

    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
};

exports.bulkImportMedicines = async (req, res, next) => {
  try {
    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'Medicines array required' });
    }

    const prepared = medicines.map((m, idx) => ({
      id: m.id || `med_${Date.now()}_${idx}`,
      productId: m.productId || m.id || `PROD_${idx}`,
      name: m.name,
      brand: m.brand || '',
      strength: m.strength || '',
      form: m.form || 'Tablet',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      category: m.category || 'General',
      stockQty: m.stockQty !== undefined ? m.stockQty : 100,
      expiryDate: m.expiryDate || '',
      availability: m.availability !== undefined ? m.availability : true,
      notes: m.notes || ''
    }));

    await Medicine.bulkCreate(prepared, { ignoreDuplicates: true });
    res.json({ success: true, count: prepared.length, message: `Successfully imported ${prepared.length} medicines` });
  } catch (err) {
    next(err);
  }
};

exports.updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByPk(id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    await medicine.update(req.body);
    res.json(medicine);
  } catch (err) {
    next(err);
  }
};

exports.deleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByPk(id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    await medicine.destroy();
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (err) {
    next(err);
  }
};
