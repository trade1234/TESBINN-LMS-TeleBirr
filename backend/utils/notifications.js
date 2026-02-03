const Notification = require('../models/Notification');
const sendEmail = require('./sendEmail');

const hasEmailConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isEmailEnabled = () => {
  const value = process.env.NOTIFICATIONS_EMAIL_ENABLED;
  if (value === undefined) return true;
  return !['false', '0', 'off', 'no'].includes(String(value).toLowerCase());
};

const resolveLink = (link) => {
  if (!link) return '';
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  const base = process.env.FRONTEND_URL || process.env.APP_URL || '';
  if (!base) return link;
  return `${base.replace(/\/+$/, '')}/${link.replace(/^\/+/, '')}`;
};

const buildEmailContent = (user, payload, options = {}) => {
  const brand = process.env.EMAIL_BRAND_NAME || process.env.FROM_NAME || 'TESBINN LMS';
  const supportEmail = process.env.EMAIL_SUPPORT || process.env.FROM_EMAIL || '';
  const footer =
    process.env.EMAIL_TEMPLATE_FOOTER ||
    `You are receiving this notification from ${brand}.`;
  const signature =
    process.env.EMAIL_TEMPLATE_SIGNATURE || `Thanks,\n${brand} Team`;
  const fullLink = resolveLink(payload.link);
  const greeting = process.env.EMAIL_TEMPLATE_GREETING || `Hi ${user?.name || 'there'},`;

  const textLines = [
    greeting,
    '',
    payload.message,
    fullLink ? `\nOpen: ${fullLink}` : '',
    '',
    signature,
    supportEmail ? `Support: ${supportEmail}` : '',
    footer,
  ].filter(Boolean);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">${brand}</h2>
      <p>${greeting}</p>
      <p><strong>${payload.title}</strong></p>
      <p>${payload.message}</p>
      ${
        fullLink
          ? `<p><a href="${fullLink}" style="color: #2563eb;">View details</a></p>`
          : ''
      }
      <p style="margin-top: 20px; white-space: pre-line;">${signature}</p>
      ${supportEmail ? `<p>Support: <a href="mailto:${supportEmail}">${supportEmail}</a></p>` : ''}
      <p style="font-size: 12px; color: #64748b;">${footer}</p>
    </div>
  `.trim();

  return {
    subjectPrefix: process.env.NOTIFICATIONS_EMAIL_SUBJECT_PREFIX || '',
    text: textLines.join('\n'),
    html,
  };
};

const shouldNotifyUser = (user, preferenceKey) => {
  if (!preferenceKey) return true;
  const preferences = user?.preferences?.notifications || {};
  const value = preferences[preferenceKey];
  return typeof value === 'boolean' ? value : true;
};

const createNotificationForUser = async (user, payload, options = {}) => {
  if (!user) return null;
  if (!shouldNotifyUser(user, options.preferenceKey)) return null;

  const notification = await Notification.create({
    user: user._id,
    ...payload,
  });

  if (options.sendEmail && isEmailEnabled() && hasEmailConfig() && user.email) {
    try {
      const content = buildEmailContent(user, payload, options);
      const subjectPrefix = content.subjectPrefix
        ? `${content.subjectPrefix.trim()} `
        : '';
      await sendEmail({
        email: user.email,
        subject: subjectPrefix + (options.emailSubject || payload.title),
        message: options.emailMessage || content.text,
        html: content.html,
      });
    } catch (err) {
      // Email failures should not block notification creation.
    }
  }

  return notification;
};

const createNotificationsForUsers = async (users, payload, options = {}) => {
  const results = [];
  for (const user of users || []) {
    const notification = await createNotificationForUser(user, payload, options);
    if (notification) {
      results.push(notification);
    }
  }
  return results;
};

module.exports = {
  createNotificationForUser,
  createNotificationsForUsers,
  shouldNotifyUser,
};
