const { Clinic, AuditLog } = require('../models');

exports.getSettings = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    let clinic = await Clinic.findByPk(clinicId);

    if (!clinic) {
      // Default initial clinic details
      clinic = await Clinic.create({
        id: 1,
        nameEn: 'स्किन & कॉस्मेटीक क्लिनिक',
        nameHi: 'शिनगारे',
        address: 'एस.टी.स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. 6, पेठ वडगांव',
        phone: '7249727104 / 9657727104',
        openingHours: 'सकाळी १० ते सायं. ६ पर्यंत',
        closedDay: 'दर रविवारी बंद राहिल.',
        headerBgColor: '#89b740'
      });
    }

    res.json(clinic);
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || 1;
    let clinic = await Clinic.findByPk(clinicId);

    if (!clinic) {
      clinic = await Clinic.create({ id: clinicId, ...req.body });
    } else {
      await clinic.update(req.body);
    }

    await AuditLog.create({
      clinicId,
      userId: req.user?.id || 1,
      action: 'update_clinic_settings',
      entityType: 'clinic',
      entityId: String(clinicId),
      details: req.body
    });

    res.json(clinic);
  } catch (err) {
    next(err);
  }
};

const { translateWithGroq } = require('../services/groqTranslationService');
const { parseSentenceWithGroq } = require('../services/groqSentenceParserService');

exports.translateText = async (req, res, next) => {
  try {
    const { text, targetLang } = req.body;
    const translated = await translateWithGroq(text, targetLang);
    res.json({ translatedText: translated });
  } catch (err) {
    next(err);
  }
};

exports.parseSentence = async (req, res, next) => {
  try {
    const { sentence } = req.body;
    const parsed = await parseSentenceWithGroq(sentence);
    res.json({ parsed });
  } catch (err) {
    next(err);
  }
};
