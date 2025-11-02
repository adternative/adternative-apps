const path = require('path');

const { getAvailableApps } = require('../../../utils/appLoader');
const { ensureReady, getMatchesForEntity } = require('../database');
const { discoverInfluencersForEntity, buildFiltersFromRequest } = require('./discovery');

const DASHBOARD_VIEW = path.join(__dirname, '..', 'views', 'index.pug');

const toPlain = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
};

const ensureEntity = (req) => {
  if (req.currentEntity) return req.currentEntity;
  const error = new Error('No entity selected');
  error.status = 400;
  throw error;
};

const renderDashboard = async (req, res, next) => {
  try {
    const entity = ensureEntity(req);
    await ensureReady();

    const filters = buildFiltersFromRequest(req);
    const discovery = await discoverInfluencersForEntity({ entity, filters, persist: true });

    const matches = await getMatchesForEntity({ entityId: entity.id });
    const favorites = matches.filter((match) => match.isFavorite).map(toPlain);

    const section = (req.query?.section || req.body?.section || req.path.replace('/','') || '').toLowerCase();
    const activeSection = ['matches', 'favorites'].includes(section) ? section : 'discovery';
    const feedback = {
      status: req.query?.status || null,
      message: req.query?.message || null
    };

    res.render(DASHBOARD_VIEW, {
      title: 'ECHO • Influencer Intelligence',
      user: req.user,
      currentEntity: toPlain(entity),
      appName: 'ECHO',
      availableApps: req.availableApps || getAvailableApps(),
      discovery,
      matches: matches.map(toPlain),
      favorites,
      filters: discovery.filters,
      ai: discovery.ai,
      section: activeSection,
      feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderDashboard
};


