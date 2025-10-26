const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');

// All routes require authentication
router.use(authenticateToken);

// FLOW app routes
router.get('/', currentEntity, (req, res) => {
  res.render('auth/apps/flow', {
    title: 'FLOW',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'FLOW',
    availableApps: getAvailableApps()
  });
});

router.get('/workflows', currentEntity, (req, res) => {
  res.render('auth/apps/flow/workflows', {
    title: 'FLOW Workflows - ADTERNATIVE',
    user: req.user,
    currentEntity: req.currentEntity,
    appName: 'FLOW',
    availableApps: getAvailableApps()
  });
});

module.exports = router;
