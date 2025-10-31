const path = require('path');
const { resolveSite } = require('./helpers');
const { listAiInsights, getPredictiveSummary } = require('../services/insightService');

const wantsJson = (req) => {
  if (!req || !req.headers) return false;
  if (req.xhr) return true;
  const accept = req.headers.accept || '';
  return accept.indexOf('application/json') !== -1;
};

const renderInsights = async (req, res) => {
  try {
    const { site, entityId } = await resolveSite(req);
    const keyword = (req.query && req.query.keyword) ? req.query.keyword : 'seo intelligence platform';
    const url = (req.query && req.query.url) ? req.query.url : 'https://' + site.domain + '/blog/seo-intelligence';

    const insights = await listAiInsights({ entityId, siteId: site.id });
    const predictive = await getPredictiveSummary({ entityId, siteId: site.id, keyword, url });

    res.render(path.join(__dirname, '..', 'views', 'insights.pug'), {
      title: 'REVERB • Insights',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      insights,
      predictive,
      keyword,
      predictiveUrl: url,
      feedback: {
        status: req.query.status || null,
        message: req.query.message || null
      }
    });
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(400).render(path.join(__dirname, '..', 'views', 'error.pug'), {
      title: 'REVERB • Error',
      error: error.message
    });
  }
};

const refreshPredictive = async (req, res) => {
  try {
    const { site, entityId } = await resolveSite(req);
    const keyword = req.body && req.body.keyword ? String(req.body.keyword).trim() : 'seo intelligence platform';
    const providedUrl = req.body && req.body.url ? String(req.body.url).trim() : '';
    const url = providedUrl || 'https://' + site.domain + '/blog/seo-intelligence';

    const summary = await getPredictiveSummary({ entityId, siteId: site.id, keyword, url });

    if (wantsJson(req)) {
      res.json({ success: true, summary });
      return;
    }

    const redirectUrl = '/reverb/insights?status=success&message=' + encodeURIComponent('Predictive insights refreshed.') + '&keyword=' + encodeURIComponent(keyword) + '&url=' + encodeURIComponent(url);
    res.redirect(redirectUrl);
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    const redirectUrl = '/reverb/insights?status=error&message=' + encodeURIComponent(error.message);
    res.redirect(redirectUrl);
  }
};

module.exports = {
  renderInsights,
  refreshPredictive
};


