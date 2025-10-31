const path = require('path');
const { runSiteAudit, getLatestAudit, listPageInsights } = require('../services/crawlerService');
const { fetchLighthouseReport } = require('../services/lighthouseService');
const { listInsightEvents } = require('../services/eventService');
const { models } = require('../database');
const { resolveSite } = require('./helpers');

const wantsJson = (req) => {
  if (!req || !req.headers) return false;
  if (req.xhr) return true;
  const accept = req.headers.accept || '';
  return accept.indexOf('application/json') !== -1;
};

const parseMockFlag = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const renderSiteHealth = async (req, res) => {
  try {
    const { site, entityId } = await resolveSite(req);
    const latestAudit = await getLatestAudit({ entityId, siteId: site.id });
    let pageInsights = [];
    let pageTotal = 0;
    if (latestAudit) {
      const pageResult = await listPageInsights({ auditId: latestAudit.id, limit: 100 });
      pageInsights = pageResult.rows;
      pageTotal = pageResult.count;
    }
    const events = await listInsightEvents({ entityId, siteId: site.id });

    res.render(path.join(__dirname, '..', 'views', 'site-health.pug'), {
      title: 'REVERB • Site Health',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      latestAudit,
      pageInsights,
      pageTotal,
      events,
      feedback: {
        status: req.query.status || null,
        message: req.query.message || null
      }
    });
  } catch (error) {
    res.status(400).render(path.join(__dirname, '..', 'views', 'error.pug'), {
      title: 'REVERB • Error',
      error: error.message
    });
  }
};

const triggerSiteAudit = async (req, res) => {
  try {
    const { site, entityId, domain } = await resolveSite(req);
    const useMock = parseMockFlag(req.body && req.body.mock);
    const audit = await runSiteAudit({ entityId, domain, useMock });

    if (wantsJson(req)) {
      res.json({ success: true, audit, site });
      return;
    }

    const redirectUrl = '/reverb/site-health?status=success&message=' + encodeURIComponent('Audit completed for ' + site.domain);
    res.redirect(redirectUrl);
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    const redirectUrl = '/reverb/site-health?status=error&message=' + encodeURIComponent(error.message);
    res.redirect(redirectUrl);
  }
};

const renderAuditDetail = async (req, res) => {
  try {
    const { site, entityId } = await resolveSite(req);
    const auditId = Number(req.params.auditId);
    if (!auditId) throw new Error('Audit not found');

    const audit = await models.SiteAudit.findOne({
      where: { id: auditId, siteId: site.id, entityId },
      include: [{
        model: models.PageInsight,
        as: 'pages',
        separate: true,
        limit: 200,
        order: [['is_broken', 'DESC'], ['status_code', 'ASC']]
      }]
    });

    if (!audit) {
      throw new Error('Audit not found for this site');
    }

    res.render(path.join(__dirname, '..', 'views', 'audit-detail.pug'), {
      title: 'REVERB • Audit Detail',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      audit
    });
  } catch (error) {
    res.status(400).render(path.join(__dirname, '..', 'views', 'error.pug'), {
      title: 'REVERB • Error',
      error: error.message
    });
  }
};

const fetchPageSpeed = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) throw new Error('url query param is required');
    const report = await fetchLighthouseReport({ url, strategy: req.query.strategy || 'desktop' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  renderSiteHealth,
  triggerSiteAudit,
  renderAuditDetail,
  fetchPageSpeed
};


