const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { currentEntity, requireCurrentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');

// All routes require authentication
router.use(authenticateToken);

// CORE app routes
router.get('/', currentEntity, (req, res) => {
  res.render('auth/apps/core', {
    title: 'CORE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'CORE',
    availableApps: getAvailableApps()
  });
});

router.get('/settings', currentEntity, (req, res) => {
  res.render('auth/apps/core/settings', {
    title: 'CORE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'CORE',
    availableApps: getAvailableApps()
  });
});

router.get('/analytics', currentEntity, (req, res) => {
  res.render('auth/apps/core/analytics', {
    title: 'CORE Analytics - ADTERNATIVE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'CORE',
    availableApps: getAvailableApps()
  });
});

module.exports = router;
