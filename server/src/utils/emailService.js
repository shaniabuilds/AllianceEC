const nodemailer = require('nodemailer');

/**
 * Creates Nodemailer Transporter using environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || user.includes('your_company_email') || !pass || pass.includes('your_app_password')) {
    // Return null to trigger graceful local dev log fallback
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send HTML Email OTP to user
 */
const sendEmailOTP = async (recipientEmail, otpCode, userName = 'Learner') => {
  const fromName = process.env.FROM_NAME || 'EduVerse India';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@eduverse.in';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #0F172A; color: #F8FAFC; border-radius: 16px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366F1; font-size: 28px; margin: 0; font-weight: 800;">${fromName}</h1>
        <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Two-Factor Authentication Security Center</p>
      </div>

      <div style="background-color: #1E293B; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
        <h2 style="font-size: 18px; margin-top: 0; color: #FFFFFF;">Hello ${userName},</h2>
        <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">
          Your 6-digit Email Verification OTP code for EduVerse Portal access is:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #34D399; background: rgba(52, 211, 153, 0.1); padding: 12px 28px; border-radius: 10px; border: 2px dashed #34D399; display: inline-block;">
            ${otpCode}
          </span>
        </div>

        <p style="color: #94A3B8; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone. If you did not request this OTP, please ignore this email.
        </p>
      </div>

      <div style="text-align: center; color: #64748B; font-size: 12px; border-top: 1px solid #1E293B; padding-top: 16px;">
        © 2026 ${fromName}. Enterprise Multi-Portal Platform.
      </div>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n[EMAIL OTP DEV LOG] To: ${recipientEmail} | OTP Code: ${otpCode}\n`);
    return { success: true, simulated: true, otpCode };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: `[EduVerse] Your 6-Digit Email OTP: ${otpCode}`,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log(`\n[EMAIL OTP LOG] (Local ISP Fallback Active) To: ${recipientEmail} | OTP Code: ${otpCode}\n`);
    // Return graceful fallback so local server does not throw 500 error if SMTP is blocked locally
    return { success: true, simulated: true, error: error.message, otpCode };
  }
};

module.exports = {
  sendEmailOTP
};
