const { Template, AuditLog } = require('../models');

exports.getTemplates = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const templates = await Template.findAll({
      where: { clinicId },
      order: [['updated_at', 'DESC']]
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

exports.getTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    const { name, category, description, isFavorite, medicines, investigationsAdvised, counsellingDone } = req.body;

    if (!name) return res.status(400).json({ error: 'Template name is required' });

    const id = `tpl_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const template = await Template.create({
      id,
      clinicId,
      doctorId: req.user?.id || 1,
      name,
      category: category || 'General',
      description: description || '',
      isFavorite: Boolean(isFavorite),
      createdDate: today,
      updatedDate: today,
      medicines: medicines || [],
      investigationsAdvised: investigationsAdvised || [],
      counsellingDone: counsellingDone || []
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const today = new Date().toISOString().split('T')[0];
    await template.update({ ...req.body, updatedDate: today });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

exports.deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

exports.duplicateTemplate = async (req, res, next) => {
  try {
    const original = await Template.findByPk(req.params.id);
    if (!original) return res.status(404).json({ error: 'Original template not found' });

    const today = new Date().toISOString().split('T')[0];
    const newId = `tpl_${Date.now()}`;

    const duplicate = await Template.create({
      id: newId,
      clinicId: original.clinicId,
      doctorId: req.user?.id || original.doctorId,
      name: `Copy of ${original.name}`,
      category: original.category,
      description: original.description,
      isFavorite: false,
      createdDate: today,
      updatedDate: today,
      medicines: original.medicines,
      investigationsAdvised: original.investigationsAdvised,
      counsellingDone: original.counsellingDone
    });

    res.status(201).json(duplicate);
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    await template.update({ isFavorite: !template.isFavorite });
    res.json(template);
  } catch (err) {
    next(err);
  }
};
