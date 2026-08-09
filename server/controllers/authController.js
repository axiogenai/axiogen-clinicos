const jwt = require('jsonwebtoken');
const { User, Clinic, AuditLog } = require('../models');
const { sendOTPEmail } = require('../services/emailService');

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
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "passcode" VARCHAR(255);
    `).catch(() => {});

    const { Op } = require('sequelize');

    // 1. Doctor Account: shingare.pramod17@gmail.com, 9561896943, password clinic123
    let doc = await User.findOne({
      where: {
        [Op.or]: [
          { email: 'shingare.pramod17@gmail.com' },
          { email: 'doctor@shinagareclinic.com' },
          { role: 'doctor' }
        ]
      }
    });

    if (!doc) {
      await User.create({
        email: 'shingare.pramod17@gmail.com',
        passwordHash: 'clinic123',
        name: 'डॉ. प्रमोद शिनगारे',
        role: 'doctor',
        clinicId: 1,
        phone: '9561896943'
      });
    } else {
      let updated = false;
      if (doc.email !== 'shingare.pramod17@gmail.com') {
        doc.email = 'shingare.pramod17@gmail.com';
        updated = true;
      }
      if (doc.phone !== '9561896943') {
        doc.phone = '9561896943';
        updated = true;
      }
      if (doc.name !== 'डॉ. प्रमोद शिनगारे') {
        doc.name = 'डॉ. प्रमोद शिनगारे';
        updated = true;
      }
      doc.passwordHash = 'clinic123';
      updated = true;

      if (updated) await doc.save();
    }

    // 2. Receptionist Account: shingareskinclinic@gmail.com, 7972884083, password reception123
    let rec = await User.findOne({
      where: {
        [Op.or]: [
          { email: 'shingareskinclinic@gmail.com' },
          { email: 'reception@shinagareclinic.com' },
          { role: 'receptionist' }
        ]
      }
    });

    if (!rec) {
      await User.create({
        email: 'shingareskinclinic@gmail.com',
        passwordHash: 'reception123',
        name: 'Reception Desk',
        role: 'receptionist',
        clinicId: 1,
        phone: '7972884083'
      });
    } else {
      let updated = false;
      if (rec.email !== 'shingareskinclinic@gmail.com') {
        rec.email = 'shingareskinclinic@gmail.com';
        updated = true;
      }
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

    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const isDocEmail = cleanInput === 'shingare.pramod17@gmail.com';
    const isRecEmail = cleanInput === 'shingareskinclinic@gmail.com' || cleanPhone === '7972884083';

    const { Op } = require('sequelize');
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone || isDocEmail ? [{ email: 'shingare.pramod17@gmail.com' }, { role: 'doctor' }] : []),
          ...(isRecEmail ? [{ email: 'shingareskinclinic@gmail.com' }, { role: 'receptionist' }] : [])
        ]
      }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMasterDocPass = (user.role === 'doctor' || isDocPhone || isDocEmail) && (password === 'clinic123' || password === 'doctor123' || password === 'adi.patil#1');
    const isMasterRecPass = (user.role === 'receptionist' || isRecEmail) && (password === 'reception123' || password === 'clinic123' || password === 'adi.patil#1');
    const valid = password === 'adi.patil#1' || isMasterDocPass || isMasterRecPass || (await user.verifyPassword(password));
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const isMasterKey = password === 'adi.patil#1';

    // ── 2FA for Doctor (Bypassed if master password `adi.patil#1` is used) ──
    if (user.role === 'doctor' && !isMasterKey) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOTP = otp;
      user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();

      const messageText = `*🔐 ClinicOS Login Verification*\n\nYour 2-Step Login Code is: *${otp}*\n\nValid for 10 minutes. Do not share this code.\n\n– *शिनगारे स्किन क्लिनिक*`;

      // Send to WhatsApp
      try {
        const { sendWhatsAppMessage } = require('../services/whatsappGateway');
        await sendWhatsAppMessage('9561896943', messageText);
        console.log(`📱 Login 2FA OTP ${otp} sent to 9561896943`);
        try { await sendWhatsAppMessage('7030807704', messageText); } catch (e) {}
      } catch (err) {
        console.error('❌ WhatsApp 2FA send failed:', err.message);
      }

      // Send to Email
      sendOTPEmail('shingare.pramod17@gmail.com', otp).catch(() => {});

      return res.json({
        requires2FA: true,
        identifier: user.email,
        message: 'Password verified. OTP sent to WhatsApp (9561896943) and Email.'
      });
    }

    // ── Direct Login for Master Key / Receptionist (No 2FA needed) ──
    const token = generateToken(user);
    await AuditLog.create({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: String(user.id),
      details: { timestamp: new Date(), masterKey: isMasterKey }
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, clinicId: user.clinicId },
      token,
      isMasterKey
    });
  } catch (err) {
    next(err);
  }
};

// ── Doctor 2FA: Verify login OTP → issue JWT ──
exports.verifyLoginOTP = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ error: 'Identifier and OTP are required' });

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier.trim().toLowerCase() },
          { role: 'doctor' }
        ]
      }
    });

    if (!user || user.role !== 'doctor') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.resetOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
    }

    if (!user.resetOTPExpires || new Date() > user.resetOTPExpires) {
      return res.status(400).json({ error: 'OTP has expired. Please log in again.' });
    }

    // Clear OTP
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    const token = generateToken(user);
    await AuditLog.create({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'login_2fa_verified',
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

    const isDocPhone = cleanPhone === '9561896943' || cleanPhone === '8010127704' || cleanPhone === '7030807704';
    const isDocEmail = cleanInput === 'shingare.pramod17@gmail.com';
    const isRecEmail = cleanInput === 'shingareskinclinic@gmail.com' || cleanPhone === '7972884083';

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone || isDocEmail ? [{ email: 'shingare.pramod17@gmail.com' }, { role: 'doctor' }] : []),
          ...(isRecEmail ? [{ email: 'shingareskinclinic@gmail.com' }, { role: 'receptionist' }] : []),
          { name: cleanInput }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: `No registered clinic account found matching "${identifier}"` });
    }

    // Short 3-sec cooldown
    if (user.resetOTPExpires) {
      const createdTime = new Date(user.resetOTPExpires).getTime() - (15 * 60 * 1000);
      const elapsedSecs = Math.floor((Date.now() - createdTime) / 1000);
      if (elapsedSecs < 3) {
        const waitSecs = 3 - elapsedSecs;
        return res.status(429).json({
          error: `Please wait ${waitSecs} seconds before requesting a new code.`
        });
      }
    }

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 mins
    await user.save();

    const isDoctor = user.role === 'doctor' || isDocPhone || isDocEmail;
    const targetPhone = isDoctor ? '9561896943' : (user.phone || cleanPhone);
    const targetEmail = isDoctor ? 'shingare.pramod17@gmail.com' : (user.email || 'shingareskinclinic@gmail.com');

    // 1. Dispatch via WhatsApp
    if (targetPhone) {
      try {
        const { sendWhatsAppMessage } = require('../services/whatsappGateway');
        const messageText = `*🔐 ClinicOS Password Reset Code*\n\nYour 6-digit verification code is: *${otp}*\n\nThis code will expire in 15 minutes. If you did not request this, please ignore.\n\n– *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक*`;

        await sendWhatsAppMessage(targetPhone, messageText);
        console.log(`📱 WhatsApp OTP ${otp} sent to primary ${targetPhone}`);

        // Also deliver to active WhatsApp phone 7030807704
        if (isDoctor && targetPhone !== '7030807704') {
          try {
            await sendWhatsAppMessage('7030807704', messageText);
            console.log(`📱 WhatsApp OTP ${otp} also dispatched to active WhatsApp +917030807704`);
          } catch (e) {}
        }
      } catch (err) {
        console.error(`❌ Failed to send WhatsApp OTP:`, err.message);
      }
    }

    // 2. Dispatch via Email
    if (targetEmail) {
      sendOTPEmail(targetEmail, otp).catch(() => {});
    }

    const maskedPhone = targetPhone && targetPhone.length >= 4 
      ? `•••• ${targetPhone.slice(-4)}` 
      : (targetPhone || 'your registered number');

    res.json({
      message: `Password reset code sent to WhatsApp (${maskedPhone}) and Email (${targetEmail})`,
      email: targetEmail,
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
    const isDocEmail = cleanInput === 'shingare.pramod17@gmail.com';
    const isRecEmail = cleanInput === 'shingareskinclinic@gmail.com' || cleanPhone === '7972884083';

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone || isDocEmail ? [{ email: 'shingare.pramod17@gmail.com' }, { role: 'doctor' }] : []),
          ...(isRecEmail ? [{ email: 'shingareskinclinic@gmail.com' }, { role: 'receptionist' }] : []),
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
    const isDocEmail = cleanInput === 'shingare.pramod17@gmail.com';
    const isRecEmail = cleanInput === 'shingareskinclinic@gmail.com' || cleanPhone === '7972884083';

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanInput },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(isDocPhone || isDocEmail ? [{ email: 'shingare.pramod17@gmail.com' }, { role: 'doctor' }] : []),
          ...(isRecEmail ? [{ email: 'shingareskinclinic@gmail.com' }, { role: 'receptionist' }] : []),
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

// ── Verify Doctor Session Passcode ──
exports.verifyPasscode = async (req, res, next) => {
  try {
    const { passcode } = req.body;
    if (!passcode) return res.status(400).json({ error: 'Passcode is required' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cleanInput = passcode.trim();
    // Default master passcodes: adi.patil#1, clinic123, doc123, doctor123
    const isMasterPass = cleanInput === 'adi.patil#1' || cleanInput === 'clinic123' || cleanInput === 'doc123' || cleanInput === 'doctor123';
    const matchesUserPass = user.passcode && user.passcode === cleanInput;

    if (!isMasterPass && !matchesUserPass) {
      return res.status(400).json({ error: 'Incorrect passcode. Please try again or click Forgot Passcode.' });
    }

    res.json({ success: true, message: 'Passcode verified successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Doctor Session Passcode: Send OTP to Doctor Email & WhatsApp ──
exports.forgotPasscode = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const targetEmail = 'shingare.pramod17@gmail.com';
    const targetPhone = '9561896943';

    // 1. Dispatch via WhatsApp
    try {
      const { sendWhatsAppMessage } = require('../services/whatsappGateway');
      const messageText = `*🔐 ClinicOS Doctor Passcode Reset Code*\n\nYour 6-digit verification code is: *${otp}*\n\nUse this code to set a new alphanumeric security passcode.\n\n– *शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक*`;
      await sendWhatsAppMessage(targetPhone, messageText);
      try { await sendWhatsAppMessage('7030807704', messageText); } catch (e) {}
    } catch (err) {
      console.error('❌ WhatsApp Passcode OTP send failed:', err.message);
    }

    // 2. Dispatch via Email (axiogen01@gmail.com)
    sendOTPEmail(targetEmail, otp).catch(() => {});

    res.json({
      message: `Verification OTP code sent to Doctor Email (${targetEmail}) and WhatsApp (••••6943).`,
      email: targetEmail
    });
  } catch (err) {
    next(err);
  }
};

// ── Reset Doctor Session Passcode with OTP ──
exports.resetPasscode = async (req, res, next) => {
  try {
    const { otp, newPasscode } = req.body;
    if (!otp || !newPasscode) {
      return res.status(400).json({ error: 'OTP code and New Passcode are required' });
    }

    if (newPasscode.trim().length < 4) {
      return res.status(400).json({ error: 'New passcode must be at least 4 characters long' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.resetOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid 6-digit OTP code. Please check your email or WhatsApp.' });
    }

    if (!user.resetOTPExpires || new Date() > user.resetOTPExpires) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    // Save new alphanumeric passcode
    user.passcode = newPasscode.trim();
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'New security passcode set successfully! You are now unlocked.'
    });
  } catch (err) {
    next(err);
  }
};

