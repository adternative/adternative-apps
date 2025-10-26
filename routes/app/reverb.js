const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');

// All routes require authentication
router.use(authenticateToken);

// REVERB app routes
router.get('/', currentEntity, (req, res) => {
  res.render('auth/apps/reverb', {
    title: 'REVERB',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'REVERB',
    availableApps: getAvailableApps()
  });
});

router.get('/audio', currentEntity, (req, res) => {
  res.render('auth/apps/reverb-audio', {
    title: 'REVERB Audio - ADTERNATIVE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'REVERB',
    availableApps: getAvailableApps()
  });
});

module.exports = router;
