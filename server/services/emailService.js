const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || 'axiogen01@gmail.com';
const SMTP_PASS = (process.env.SMTP_PASS || process.env.EMAIL_PASS || 'spupfhapisnsvxnk').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

async function sendOTPEmail(toEmail, otp) {
  try {
    await transporter.sendMail({
      from: '"शिनगारे स्किन क्लिनिक" <axiogen01@gmail.com>',
      to: toEmail,
      subject: `🔐 ClinicOS OTP: ${otp}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
          <h2 style="color:#047857;text-align:center;margin-bottom:4px;">शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक</h2>
          <p style="text-align:center;color:#6b7280;margin-top:0;font-size:13px;">ClinicOS • Password Reset</p>
          <h3 style="text-align:center;color:#1f2937;margin-bottom:20px;">Your Verification Code</h3>
          <div style="background:#ecfdf5;border:2px dashed #047857;padding:20px;text-align:center;border-radius:10px;margin:0 0 20px;">
            <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#047857;">${otp}</span>
          </div>
          <p style="color:#4b5563;font-size:14px;text-align:center;line-height:1.6;">
            Enter this <strong>6-digit code</strong> in the ClinicOS app to reset your password.<br/>
            <span style="color:#ef4444;">Expires in 15 minutes.</span>
          </p>
          <p style="color:#4b5563;font-size:13px;text-align:center;">
            The same code has also been sent to your registered WhatsApp.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="font-size:11px;color:#9ca3af;text-align:center;">
            डॉ. प्रमोद शिनगारे | शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक<br/>
            If you did not request this, please ignore this email.
          </p>
        </div>
      `
    });
    console.log(`📧 OTP email sent to ${toEmail} via axiogen01@gmail.com (OTP: ${otp})`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed for ${toEmail}: ${err.message}`);
    return false;
  }
}

module.exports = { sendOTPEmail };
