const path = require('path');
const { getAvailableApps } = require('../../../utils/appLoader');
const { toggleFavorite, getMatchesForEntity } = require('../database');

const FAVORITES_VIEW = path.join(__dirname, '..', 'views', 'favorites.pug');

const ensureEntity = (req) => {
  if (req.currentEntity) return req.currentEntity;
  const error = new Error('No entity selected');
  error.status = 400;
  throw error;
};

const toPlain = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
};

const normalizeFavorites = (records = []) => {
  return records.map((record) => {
    const plain = toPlain(record) || {};
    const influencer = toPlain(plain.influencer) || {};
    const platforms = Array.isArray(influencer.platforms)
      ? influencer.platforms.map((platform) => platform.platform || '').filter(Boolean)
      : [];

    const engagement = typeof influencer.averageEngagementRate === 'number'
      ? influencer.averageEngagementRate
      : null;
    const reach = typeof influencer.estimatedReach === 'number'
      ? influencer.estimatedReach
      : (typeof influencer.followersTotal === 'number' ? influencer.followersTotal : null);

    return {
      ...plain,
      influencer,
      platforms,
      engagement,
      reach
    };
  });
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
};

const toggleFavoriteHandler = async (req, res, next) => {
  try {
    const entity = ensureEntity(req);
    const influencerId = Number(req.params.influencerId || req.body.influencerId);
    if (!influencerId) {
      throw new Error('Invalid influencer ID');
    }

    const isFavorite = req.body.isFavorite ?? req.body.favorite ?? req.query.isFavorite;
    const normalized = typeof isFavorite === 'string' ? isFavorite === 'true' : Boolean(isFavorite);

    await toggleFavorite({ entityId: entity.id, influencerId, isFavorite: normalized });

    const redirectTo = req.body.redirectTo || req.get('referer') || '/echo/favorites';
    const safeRedirect = redirectTo.startsWith('/echo') ? redirectTo : '/echo/favorites';
    res.redirect(safeRedirect);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      next(error);
      return;
    }
    const message = encodeURIComponent(error.message || 'Unable to update favorite');
    res.redirect(`/echo/favorites?status=error&message=${message}`);
  }
};

const listFavorites = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const records = entity
      ? await getMatchesForEntity({ entityId: entity.id, onlyFavorites: true })
      : [];
    const normalized = normalizeFavorites(records);
    const feedback = {
      status: req.query?.status || (entity ? null : 'error'),
      message: req.query?.message || (entity ? null : 'Select or create an entity to manage favourites.')
    };

    res.render(FAVORITES_VIEW, {
      title: 'ECHO • Favorites',
      user: req.user,
      currentEntity: toPlain(entity),
      appName: 'ECHO',
      availableApps: req.availableApps || getAvailableApps(),
      favorites: normalized,
      feedback
    });
  } catch (error) {
    next(error);
  }
};

const exportFavorites = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    if (!entity) {
      const message = encodeURIComponent('Select or create an entity before exporting favourites.');
      return res.redirect(`/echo/favorites?status=error&message=${message}`);
    }
    const records = await getMatchesForEntity({ entityId: entity.id, onlyFavorites: true });
    const normalized = normalizeFavorites(records);

    const header = ['Influencer Name', 'Handle', 'Email', 'Platforms', 'Fit Score', 'Engagement Rate', 'Estimated Reach', 'Rationale'];
    const rows = normalized.map((favorite) => {
      const influencer = favorite.influencer || {};
      const engagement = typeof favorite.engagement === 'number'
        ? (favorite.engagement * 100).toFixed(2) + '%'
        : '';
      const reach = typeof favorite.reach === 'number' ? favorite.reach : '';
      return [
        influencer.name || '',
        influencer.handle || '',
        influencer.contactEmail || '',
        favorite.platforms.join(', '),
        typeof favorite.score === 'number' ? favorite.score : '',
        engagement,
        reach,
        favorite.rationale || ''
      ].map(escapeCsv).join(',');
    });

    const csvContent = [header.map(escapeCsv).join(','), ...rows].join('\n');
    const filename = `echo-favorites-${entity.id}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFavoriteHandler,
  listFavorites,
  exportFavorites
};


