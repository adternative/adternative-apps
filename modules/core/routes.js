const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { currentEntity, requireCurrentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const path = require('path');

// Import monitoring modules
const { scanEntity } = require('../../modules/core/scanner');
const { Entity } = require('../../models');
const { Sentiment, ensureReady } = require('./models');
const { sendTestAlert } = require('../../modules/core/alerts');

// All routes require authentication and entity context before paywall
router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('core'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

// CORE app routes
router.get('/', withAvailableApps, (req, res) => {
  res.render(path.join(__dirname, 'views', 'index.pug'), {
    title: 'CORE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'CORE',
    availableApps: req.availableApps || getAvailableApps()
  });
});

// Reputation monitoring API (protected per entity)
router.get('/api/scan/:entityId', requireAppAccess('core'), async (req, res) => {
  try {
    const { entityId } = req.params;
    const entity = await Entity.findByPk(entityId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found', entityId });
    }
    const result = await scanEntity(entityId);
    res.json({ success: true, message: 'Scan completed successfully', data: {
      entityId: result.entityId,
      entityName: result.entityName,
      analysis: result.analysis,
      timestamp: new Date().toISOString()
    }});
  } catch (error) {
    console.error('[API] Error scanning entity:', error);
    res.status(500).json({ error: 'Scan failed', message: error.message });
  }
});

router.get('/api/trends/:entityId', requireAppAccess('core'), async (req, res) => {
  try {
    const { entityId } = req.params;
    const { limit = 50, platform } = req.query;
    const entity = await Entity.findByPk(entityId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found', entityId });
    }
    const whereClause = { entityId };
    if (platform) whereClause.platform = platform;
    const sentiments = await Sentiment.findAll({
      where: whereClause,
      order: [['collectedAt', 'DESC']],
      limit: parseInt(limit)
    });
    res.json({ success: true, entityId, entityName: entity.name, count: sentiments.length, sentiments: sentiments.map(s => ({
      id: s.id,
      platform: s.platform,
      posts: s.posts,
      positive: s.positive,
      neutral: s.neutral,
      negative: s.negative,
      score: parseFloat(s.score),
      riskLevel: s.riskLevel,
      collectedAt: s.collectedAt
    }))});
  } catch (error) {
    console.error('[API] Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends', message: error.message });
  }
});

router.get('/api/alerts', requireAppAccess('core'), async (req, res) => {
  try {
    const { since } = req.query;
    const whereClause = { riskLevel: 'high' };
    if (since) whereClause.collectedAt = { $gte: new Date(since) };
    const sentiments = await Sentiment.findAll({ where: whereClause, order: [['collectedAt', 'DESC']] });
    res.json({ success: true, count: sentiments.length, alerts: sentiments.map(s => ({
      id: s.id,
      entityId: s.entityId,
      platform: s.platform,
      score: parseFloat(s.score),
      riskLevel: s.riskLevel,
      positive: s.positive,
      neutral: s.neutral,
      negative: s.negative,
      collectedAt: s.collectedAt
    }))});
  } catch (error) {
    console.error('[API] Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts', message: error.message });
  }
});

router.post('/webhooks/test', async (req, res) => {
  try {
    const result = await sendTestAlert();
    res.json({ success: true, message: 'Test alert sent', results: {
      email: result.email ? 'sent' : 'skipped (ADMIN_EMAIL not configured)',
      webhook: result.webhook ? 'sent' : 'skipped (WEBHOOK_URL not configured)',
      errors: result.errors
    }});
  } catch (error) {
    console.error('[API] Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert', message: error.message });
  }
});

module.exports = (app) => {
  app.use('/core', router);
  console.log('[CORE] Routes loaded at /core');
};
