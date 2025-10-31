const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { ensureReady } = require('./database');
const dashboard = require('./controllers/dashboard');
const technical = require('./controllers/technical');
const keyword = require('./controllers/keyword');
const backlink = require('./controllers/backlink');
const competitor = require('./controllers/competitor');
const insights = require('./controllers/insights');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('reverb'));

router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

router.get('/', withAvailableApps, dashboard.renderDashboard);

router.get('/site-health', withAvailableApps, technical.renderSiteHealth);
router.post('/site-health/audit', technical.triggerSiteAudit);
router.get('/site-health/audits/:auditId', withAvailableApps, technical.renderAuditDetail);

router.get('/keywords', withAvailableApps, keyword.renderKeywords);
router.post('/keywords/sync', keyword.refreshKeywords);
router.post('/keywords/:keywordId/capture-serp', keyword.captureSerp);
router.get('/keywords/:keywordId/rank-history', withAvailableApps, keyword.renderRankHistory);

router.get('/backlinks', withAvailableApps, backlink.renderBacklinks);
router.post('/backlinks/sync', backlink.refreshBacklinks);

router.get('/competitors', withAvailableApps, competitor.renderCompetitors);
router.post('/competitors/sync', competitor.refreshCompetitors);

router.get('/insights', withAvailableApps, insights.renderInsights);
router.post('/insights/predictive', insights.refreshPredictive);

module.exports = (app) => {
  app.use('/reverb', router);
  console.log('[REVERB] Routes loaded at /reverb');
};
