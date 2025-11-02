const express = require('express');

const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');

const { ensureReady } = require('./database');
const { renderDashboard } = require('./controllers/dashboard');
const { listKeywords } = require('./controllers/keyword');
const { showAudit } = require('./controllers/audit');
const { listTechnicalIssues } = require('./controllers/technical');
const { listBacklinks } = require('./controllers/backlink');
const { listRankTracking } = require('./controllers/rank');
const { triggerAnalysis } = require('./controllers/analysis');

const router = express.Router();

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('reverb'));

router.use(async (req, res, next) => {
  try {
    await ensureReady();
  } catch (error) {
    console.error('[REVERB] ensureReady error:', error.message);
  }
  next();
});

router.use((req, res, next) => {
  res.locals.appName = 'REVERB';
  next();
});

router.get('/', withAvailableApps, renderDashboard);
router.get('/keywords', withAvailableApps, listKeywords);
router.get('/audit', withAvailableApps, showAudit);
router.get('/technical', withAvailableApps, listTechnicalIssues);
router.get('/backlinks', withAvailableApps, listBacklinks);
router.get('/ranks', withAvailableApps, listRankTracking);

router.post('/analysis', triggerAnalysis);
router.post('/analyze', triggerAnalysis);

module.exports = (app) => {
  app.use('/reverb', router);
  console.log('[REVERB] Routes loaded at /reverb');
};



