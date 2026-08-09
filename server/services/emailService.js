const nodemailer = require('nodemailer');

// Reusable email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'shingare.pramod17@gmail.com',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
  }
});

async function sendOTPEmail(toEmail, otp) {
  try {
    const info = await transporter.sendMail({
      from: '"शिनगारे स्किन क्लिनिक" <shingare.pramod17@gmail.com>',
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
            This 6-digit verification code will expire in <strong>15 minutes</strong>.<br/>
            If you did not request this password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            – डॉ. प्रमोद शिनगारे | शिनगारे स्किन अँड कॉस्मेटिक क्लिनिक
          </p>
        </div>
      `
    });
    console.log(`📧 OTP Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.log(`📧 OTP Email queued for ${toEmail} (OTP: ${otp})`);
    return false;
  }
}

module.exports = {
  sendOTPEmail
};
