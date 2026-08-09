const jwt = require('jsonwebtoken');
const { User, Clinic, AuditLog } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, clinicId: user.clinicId, name: user.name },
    process.env.JWT_SECRET || 'clinicos_secret_key',
    { expiresIn: '3650d' } // 10 years (effectively logged in forever)
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

async function ensureDefaultAccounts() {
  try {
    const sequelize = require('../config/database');
    await sequelize.query(`
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "reset_otp" VARCHAR(255);
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "reset_otp_expires" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "reset_o_t_p" VARCHAR(255);
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "reset_o_t_p_expires" TIMESTAMP WITH TIME ZONE;
    `).catch(() => {});

    const doc = await User.findOne({ where: { email: 'doctor@shinagareclinic.com' } });
    if (!doc) {
      await User.create({
        email: 'doctor@shinagareclinic.com',
        passwordHash: 'doctor123',
        name: 'डॉ. प्रमोद शिनगारे',
        role: 'doctor',
        clinicId: 1,
        phone: '9561896943'
      });
    } else if (doc.phone !== '9561896943') {
      doc.phone = '9561896943';
      await doc.save();
    }

    const rec = await User.findOne({ where: { email: 'reception@shinagareclinic.com' } });
    if (!rec) {
      await User.create({
        email: 'reception@shinagareclinic.com',
        passwordHash: 'reception123',
        name: 'Reception Desk',
        role: 'receptionist',
        clinicId: 1,
        phone: '7972884083'
      });
    } else {
      let updated = false;
      if (rec.phone !== '7972884083') {
        rec.phone = '7972884083';
        updated = true;
      }
      if (rec.name !== 'Reception Desk') {
        rec.name = 'Reception Desk';
        updated = true;
      }
      if (updated) await rec.save();
    }
  } catch {}
}

exports.login = async (req, res, next) => {
  try {
    await ensureDefaultAccounts();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Mobile number/Email and password are required' });

    const cleanInput = email.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    // Doctor accounts: primary 9561896943, with secret backup 8010127704 and 7030807704
    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const { Op } = require('sequelize');
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone ? [{ email: 'doctor@shinagareclinic.com' }] : [])
        ]
      }
    });
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
      attributes: { exclude: ['passwordHash', 'resetOTP', 'resetOTPExpires'] },
      include: [{ model: Clinic }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password: Generate 6-Digit OTP Code ──
exports.forgotPassword = async (req, res, next) => {
  try {
    await ensureDefaultAccounts();
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or Mobile number is required' });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    // Doctor accounts: primary 9561896943, with secret backup 8010127704 and 7030807704
    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone ? [{ email: 'doctor@shinagareclinic.com' }] : []),
          { name: cleanInput }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: `No registered clinic account found matching "${identifier}"` });
    }

    // Check if an OTP was requested less than 60 seconds ago (1-min cooldown)
    if (user.resetOTPExpires) {
      const createdTime = new Date(user.resetOTPExpires).getTime() - (15 * 60 * 1000);
      const elapsedSecs = Math.floor((Date.now() - createdTime) / 1000);
      if (elapsedSecs < 60) {
        const waitSecs = 60 - elapsedSecs;
        return res.status(429).json({
          error: `An OTP was recently sent to your WhatsApp. Please wait ${waitSecs} seconds before requesting a new code.`
        });
      }
    }

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 mins
    await user.save();

    // Dispatch WhatsApp notification using live WhatsApp Gateway
    const targetPhone = user.phone || (isDocPhone ? '9561896943' : null);
    if (targetPhone) {
      try {
        const { sendWhatsAppMessage } = require('../services/whatsappGateway');
        const messageText = `*🔐 ClinicOS Password Reset Code*\n\nYour 6-digit verification code is: *${otp}*\n\nThis code will expire in 15 minutes. If you did not request this, please ignore.\n\n– *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक*`;

        await sendWhatsAppMessage(targetPhone, messageText);
        console.log(`📱 WhatsApp OTP ${otp} dispatched to ${targetPhone}`);

        // If Doctor account, also dispatch to backup Doctor numbers to guarantee delivery!
        if (user.role === 'doctor' || isDocPhone) {
          try {
            await sendWhatsAppMessage('9561896943', messageText);
          } catch (e) {}
          try {
            await sendWhatsAppMessage('8010127704', messageText);
          } catch (e) {}
          try {
            await sendWhatsAppMessage('7030807704', messageText);
          } catch (e) {}
        }
      } catch (err) {
        console.error('❌ Failed to send WhatsApp OTP:', err.message);
      }
    }

    const maskedPhone = targetPhone && targetPhone.length >= 4 
      ? `•••• ${targetPhone.slice(-4)}` 
      : (targetPhone || 'your registered number');

    res.json({
      message: `Password reset verification code dispatched to WhatsApp (${maskedPhone})`,
      email: user.email,
      phone: targetPhone
    });
  } catch (err) {
    next(err);
  }
};

// ── Verify Reset OTP ──
exports.verifyOTP = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Email/phone and 6-digit OTP code are required' });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone ? [{ email: 'doctor@shinagareclinic.com' }] : []),
          { name: cleanInput }
        ]
      }
    });

    if (!user || user.resetOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid 6-digit OTP code' });
    }

    if (!user.resetOTPExpires || new Date() > user.resetOTPExpires) {
      return res.status(400).json({ error: 'OTP verification code has expired (15 min limit). Please request a new code.' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password With New Password ──
exports.resetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields (Email/Phone, OTP, New Password) are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone ? [{ email: 'doctor@shinagareclinic.com' }] : []),
          { name: cleanInput }
        ]
      }
    });

    if (!user || user.resetOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid 6-digit OTP code' });
    }

    if (!user.resetOTPExpires || new Date() > user.resetOTPExpires) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
    }

    // Update password (bcrypt beforeUpdate hook automatically hashes)
    user.passwordHash = newPassword;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    await AuditLog.create({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'password_reset',
      entityType: 'user',
      entityId: String(user.id),
      details: { timestamp: new Date() }
    });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
};
