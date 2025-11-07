// Minimal mailer utility. Replace with real provider integration when available.

/**
 * Send a generic email (stub).
 * @param {{ to: string, subject: string, text?: string, html?: string }} params
 */
async function sendEmail({ to, subject, text, html }) {
  // In production, integrate with SMTP/SES/SendGrid/etc.
  console.log('[Mailer] Sending email:', { to, subject, textLength: text ? text.length : 0, htmlLength: html ? html.length : 0 });
  return true;
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


