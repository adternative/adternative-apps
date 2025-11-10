const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { ensureReady } = require('./database');
const { renderDashboard } = require('./controllers/dashboard');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('echo'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

router.use((req, res, next) => {
  res.locals.appName = 'ECHO';
  next();
});

// Dashboard
router.get('/', renderDashboard);
router.get('/discovery', renderDashboard);
router.post('/discovery', renderDashboard);

// Matches and favorites temporarily disabled due to current structure

module.exports = (app) => {
  app.use('/echo', router);
  console.log('[ECHO] Routes loaded at /echo');
};
