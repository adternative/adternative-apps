const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');

// Ensure all routes require auth
router.use(authenticateToken);

// GET /branding – Render branding page
router.get('/', currentEntity, async (req, res) => {
  try {
    // If no entity selected, render empty state (frame handles prompting)
    if (!req.currentEntity) {
      return res.render('branding', {
        title: 'Branding',
        user: req.user,
        assets: {},
        categories: []
      });
    }

    res.render('branding', {
      title: 'Branding',
      user: req.user,
      currentEntity: req.currentEntity,
      selectedEntityId: req.currentEntity?.id || req.session?.currentEntityId || ''
    });
  } catch (error) {
    console.error('Branding page error:', error);
    res.status(500).render('error', {
      message: 'Failed to load branding page',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
});


module.exports = router;

