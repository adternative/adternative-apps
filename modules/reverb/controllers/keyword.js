const path = require('path');
const { resolveSite } = require('./helpers');
const { syncKeywords, listKeywords, captureSerpSnapshot } = require('../services/keywordService');
const { syncRankHistory, listRankHistory } = require('../services/rankService');
const { models } = require('../database');

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

const parseTopics = (body) => {
  if (!body) return [];
  if (Array.isArray(body.topics)) return body.topics;
  if (body.topics && typeof body.topics === 'string') {
    return body.topics.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return [];
};

const renderKeywords = async (req, res) => {
  try {
    const { site } = await resolveSite(req);
    const limit = Number(req.query.limit) || 50;
    const keywordsData = await listKeywords({ siteId: site.id, limit });

    res.render(path.join(__dirname, '..', 'views', 'keywords.pug'), {
      title: 'REVERB • Keywords',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      keywords: keywordsData.rows,
      total: keywordsData.count,
      limit,
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

const refreshKeywords = async (req, res) => {
  try {
    const { site, entityId, domain } = await resolveSite(req);
    const seedTopics = parseTopics(req.body);
    const useMock = parseMockFlag(req.body && req.body.mock);
    const keywords = await syncKeywords({ entityId, siteId: site.id, domain, seedTopics, forceMock: useMock });

    if (wantsJson(req)) {
      res.json({ success: true, keywords });
      return;
    }

    const message = seedTopics.length
      ? 'Keyword topics refreshed using ' + seedTopics.join(', ')
      : 'Keywords refreshed for ' + site.domain;
    res.redirect('/reverb/keywords?status=success&message=' + encodeURIComponent(message));
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.redirect('/reverb/keywords?status=error&message=' + encodeURIComponent(error.message));
  }
};

const captureSerp = async (req, res) => {
  try {
    const { site } = await resolveSite(req);
    const keywordId = Number(req.params.keywordId);
    if (!keywordId) throw new Error('Keyword not found');

    const keywordRecord = await models.Keyword.findOne({ where: { id: keywordId, siteId: site.id } });
    if (!keywordRecord) throw new Error('Keyword not found for this site');

    const snapshot = await captureSerpSnapshot({ keywordId });

    if (wantsJson(req)) {
      res.json({ success: true, snapshot });
      return;
    }

    res.redirect('/reverb/keywords/' + keywordId + '/rank-history?status=success&message=' + encodeURIComponent('SERP snapshot captured.'));
  } catch (error) {
    if (wantsJson(req)) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    const keywordId = Number(req.params.keywordId) || '';
    const redirectPath = keywordId ? '/reverb/keywords/' + keywordId + '/rank-history' : '/reverb/keywords';
    res.redirect(redirectPath + '?status=error&message=' + encodeURIComponent(error.message));
  }
};

const renderRankHistory = async (req, res) => {
  try {
    const { site } = await resolveSite(req);
    const keywordId = Number(req.params.keywordId);
    if (!keywordId) throw new Error('Keyword not found');
    const keyword = await models.Keyword.findOne({
      where: { id: keywordId, siteId: site.id },
      include: [{ model: models.KeywordSnapshot, as: 'snapshots', limit: 1, order: [['captured_at', 'DESC']] }]
    });
    if (!keyword) throw new Error('Keyword not found for this site');

    if (req.query && req.query.sync === 'true') {
      await syncRankHistory({ keywordId, forceMock: true });
    }

    const history = await listRankHistory({ keywordId });

    res.render(path.join(__dirname, '..', 'views', 'rank-history.pug'), {
      title: 'REVERB • Rank History',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps,
      site,
      keyword,
      history,
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

module.exports = {
  renderKeywords,
  refreshKeywords,
  captureSerp,
  renderRankHistory
};


