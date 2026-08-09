const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rykurrsenvqernwnofpa.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a3VycnNlbnZxZXJud25vZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDMxMzksImV4cCI6MjEwMTUxOTEzOX0.fs5xcELvz0g9GojZRbSnSmfiZaFMHZLWfeD5yaIQhDM';

/**
 * Send OTP email via Supabase's built-in email service (no SMTP config needed).
 * Uses /auth/v1/otp endpoint — Supabase sends the email directly from their servers.
 * 
 * NOTE: Supabase generates its OWN 6-digit OTP for the email.
 * Our custom OTP (from WhatsApp) is a different code.
 * verifyOTP supports both codes.
 */
async function sendOTPEmail(toEmail, otp) {
  // ── Strategy 1: Supabase Magic OTP (primary — no SMTP password needed)
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: toEmail,
        create_user: true,
        options: {
          data: { clinic: 'Shingare Skin Clinic', otp_hint: otp }
        }
      })
    });

    if (res.ok || res.status === 422) {
      // 422 = user already exists (still triggers email send)
      console.log(`⚡ Supabase OTP email sent to ${toEmail} via Supabase Auth`);
      return true;
    } else {
      const errText = await res.text();
      console.log(`ℹ️ Supabase OTP attempt: ${res.status} — ${errText}`);
    }
  } catch (err) {
    console.log(`ℹ️ Supabase OTP fetch error: ${err.message}`);
  }

  // ── Strategy 2: Supabase Recovery Endpoint (fallback)
  try {
    const recoveryRes = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: toEmail,
        redirect_to: `${process.env.FRONTEND_URL || 'https://shinagareclinicos.vercel.app'}/reset-password`
      })
    });
    if (recoveryRes.ok) {
      console.log(`⚡ Supabase Password Reset email triggered for ${toEmail}`);
      return true;
    }
  } catch (err) {
    console.log(`ℹ️ Supabase recovery fallback: ${err.message}`);
  }

  // ── Strategy 3: Nodemailer (if SMTP_PASS is available)
  if (process.env.SMTP_PASS || process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'shingareskinclinic@gmail.com',
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
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
              This 6-digit verification code expires in <strong>15 minutes</strong>.<br/>
              If you did not request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              – डॉ. प्रमोद शिनगारे | शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक
            </p>
          </div>
        `
      });
      console.log(`📧 Direct OTP Email dispatched to ${toEmail} via Nodemailer`);
      return true;
    } catch (err) {
      console.log(`📧 Nodemailer failed for ${toEmail}: ${err.message}`);
    }
  }

  console.log(`⚠️ No email delivery method succeeded for ${toEmail} (OTP: ${otp})`);
  return false;
}

module.exports = { sendOTPEmail };
