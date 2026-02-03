const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message, html }) => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromName = process.env.FROM_NAME || 'TESBINN LMS';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    text: message,
    html: html || undefined,
  });

  return true;
};

module.exports = sendEmail;
