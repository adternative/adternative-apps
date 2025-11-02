const path = require('path');
const { getAvailableApps } = require('../../../utils/appLoader');
const { getMatchesForEntity } = require('../database');

const MATCHES_VIEW = path.join(__dirname, '..', 'views', 'matches.pug');

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

const normalizeMatches = (records = []) => {
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

const listMatches = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const matches = entity ? await getMatchesForEntity({ entityId: entity.id }) : [];
    const normalized = normalizeMatches(matches);
    const feedback = {
      status: req.query?.status || (entity ? null : 'error'),
      message: req.query?.message || (entity ? null : 'Select or create an entity to view matches.')
    };

    res.render(MATCHES_VIEW, {
      title: 'ECHO • Matches',
      user: req.user,
      currentEntity: toPlain(entity),
      appName: 'ECHO',
      availableApps: req.availableApps || getAvailableApps(),
      matches: normalized,
      feedback
    });
  } catch (error) {
    next(error);
  }
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
};

const exportMatches = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    if (!entity) {
      const message = encodeURIComponent('Select or create an entity before exporting matches.');
      return res.redirect(`/echo/matches?status=error&message=${message}`);
    }
    const matches = await getMatchesForEntity({ entityId: entity.id });
    const normalized = normalizeMatches(matches);

    const header = ['Influencer Name', 'Handle', 'Email', 'Platforms', 'Fit Score', 'Favourite', 'Engagement Rate', 'Estimated Reach', 'Rationale'];
    const rows = normalized.map((match) => {
      const influencer = match.influencer || {};
      const engagement = typeof match.engagement === 'number'
        ? (match.engagement * 100).toFixed(2) + '%'
        : '';
      const reach = typeof match.reach === 'number' ? match.reach : '';
      return [
        influencer.name || '',
        influencer.handle || '',
        influencer.contactEmail || '',
        match.platforms.join(', '),
        typeof match.score === 'number' ? match.score : '',
        match.isFavorite ? 'yes' : 'no',
        engagement,
        reach,
        match.rationale || ''
      ].map(escapeCsv).join(',');
    });

    const csvContent = [header.map(escapeCsv).join(','), ...rows].join('\n');
    const filename = `echo-matches-${entity.id}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMatches,
  exportMatches
};


