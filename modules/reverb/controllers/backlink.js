const path = require('path');
const { resolveSite } = require('./helpers');
const { syncBacklinks, listBacklinksWithVelocity } = require('../services/backlinkService');

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

const renderBacklinks = async (req, res) => {
  try {
    const { site } = await resolveSite(req);
    const backlinks = await listBacklinksWithVelocity({ siteId: site.id });

    res.render(path.join(__dirname, '..', 'views', 'backlinks.pug'), {
      title: 'REVERB • Backlinks',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      backlinks,
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

const refreshBacklinks = async (req, res) => {
  try {
    const { site, entityId, domain } = await resolveSite(req);
    const useMock = parseMockFlag(req.body && req.body.mock);
    const backlinks = await syncBacklinks({ entityId, siteId: site.id, domain, forceMock: useMock });

    if (wantsJson(req)) {
      res.json({ success: true, backlinks });
      return;
    }

    res.redirect('/reverb/backlinks?status=success&message=' + encodeURIComponent('Backlinks refreshed for ' + site.domain));
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.redirect('/reverb/backlinks?status=error&message=' + encodeURIComponent(error.message));
  }
};

module.exports = {
  renderBacklinks,
  refreshBacklinks
};


