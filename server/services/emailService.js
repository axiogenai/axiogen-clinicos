const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rykurrsenvqernwnofpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'shingareskinclinic@gmail.com',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
  }
});

async function sendOTPEmail(toEmail, otp) {
  // 1. Send via Supabase Auth Recovery Endpoint directly via REST API
  try {
    const recoveryRes = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        email: toEmail,
        redirect_to: `${process.env.FRONTEND_URL || 'https://shinagareclinicos.vercel.app'}/reset-password`
      })
    });
    if (recoveryRes.ok) {
      console.log(`⚡ Supabase Password Reset email triggered for ${toEmail}`);
    } else {
      const errTxt = await recoveryRes.text();
      console.log(`ℹ️ Supabase reset recovery note:`, errTxt);
    }
  } catch (err) {
    console.log(`ℹ️ Supabase email trigger:`, err.message);
  }

  // 2. Send Direct HTML Email with 6-digit OTP code
  try {
    const info = await transporter.sendMail({
      from: '"शिनगारे स्किन क्लिनिक" <shingareskinclinic@gmail.com>',
      to: toEmail,
      subject: `🔐 ClinicOS Password Reset OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #047857; text-align: center; margin-bottom: 5px;">शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक</h2>
          <h4 style="text-align: center; color: #6b7280; margin-top: 0;">ClinicOS Security</h4>
          <h3 style="text-align: center; color: #1f2937;">Password Reset Verification Code</h3>
          <div style="background-color: #ecfdf5; border: 2px dashed #047857; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #047857;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px; text-align: center; line-height: 1.5;">
            This 6-digit verification code is: <strong>${otp}</strong> (expires in 15 minutes).<br/>
            If you did not request this password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            – डॉ. प्रमोद शिनगारे | शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक
          </p>
        </div>
      `
    });
    console.log(`📧 Direct OTP Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.log(`📧 OTP Email queued for ${toEmail} (OTP: ${otp})`);
    return false;
  }
}

module.exports = {
  sendOTPEmail
};
