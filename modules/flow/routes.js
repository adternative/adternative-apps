const express = require('express');
const router = express.Router();
const path = require('path');
const { Op } = require('sequelize');
const { authenticateToken } = require('../../middleware/auth');
const { requireAppAccess, withAvailableApps } = require('../../middleware/paywall');
const { currentEntity } = require('../../middleware/entity');
const { getAvailableApps } = require('../../utils/appLoader');
const {
  PlatformAccount,
  Post,
  PostShare,
  Ad,
  AdPlacement,
  ensureReady
} = require('./models');

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('flow'));

// Ensure schema exists per request (fast when already created)
router.use(async (req, res, next) => {
  try { await ensureReady(); } catch (_) {}
  next();
});

// Home (Dashboard)
router.get('/', withAvailableApps, async (req, res) => {
  try {
    const entityId = req.currentEntity ? req.currentEntity.id : null;
    const [accounts, recentPosts, recentAds] = entityId ? await Promise.all([
      PlatformAccount.findAll({ where: { entity_id: entityId, is_active: true } }),
      Post.findAll({ where: { entity_id: entityId }, limit: 5, order: [['createdAt', 'DESC']] }),
      Ad.findAll({ where: { entity_id: entityId }, limit: 5, order: [['createdAt', 'DESC']] })
    ]) : [[], [], []];

    res.render(path.join(__dirname, 'views', 'index.pug'), {
      title: 'FLOW',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps(),
      stats: {
        accounts: accounts.length,
        posts: recentPosts.length,
        ads: recentAds.length
      },
      recentPosts,
      recentAds,
      noEntity: !entityId
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Unified Create (Posts + Ads) - n8n-like minimal workflow
router.get('/create', withAvailableApps, async (req, res) => {
  try {
    const entityId = req.currentEntity ? req.currentEntity.id : null;
    const accounts = entityId
      ? await PlatformAccount.findAll({ where: { entity_id: entityId, is_active: true } })
      : [];

    res.render(path.join(__dirname, 'views', 'create.pug'), {
      title: 'FLOW • Create',
      user: req.user,
      currentEntity: req.currentEntity || null,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps(),
      accounts,
      noEntity: !entityId
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Example protected endpoint (entityId required in param)
router.get('/api/:entityId/status', requireAppAccess('flow'), async (req, res) => {
  res.json({ app: 'FLOW', entityId: req.params.entityId, status: 'ok' });
});

// Calendar events (posts + ads)
router.get('/api/calendar', async (req, res) => {
  try {
    if (!req.currentEntity) return res.json({ success: true, events: [] });

    const entityId = req.currentEntity.id;
    const parseDate = (val, fallback) => {
      const d = val ? new Date(val) : null;
      return isNaN(d?.getTime()) ? fallback : d;
    };

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Expand default window a bit to cover preceding/next weeks in the grid
    defaultStart.setDate(defaultStart.getDate() - 7);
    defaultEnd.setDate(defaultEnd.getDate() + 7);

    const start = parseDate(req.query.start, defaultStart);
    const end = parseDate(req.query.end, defaultEnd);

    // Posts: include scheduled or published within range
    const posts = await Post.findAll({
      where: {
        entity_id: entityId,
        [Op.or]: [
          { scheduled_at: { [Op.between]: [start, end] } },
          { published_at: { [Op.between]: [start, end] } }
        ]
      },
      order: [['scheduled_at', 'ASC'], ['published_at', 'ASC']]
    });

    // Ads: any that overlap with the range
    const ads = await Ad.findAll({
      where: {
        entity_id: entityId,
        [Op.or]: [
          { start_date: { [Op.between]: [start, end] } },
          { end_date: { [Op.between]: [start, end] } },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: start } },
              { end_date: { [Op.gte]: end } }
            ]
          }
        ]
      },
      order: [['start_date', 'ASC']]
    });

    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const events = [];

    // Map posts to day events (scheduled and/or published)
    for (const p of posts) {
      if (p.scheduled_at) {
        const d = new Date(p.scheduled_at);
        if (d >= start && d <= end) {
          events.push({
            id: p.id,
            date: toYmd(d),
            type: 'post',
            status: p.status,
            title: p.title || 'Untitled Post',
            url: `/flow/posts/${p.id}`
          });
        }
      }
      if (p.published_at) {
        const d = new Date(p.published_at);
        if (d >= start && d <= end) {
          events.push({
            id: `${p.id}-pub`,
            date: toYmd(d),
            type: 'post',
            status: 'published',
            title: p.title || 'Untitled Post',
            url: `/flow/posts/${p.id}`
          });
        }
      }
    }

    // Map ads to day events across their date range
    for (const a of ads) {
      const startDate = a.start_date ? new Date(a.start_date) : null;
      const endDate = a.end_date ? new Date(a.end_date) : startDate;
      if (!startDate) continue;
      const rangeStart = startDate > start ? startDate : new Date(start);
      const rangeEnd = endDate && endDate < end ? endDate : new Date(end);
      const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
      const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
      while (cursor <= last) {
        events.push({
          id: `${a.id}-${toYmd(cursor)}`,
          date: toYmd(cursor),
          type: 'ad',
          status: a.status,
          title: a.name,
          url: `/flow/ads/${a.id}`
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    res.json({ success: true, events });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// List Posts
router.get('/posts', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'posts.pug'), {
        title: 'FLOW • Posts',
        user: req.user,
        currentEntity: null,
        posts: [],
        accounts: [],
        appName: 'FLOW',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const posts = await Post.findAll({
      where: { entity_id: req.currentEntity.id },
      order: [['createdAt', 'DESC']]
    });

    const accounts = await PlatformAccount.findAll({ where: { entity_id: req.currentEntity.id, is_active: true } });

    res.render(path.join(__dirname, 'views', 'posts.pug'), {
      title: 'FLOW • Posts',
      user: req.user,
      currentEntity: req.currentEntity,
      posts,
      accounts,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Create Post (and optional scheduled shares)
router.post('/api/posts', async (req, res) => {
  try {
    if (!req.currentEntity) return res.status(400).json({ success: false, error: 'No entity selected' });
    const { title, body, media, scheduled_at, account_ids } = req.body;
    const post = await Post.create({
      entity_id: req.currentEntity.id,
      title: title || null,
      body,
      media: media || [],
      status: scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: scheduled_at || null,
      created_by: req.user && req.user.id ? req.user.id : null
    });

    if (Array.isArray(account_ids) && account_ids.length) {
      const rows = account_ids.map(id => ({
        post_id: post.id,
        platform_account_id: id,
        status: scheduled_at ? 'scheduled' : 'pending',
        scheduled_at: scheduled_at || null
      }));
      await PostShare.bulkCreate(rows);
    }

    res.json({ success: true, post });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Post Detail with workflow
router.get('/posts/:id', withAvailableApps, async (req, res) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id, entity_id: req.currentEntity.id } });
    if (!post) return res.status(404).send('Post not found');

    const shares = await PostShare.findAll({
      where: { post_id: post.id },
      include: [{ model: PlatformAccount, as: 'platformAccount' }],
      order: [['createdAt', 'ASC']]
    });

    // Build simple workflow nodes for view
    const nodes = [
      { id: 'content', label: 'Content', type: 'content', status: post.status }
    ];
    const edges = [];
    shares.forEach((share, idx) => {
      const acc = share.platformAccount || {};
      const nodeId = `share-${idx}`;
      nodes.push({
        id: nodeId,
        label: `${acc.platform || ''}\n${acc.account_name || ''}`.trim(),
        type: 'share',
        status: share.status
      });
      edges.push({ from: 'content', to: nodeId });
    });

    res.render(path.join(__dirname, 'views', 'post_detail.pug'), {
      title: post.title ? `FLOW • ${post.title}` : 'FLOW • Post',
      user: req.user,
      currentEntity: req.currentEntity,
      post,
      shares,
      nodes,
      edges,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps()
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// List Ads
router.get('/ads', withAvailableApps, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render(path.join(__dirname, 'views', 'ads.pug'), {
        title: 'FLOW • Ads',
        user: req.user,
        currentEntity: null,
        ads: [],
        accounts: [],
        appName: 'FLOW',
        availableApps: req.availableApps || getAvailableApps(),
        noEntity: true
      });
    }

    const ads = await Ad.findAll({
      where: { entity_id: req.currentEntity.id },
      order: [['createdAt', 'DESC']]
    });

    const accounts = await PlatformAccount.findAll({ where: { entity_id: req.currentEntity.id, is_active: true } });

    res.render(path.join(__dirname, 'views', 'ads.pug'), {
      title: 'FLOW • Ads',
      user: req.user,
      currentEntity: req.currentEntity,
      ads,
      accounts,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps(),
      noEntity: false
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Create Ad (and optional placements)
router.post('/api/ads', async (req, res) => {
  try {
    if (!req.currentEntity) return res.status(400).json({ success: false, error: 'No entity selected' });
    const { name, objective, budget, currency, start_date, end_date, creative, targeting, account_ids } = req.body;
    const ad = await Ad.create({
      entity_id: req.currentEntity.id,
      name,
      objective: objective || null,
      budget: budget || null,
      currency: currency || 'USD',
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'draft',
      creative: creative || {},
      targeting: targeting || {}
    });

    if (Array.isArray(account_ids) && account_ids.length) {
      const rows = account_ids.map(id => ({ ad_id: ad.id, platform_account_id: id, status: 'pending' }));
      await AdPlacement.bulkCreate(rows);
    }

    res.json({ success: true, ad });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Ad Detail with workflow
router.get('/ads/:id', withAvailableApps, async (req, res) => {
  try {
    const ad = await Ad.findOne({ where: { id: req.params.id, entity_id: req.currentEntity.id } });
    if (!ad) return res.status(404).send('Ad not found');

    const placements = await AdPlacement.findAll({
      where: { ad_id: ad.id },
      include: [{ model: PlatformAccount, as: 'platformAccount' }],
      order: [['createdAt', 'ASC']]
    });

    const nodes = [
      { id: 'creative', label: 'Creative', type: 'content', status: ad.status }
    ];
    const edges = [];
    placements.forEach((pl, idx) => {
      const acc = pl.platformAccount || {};
      const nodeId = `placement-${idx}`;
      nodes.push({ id: nodeId, label: `${acc.platform || ''}\\n${acc.account_name || ''}`.trim(), type: 'placement', status: pl.status });
      edges.push({ from: 'creative', to: nodeId });
    });

    res.render(path.join(__dirname, 'views', 'ad_detail.pug'), {
      title: `FLOW • ${ad.name}`,
      user: req.user,
      currentEntity: req.currentEntity,
      ad,
      placements,
      nodes,
      edges,
      appName: 'FLOW',
      availableApps: req.availableApps || getAvailableApps()
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = (app) => {
  app.use('/flow', router);
  console.log('[FLOW] Routes loaded at /flow');
};
