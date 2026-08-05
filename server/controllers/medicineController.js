const { Medicine } = require('../models');
const { Op } = require('sequelize');

exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll({ order: [['name', 'ASC']] });
    res.json(medicines);
  } catch (err) {
    next(err);
  }
};

exports.searchMedicines = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const medicines = await Medicine.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { brand: { [Op.like]: `%${q}%` } },
          { productId: { [Op.like]: `%${q}%` } },
          { category: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 100
    });
    res.json(medicines);
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
      productId: productId || `PRD${Date.now().toString().slice(-6)}`,
      name,
      brand: brand || '',
      strength: strength || '',
      form: form || 'Tablet',
      dosage: dosage || strength || '',
      frequency: frequency || '',
      duration: duration || '',
      category: category || 'General',
      stockQty: stockQty ? parseInt(stockQty, 10) : 0,
      expiryDate: expiryDate || '',
      availability: availability || 'In Stock',
      notes: notes || ''
    });
    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
};

exports.updateMedicine = async (req, res, next) => {
  try {
    const med = await Medicine.findByPk(req.params.id);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });

    await med.update(req.body);
    res.json(med);
  } catch (err) {
    next(err);
  }
};

exports.deleteMedicine = async (req, res, next) => {
  try {
    const med = await Medicine.findByPk(req.params.id);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });

    await med.destroy();
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    next(err);
  }
};

exports.bulkImportMedicines = async (req, res, next) => {
  try {
    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'No medicines array provided' });
    }

    const timestamp = Date.now();
    const itemsToCreate = medicines.map((med, index) => ({
      id: `med_${timestamp}_${index}`,
      productId: med.productId || med['Product ID'] || `PRD${String(index + 1).padStart(4, '0')}`,
      name: med.name || med['Medicine Name'] || 'Unknown Medicine',
      brand: med.brand || med['Brand'] || '',
      strength: med.strength || med['Strength'] || '',
      form: med.form || med['Form'] || 'Tablet',
      dosage: med.dosage || med.strength || med['Strength'] || '',
      frequency: med.frequency || med['Frequency'] || '',
      duration: med.duration || med['Duration'] || '',
      category: med.category || med['Category'] || 'General',
      stockQty: med.stockQty || med['Stock Qty'] ? parseInt(med.stockQty || med['Stock Qty'], 10) : 0,
      expiryDate: med.expiryDate || med['Expiry Date'] || '',
      availability: med.availability || med['Availability'] || 'In Stock',
      notes: med.notes || ''
    }));

    // Chunk array into batches of 50 items to strictly satisfy SQLite parameter limits
    const chunkSize = 50;
    let totalImported = 0;

    for (let i = 0; i < itemsToCreate.length; i += chunkSize) {
      const chunk = itemsToCreate.slice(i, i + chunkSize);
      const createdBatch = await Medicine.bulkCreate(chunk, { ignoreDuplicates: true });
      totalImported += createdBatch.length;
    }

    res.status(201).json({
      message: `Successfully imported ${totalImported} medicines into database!`,
      count: totalImported
    });
  } catch (err) {
    next(err);
  }
};
