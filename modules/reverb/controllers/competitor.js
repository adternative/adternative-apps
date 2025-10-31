const path = require('path');
const { resolveSite } = require('./helpers');
const { syncCompetitors, getCompetitorSummary } = require('../services/competitorService');

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

const renderCompetitors = async (req, res) => {
  try {
    const { site } = await resolveSite(req);
    const summary = await getCompetitorSummary({ siteId: site.id });

    res.render(path.join(__dirname, '..', 'views', 'competitors.pug'), {
      title: 'REVERB • Competitors',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      competitors: summary,
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

const refreshCompetitors = async (req, res) => {
  try {
    const { site, entityId, domain } = await resolveSite(req);
    const useMock = parseMockFlag(req.body && req.body.mock);
    const summary = await syncCompetitors({ entityId, siteId: site.id, domain, forceMock: useMock });

    if (wantsJson(req)) {
      res.json({ success: true, summary });
      return;
    }

    res.redirect('/reverb/competitors?status=success&message=' + encodeURIComponent('Competitor overlap refreshed for ' + site.domain));
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.redirect('/reverb/competitors?status=error&message=' + encodeURIComponent(error.message));
  }
};

module.exports = {
  renderCompetitors,
  refreshCompetitors
};


