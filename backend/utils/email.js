const nodemailer = require("nodemailer");

async function createTestTransporter() {
  // creates a test account (ethereal.email) for dev previews
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return { transporter, preview: true, testAccount };
}

async function sendOtpEmail(toEmail, subject, htmlBody) {
  // For dev use the test transporter
  const { transporter } = await createTestTransporter();

  const info = await transporter.sendMail({
    from: '"Secure Bank" <no-reply@Securebank.test>',
    to: toEmail,
    subject,
    html: htmlBody,
  });

  // Preview URL is useful in dev (opens in ethereal)
  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("OTP email sent. Preview URL:", previewUrl);
  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendOtpEmail };
