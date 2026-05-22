const nodemailer = require('nodemailer');

/**
 * Generates a premium HTML email template for WanderViet AI OTP
 */
const getOtpTemplate = (otp, purposeName) => {
  const isForgot = purposeName === 'forgot_password';
  const title = isForgot ? 'Đặt Lại Mật Khẩu' : 'Xác Thực Tài Khoản';
  const description = isForgot 
    ? 'Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản WanderViet AI của mình.' 
    : 'Chào mừng bạn đến với WanderViet AI! Vui lòng sử dụng mã OTP dưới đây để hoàn tất đăng ký tài khoản.';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WanderViet AI OTP Verification</title>
      <style>
        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #040914;
          color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #0b1426;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .logo {
          text-align: center;
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 30px;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .logo-symbol {
          background: linear-gradient(135deg, #0055ff, #00f0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo-text {
          font-weight: 800;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }
        .otp-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 38px;
          font-weight: 800;
          color: #00f0ff;
          letter-spacing: 8px;
          margin: 0;
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
        }
        .expiry-note {
          font-size: 13px;
          color: #64748b;
          margin-top: 12px;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 24px;
          text-align: center;
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }
        .footer a {
          color: #00f0ff;
          text-decoration: none;
        }
        .warning-text {
          color: #f43f5e;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <span class="logo-symbol">◈</span>
          <span class="logo-text">WanderViet AI</span>
        </div>
        <div class="header">
          <h1>${title}</h1>
          <p>${description}</p>
        </div>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="expiry-note">Mã này có hiệu lực trong vòng <strong style="color: #ffffff;">5 phút</strong></div>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          <span class="warning-text">Lưu ý bảo mật:</span> Tuyệt đối không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên WanderViet AI.
        </p>

        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống bảo mật của WanderViet AI.</p>
          <p>© 2026 WanderViet AI Ecosystem. Khám phá du lịch thông minh bằng AI.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends the OTP email using Gmail Nodemailer
 */
const sendOtpEmail = async (email, otp, purpose) => {
  const mailUser = process.env.EMAIL_USER;
  const mailPass = process.env.EMAIL_PASS;

  if (!mailUser || !mailPass || mailUser.includes('your_email') || mailPass.includes('your_google_app_password')) {
    throw new Error('EMAIL_CONFIG_MISSING');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });

  const subject = purpose === 'forgot_password' 
    ? '🔒 Đặt lại mật khẩu tài khoản WanderViet AI' 
    : '✨ Xác thực đăng ký tài khoản WanderViet AI';

  const mailOptions = {
    from: `"Bảo mật WanderViet AI" <${mailUser}>`,
    to: email,
    subject: subject,
    html: getOtpTemplate(otp, purpose)
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail
};
