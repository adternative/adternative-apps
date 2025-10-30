/**
 * Alert Notification System
 * Sends alerts via email and webhook when reputation risk increases
 */

const axios = require('axios');

/**
 * Send alert notification via email and webhook
 * @param {Object} alertData - Alert payload with entityId, entityName, score, riskLevel, platforms
 */
const sendAlert = async (alertData) => {
  console.log(`[Alerts] Sending alert for entity: ${alertData.entityName}`);
  console.log(`[Alerts] Risk level: ${alertData.riskLevel}, Score: ${alertData.score}`);
  
  const results = {
    email: false,
    webhook: false,
    errors: []
  };
  
  // Send email notification
  if (process.env.ADMIN_EMAIL) {
    try {
      await sendEmailAlert(alertData);
      results.email = true;
      console.log(`[Alerts] Email sent to ${process.env.ADMIN_EMAIL}`);
    } catch (error) {
      results.errors.push({ type: 'email', error: error.message });
      console.error('[Alerts] Failed to send email:', error.message);
    }
  } else {
    console.log('[Alerts] ADMIN_EMAIL not configured, skipping email notification');
  }
  
  // Send webhook notification
  if (process.env.WEBHOOK_URL) {
    try {
      await sendWebhookAlert(alertData);
      results.webhook = true;
      console.log(`[Alerts] Webhook sent to ${process.env.WEBHOOK_URL}`);
    } catch (error) {
      results.errors.push({ type: 'webhook', error: error.message });
      console.error('[Alerts] Failed to send webhook:', error.message);
    }
  } else {
    console.log('[Alerts] WEBHOOK_URL not configured, skipping webhook notification');
  }
  
  return results;
};

/**
 * Send email alert (mock implementation)
 * In production, use nodemailer or AWS SES
 * @param {Object} alertData - Alert payload
 */
const sendEmailAlert = async (alertData) => {
  console.log(`[Email] Would send email to ${process.env.ADMIN_EMAIL}`);
  console.log(`[Email] Subject: Alert: ${alertData.entityName} - ${alertData.riskLevel.toUpperCase()} Risk Level`);
  console.log(`[Email] Body:`, JSON.stringify(alertData, null, 2));
  
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Send webhook alert
 * @param {Object} alertData - Alert payload
 */
const sendWebhookAlert = async (alertData) => {
  const payload = {
    entityId: alertData.entityId,
    entityName: alertData.entityName,
    score: alertData.score,
    riskLevel: alertData.riskLevel,
    platforms: alertData.platforms,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[Webhook] Sending to ${process.env.WEBHOOK_URL}`);
  console.log(`[Webhook] Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    await axios.post(process.env.WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Adternative-Reputation-Alerts/1.0'
      },
      timeout: 5000
    });
    
    console.log(`[Webhook] Successfully sent alert`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.warn(`[Webhook] Connection refused - webhook server may be down`);
    } else if (error.code === 'ETIMEDOUT') {
      console.warn(`[Webhook] Request timeout - webhook server may be slow`);
    }
    throw error;
  }
};

/**
 * Send a test alert to verify alert system is working
 * @returns {Promise<Object>} Test results
 */
const sendTestAlert = async () => {
  const testData = {
    entityId: 'test-entity-id',
    entityName: 'Test Entity',
    score: -0.65,
    riskLevel: 'high',
    platforms: ['twitter', 'reddit'],
    timestamp: new Date().toISOString()
  };
  
  console.log('[Test Alert] Sending test alert...');
  return await sendAlert(testData);
};

module.exports = {
  sendAlert,
  sendEmailAlert,
  sendWebhookAlert,
  sendTestAlert
};

