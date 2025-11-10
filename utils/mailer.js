// SMTP mailer utility (Nodemailer-based).
// Supports env-configured defaults and per-call overrides.

let nodemailer = null;
try {
  // Defer require so apps without mail enabled do not crash at startup
  // (will throw a helpful error on first send attempt if not installed).
  // Install with: npm i nodemailer
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

let transporterCache = null;

const coerceBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return fallback;
  const v = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return fallback;
};

const env = process.env;

const getDefaultFrom = () => {
  const fromEmail = env.SMTP_FROM_EMAIL || env.MAIL_FROM_EMAIL || env.EMAIL_FROM;
  const fromName = env.SMTP_FROM_NAME || env.MAIL_FROM_NAME || env.EMAIL_FROM_NAME || 'Adternative';
  if (!fromEmail) return null;
  return `${fromName} <${fromEmail}>`;
};

const buildTransportOptions = () => {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const secureEnv = env.SMTP_SECURE;
  // If secure not explicitly set, default to true for 465, false otherwise
  const secure = typeof secureEnv !== 'undefined'
    ? coerceBoolean(secureEnv, false)
    : (port === 465);
  const requireTLS = coerceBoolean(env.SMTP_REQUIRE_TLS, false);
  const user = env.SMTP_USER || env.SMTP_USERNAME;
  const pass = env.SMTP_PASS || env.SMTP_PASSWORD;

  const auth = (user && pass) ? { user, pass } : undefined;

  return {
    host,
    port,
    secure,
    requireTLS,
    auth
  };
};

const ensureTransporter = () => {
  if (transporterCache) return transporterCache;
  if (!nodemailer) {
    const err = new Error('Email sending not available: nodemailer is not installed. Run `npm install nodemailer`.');
    err.code = 'MAILER_DEP_MISSING';
    throw err;
  }

  const opts = buildTransportOptions();
  if (!opts.host) {
    const err = new Error('SMTP configuration missing: set SMTP_HOST in environment.');
    err.code = 'MAILER_CONFIG_MISSING_HOST';
    throw err;
  }
  if (!opts.port) {
    const err = new Error('SMTP configuration missing: set SMTP_PORT in environment.');
    err.code = 'MAILER_CONFIG_MISSING_PORT';
    throw err;
  }
  if (!opts.auth) {
    // Allow unauthenticated SMTP if explicitly requested (rare). Otherwise require creds.
    if (!coerceBoolean(env.SMTP_ALLOW_NO_AUTH, false)) {
      const err = new Error('SMTP credentials missing: set SMTP_USER and SMTP_PASS in environment.');
      err.code = 'MAILER_CONFIG_MISSING_AUTH';
      throw err;
    }
  }

  transporterCache = nodemailer.createTransport(opts);
  return transporterCache;
};

/**
 * Send a generic email via SMTP.
 * @param {{
 *   to: string | string[],
 *   subject: string,
 *   text?: string,
 *   html?: string,
 *   cc?: string | string[],
 *   bcc?: string | string[],
 *   replyTo?: string,
 *   fromEmail?: string,
 *   fromName?: string,
 *   headers?: Record<string,string>,
 *   attachments?: Array<object>
 * }} params
 * @returns {Promise<{ messageId: string }>}
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  replyTo,
  fromEmail,
  fromName,
  headers,
  attachments
}) {
  const transporter = ensureTransporter();

  const fallbackFrom = getDefaultFrom();
  const from =
    (fromEmail && fromName) ? `${fromName} <${fromEmail}>`
      : (fromEmail ? fromEmail : fallbackFrom);

  if (!from) {
    const err = new Error('Missing From address: provide fromEmail/fromName or set SMTP_FROM_EMAIL in env.');
    err.code = 'MAILER_FROM_MISSING';
    throw err;
  }

  if (!to) {
    const err = new Error('Missing recipient: `to` is required.');
    err.code = 'MAILER_TO_MISSING';
    throw err;
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    replyTo: replyTo || env.SMTP_REPLY_TO || undefined,
    headers,
    attachments
  });

  return { messageId: info && info.messageId ? info.messageId : '' };
}

/**
 * Send a team invite email to a non-existing user.
 * @param {{ toEmail: string, role: string, entityName: string, inviterName: string, inviterEmail?: string }} params
 */
async function sendTeamInviteEmail({ toEmail, role, entityName, inviterName, inviterEmail }) {
  const subject = `Invitation to collaborate on ${entityName}`;
  const text = `Hello,
  
You have been invited as ${role} to work on ${entityName} by ${inviterName}${inviterEmail ? ` (${inviterEmail})` : ''}.

Please sign up to access the workspace.

Thanks,
Adternative Team`;
  const html = `
    <p>Hello,</p>
    <p>You have been invited as <strong>${role}</strong> to work on <strong>${entityName}</strong> by <strong>${inviterName}</strong>${inviterEmail ? ` (<a href="mailto:${inviterEmail}">${inviterEmail}</a>)` : ''}.</p>
    <p>Please sign up to access the workspace.</p>
    <p>Thanks,<br/>Adternative Team</p>
  `;
  return sendEmail({ to: toEmail, subject, text, html });
}

module.exports = {
  sendEmail,
  sendTeamInviteEmail
};
 
 
