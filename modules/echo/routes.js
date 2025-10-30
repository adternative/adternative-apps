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
router.use(requireAppAccess('echo'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

// Home
router.get('/', withAvailableApps, (req, res) => {
  res.render(path.join(__dirname, 'views', 'index.pug'), {
    title: 'ECHO',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'ECHO',
    availableApps: req.availableApps || getAvailableApps()
  });
});

router.get('/api/:entityId/status', requireAppAccess('echo'), async (req, res) => {
  res.json({ app: 'ECHO', entityId: req.params.entityId, status: 'ok' });
});

module.exports = (app) => {
  app.use('/echo', router);
  console.log('[ECHO] Routes loaded at /echo');
};
