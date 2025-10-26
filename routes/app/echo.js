const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');

// All routes require authentication
router.use(authenticateToken);

// ECHO app routes
router.get('/', currentEntity, (req, res) => {
  res.render('auth/apps/echo', {
    title: 'ECHO',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'ECHO',
    availableApps: getAvailableApps()
  });
});

router.get('/monitoring', currentEntity, (req, res) => {
  res.render('auth/apps/echo/monitoring', {
    title: 'ECHO Monitoring - ADTERNATIVE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'ECHO',
    availableApps: getAvailableApps()
  });
});

module.exports = router;
