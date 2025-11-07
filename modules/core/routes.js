const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { ensureReady } = require('./database');
const dashboard = require('./controllers/dashboard');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('core'));

router.use(async (req, res, next) => {
  try {
    await ensureReady();
  } catch (error) {
    console.error('[CORE] ensureReady error:', error.message);
  }
  next();
});

router.get('/', withAvailableApps, dashboard.renderDashboard);
router.get('/summary', dashboard.getSummary);
router.post('/refresh', dashboard.triggerRefresh);

module.exports = (app) => {
  app.use('/core', router);
  console.log('[CORE] Routes mounted at /core');
};


