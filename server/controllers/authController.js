const jwt = require('jsonwebtoken');
const { User, Clinic, AuditLog } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, clinicId: user.clinicId, name: user.name },
    process.env.JWT_SECRET || 'clinicos_secret_key',
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, clinicId = 1, role = 'receptionist', phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User email already exists' });

    const user = await User.create({
      email,
      passwordHash: password,
      name,
      clinicId,
      role,
      phone
    });

    const token = generateToken(user);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, clinicId: user.clinicId },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.verifyPassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    
    await AuditLog.create({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: String(user.id),
      details: { timestamp: new Date() }
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, clinicId: user.clinicId },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Clinic }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
