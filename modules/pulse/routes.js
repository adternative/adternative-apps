const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');
const {
  Audience,
  Subscriber,
  Campaign,
  Template,
  ensureReady
} = require('./models');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('pulse'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

// Home (Dashboard)
router.get('/', withAvailableApps, async (req, res) => {
  try {
    const entityId = req.currentEntity ? req.currentEntity.id : null;
    const where = entityId ? { entity_id: entityId } : {};
    const [audiences, campaigns, templates] = entityId ? await Promise.all([
      Audience.findAll({ where }),
      Campaign.findAll({ where }),
      Template.findAll({ where })
    ]) : [[], [], []];
    
    const audienceIds = audiences.map(a => a.id);
    const subscribersCount = audienceIds.length
      ? await Subscriber.count({ where: { audience_id: audienceIds } })
      : 0;

    res.render(path.join(__dirname, 'views', 'index.pug'), {
      title: 'PULSE',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'PULSE',
      availableApps: req.availableApps || getAvailableApps(),
      stats: {
        audiences: audiences.length,
        subscribers: subscribersCount,
        campaigns: campaigns.length,
        templates: templates.length
      },
      audiences,
      campaigns,
      templates,
      noEntity: !entityId
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// List Audiences
router.get('/audiences', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'audiences.pug'), {
        title: 'PULSE • Audiences',
        user: req.user,
        currentEntity: null,
        audiences: [],
        appName: 'PULSE',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const audiences = await Audience.findAll({
      where: { entity_id: req.currentEntity.id },
      order: [['name', 'ASC']]
    });

    res.render(path.join(__dirname, 'views', 'audiences.pug'), {
      title: 'PULSE • Audiences',
      user: req.user,
      currentEntity: req.currentEntity,
      audiences,
      appName: 'PULSE',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// List Campaigns
router.get('/campaigns', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'campaigns.pug'), {
        title: 'PULSE • Campaigns',
        user: req.user,
        currentEntity: null,
        campaigns: [],
        audiences: [],
        templates: [],
        appName: 'PULSE',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const [campaigns, audiences, templates] = await Promise.all([
      Campaign.findAll({ 
        where: { entity_id: req.currentEntity.id },
        include: [{ association: 'audience' }, { association: 'template' }],
        order: [['name', 'ASC']]
      }),
      Audience.findAll({ where: { entity_id: req.currentEntity.id } }),
      Template.findAll({ where: { entity_id: req.currentEntity.id } })
    ]);

    res.render(path.join(__dirname, 'views', 'campaigns.pug'), {
      title: 'PULSE • Campaigns',
      user: req.user,
      currentEntity: req.currentEntity,
      campaigns,
      audiences,
      templates,
      appName: 'PULSE',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// List Templates
router.get('/templates', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'templates.pug'), {
        title: 'PULSE • Templates',
        user: req.user,
        currentEntity: null,
        templates: [],
        appName: 'PULSE',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const templates = await Template.findAll({
      where: { entity_id: req.currentEntity.id },
      order: [['name', 'ASC']]
    });

    res.render(path.join(__dirname, 'views', 'templates.pug'), {
      title: 'PULSE • Templates',
      user: req.user,
      currentEntity: req.currentEntity,
      templates,
      appName: 'PULSE',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// List Subscribers
router.get('/subscribers', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'subscribers.pug'), {
        title: 'PULSE • Subscribers',
        user: req.user,
        currentEntity: null,
        subscribers: [],
        audiences: [],
        appName: 'PULSE',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const { audience_id } = req.query;
    const audiences = await Audience.findAll({ where: { entity_id: req.currentEntity.id } });
    const audienceIds = audiences.map(a => a.id);
    const subsWhere = audience_id ? { audience_id } : (audienceIds.length ? { audience_id: audienceIds } : {});
    
    const subscribers = await Subscriber.findAll({
      where: subsWhere,
      include: [{ association: 'audience' }],
      order: [['email', 'ASC']]
    });

    res.render(path.join(__dirname, 'views', 'subscribers.pug'), {
      title: 'PULSE • Subscribers',
      user: req.user,
      currentEntity: req.currentEntity,
      subscribers,
      audiences,
      selectedAudienceId: audience_id || '',
      appName: 'PULSE',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// API Routes
const audiences = require('./controllers/audiencesController');
const subscribers = require('./controllers/subscribersController');
const campaigns = require('./controllers/campaignsController');
const templates = require('./controllers/templatesController');

router.get('/api/:entityId/status', requireAppAccess('pulse'), async (req, res) => {
  res.json({ app: 'PULSE', entityId: req.params.entityId, status: 'ok' });
});

// Audiences API
router.get('/audiences/list', audiences.list);
router.get('/audiences/:id', audiences.get);
router.post('/audiences', audiences.create);
router.put('/audiences/:id', audiences.update);
router.delete('/audiences/:id', audiences.remove);

// Subscribers API
router.get('/subscribers/list', subscribers.list);
router.get('/subscribers/:id', subscribers.get);
router.post('/subscribers', subscribers.create);
router.put('/subscribers/:id', subscribers.update);
router.delete('/subscribers/:id', subscribers.remove);
router.post('/subscribers/:id/tags', subscribers.addTag);
router.delete('/subscribers/:id/tags', subscribers.removeTag);

// Campaigns API
router.get('/campaigns/list', campaigns.list);
router.get('/campaigns/:id', campaigns.get);
router.post('/campaigns', campaigns.create);
router.put('/campaigns/:id', campaigns.update);
router.delete('/campaigns/:id', campaigns.remove);
router.post('/campaigns/:id/schedule', campaigns.schedule);

// Templates API
router.get('/templates/list', templates.list);
router.get('/templates/:id', templates.get);
router.post('/templates', templates.create);
router.put('/templates/:id', templates.update);
router.delete('/templates/:id', templates.remove);

module.exports = (app) => {
  app.use('/pulse', router);
  console.log('[PULSE] Routes loaded at /pulse');
};
