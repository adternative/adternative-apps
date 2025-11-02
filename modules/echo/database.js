const { Op } = require('sequelize');
const {
  sequelize,
  models: { Influencer, InfluencerPlatform, Match },
  applyAssociations
} = require('./models');

applyAssociations();

const echoModels = [Influencer, InfluencerPlatform, Match];

const syncEchoModels = async ({ alter = true } = {}) => {
  const options = alter ? { alter: true } : {};
  for (const model of echoModels) {
    await model.sync(options);
  }
};

let ensurePromise = null;

const ensureReady = async () => {
  if (!ensurePromise) {
    ensurePromise = syncEchoModels({ alter: true }).catch((error) => {
      ensurePromise = null;
      console.error('[ECHO] ensureReady failed:', error.message);
      throw error;
    });
  }
  return ensurePromise;
};

const upsertInfluencerWithPlatforms = async ({ platforms = [], ...influencerData }) => {
  const identifier = influencerData.id
    ? { id: influencerData.id }
    : influencerData.handle
      ? { handle: influencerData.handle }
      : null;

  let influencer = identifier
    ? await Influencer.findOne({ where: identifier })
    : null;

  if (influencer) {
    await influencer.update(influencerData);
  } else {
    influencer = await Influencer.create(influencerData);
  }

  if (Array.isArray(platforms) && platforms.length > 0) {
    for (const platformRow of platforms) {
      const { platform } = platformRow;
      if (!platform) continue;

      const [platformInstance, created] = await InfluencerPlatform.findOrCreate({
        where: { influencerId: influencer.id, platform },
        defaults: { ...platformRow, influencerId: influencer.id }
      });

      if (!created) {
        await platformInstance.update(platformRow);
      }
    }
  }

  return Influencer.findByPk(influencer.id, {
    include: [{ model: InfluencerPlatform, as: 'platforms' }]
  });
};

const getInfluencersForFilters = async ({ topics, country, language, minEngagement }) => {
  const where = {};

  if (country) {
    where.country = country;
  }

  if (language) {
    where.language = language;
  }

  if (typeof minEngagement === 'number') {
    where.averageEngagementRate = { [Op.gte]: minEngagement };
  }

  const influencers = await Influencer.findAll({
    where,
    include: [{ model: InfluencerPlatform, as: 'platforms' }]
  });

  if (!topics || topics.length === 0) {
    return influencers;
  }

  const normalizedTopics = topics.map((topic) => String(topic).toLowerCase());

  return influencers.filter((influencer) => {
    const influencerTopics = Array.isArray(influencer.topics) ? influencer.topics : [];
    return influencerTopics.some((topic) => normalizedTopics.includes(String(topic).toLowerCase()));
  });
};

const recordMatches = async ({ entityId, matches }) => {
  if (!entityId || !Array.isArray(matches)) {
    throw new Error('entityId and matches array are required');
  }

  const results = [];
  for (const match of matches) {
    let record = await Match.findOne({
      where: { entityId, influencerId: match.influencerId }
    });

    if (record) {
      await record.update({
        score: match.score,
        rationale: match.rationale,
        isFavorite: Boolean(match.isFavorite)
      });
    } else {
      record = await Match.create({
        entityId,
        influencerId: match.influencerId,
        score: match.score,
        rationale: match.rationale,
        isFavorite: Boolean(match.isFavorite)
      });
    }

    results.push(record);
  }
  return results;
};

const toggleFavorite = async ({ entityId, influencerId, isFavorite }) => {
  const match = await Match.findOne({ where: { entityId, influencerId } });
  if (!match) {
    throw new Error('Match not found for entity/influencer');
  }
  match.isFavorite = Boolean(isFavorite);
  await match.save();
  return match;
};

const getMatchesForEntity = async ({ entityId, onlyFavorites = false }) => {
  if (!entityId) throw new Error('entityId is required');

  const where = { entityId };
  if (onlyFavorites) {
    where.isFavorite = true;
  }

  return Match.findAll({
    where,
    include: [{ model: Influencer, as: 'influencer', include: [{ model: InfluencerPlatform, as: 'platforms' }] }],
    order: [['score', 'DESC']]
  });
};

module.exports = {
  sequelize,
  models: {
    Influencer,
    InfluencerPlatform,
    Match
  },
  ensureReady,
  syncDatabase: syncEchoModels,
  syncEchoModels,
  upsertInfluencerWithPlatforms,
  getInfluencersForFilters,
  recordMatches,
  toggleFavorite,
  getMatchesForEntity
};


