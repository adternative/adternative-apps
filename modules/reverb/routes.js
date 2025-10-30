const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');
const { ensureReady } = require('./models');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('reverb'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

// Home
router.get('/', withAvailableApps, (req, res) => {
  res.render(path.join(__dirname, 'views', 'index.pug'), {
    title: 'REVERB',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'REVERB',
    availableApps: req.availableApps || getAvailableApps()
  });
});

router.get('/api/:entityId/status', requireAppAccess('reverb'), async (req, res) => {
  res.json({ app: 'REVERB', entityId: req.params.entityId, status: 'ok' });
});

module.exports = (app) => {
  app.use('/reverb', router);
  console.log('[REVERB] Routes loaded at /reverb');
};
