const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { ensureReady } = require('./database');
const { renderDashboard } = require('./controllers/dashboard');
const { listMatches, exportMatches } = require('./controllers/match');
const { toggleFavoriteHandler, listFavorites, exportFavorites } = require('./controllers/favorite');
const { startScheduledSync } = require('./jobs/syncInfluencerStatsJob');

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
router.get('/', withAvailableApps, renderDashboard);
router.get('/discovery', withAvailableApps, renderDashboard);
router.post('/discovery', withAvailableApps, renderDashboard);

// Matches + favorites
router.get('/matches', withAvailableApps, listMatches);
router.get('/matches/export', withAvailableApps, exportMatches);
router.get('/favorites', withAvailableApps, listFavorites);
router.get('/favorites/export', withAvailableApps, exportFavorites);
router.post('/favorites/:influencerId', toggleFavoriteHandler);

module.exports = (app) => {
  startScheduledSync();
  app.use('/echo', router);
  console.log('[ECHO] Routes loaded at /echo');
};
