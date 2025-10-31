const { ensureReady, models } = require('../database');
const { fetchBenchmarksForIndustry } = require('../services/benchmarks');
const { fetchSocialSignals } = require('../services/socialScan');
const { fetchPlatformSignals } = require('../services/platformSignals');
const { computeChannelScores } = require('../utils/channelScoring');
const { calculateBudgetDistribution, projectOutcomes } = require('../utils/budgetMath');
const { generateRecommendations } = require('../ai/recommend');

const { CoreChannel, CoreRecommendation } = models;

const toPlain = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
};

const indexChannelsById = (channels) => {
  return channels.reduce((acc, channel) => {
    acc[channel.id] = channel;
    return acc;
  }, {});
};

const runRecommendationEngine = async ({ coreEntity, analytics }) => {
  await ensureReady();
  const entity = toPlain(coreEntity);
  const channels = (await CoreChannel.findAll()).map((item) => item.get({ plain: true }));
  const channelLookup = indexChannelsById(channels);

  const [benchmark, socialSignals, platformSignals] = await Promise.all([
    fetchBenchmarksForIndustry(entity.industry),
    fetchSocialSignals({ website: entity.website, socialProfiles: entity.socialProfiles }),
    fetchPlatformSignals({ entityProfile: entity, analytics })
  ]);

  const channelScores = computeChannelScores({
    channels,
    entityProfile: entity,
    benchmark,
    socialSignals,
    platformSignals,
    analytics
  });

  const allocation = calculateBudgetDistribution(channelScores, {
    minBudget: entity.budgetRangeMin || 0,
    maxBudget: entity.budgetRangeMax || (entity.budgetRangeMin ? entity.budgetRangeMin * 1.4 : 0)
  });

  const outcomes = projectOutcomes(allocation, (channelId) => channelLookup[channelId], benchmark || {});

  const aiNarrative = await generateRecommendations({
    entityProfile: entity,
    topChannels: channelScores.slice(0, 5),
    allocation,
    outcomes
  });

  const recommendation = await CoreRecommendation.create({
    entityId: entity.id,
    recommendedChannels: channelScores.slice(0, 5),
    suggestedBudgets: allocation,
    estimatedOutcomes: outcomes,
    aiNarrative
  });

  return {
    recommendation: recommendation.get({ plain: true }),
    scores: channelScores,
    allocation,
    outcomes,
    benchmark,
    socialSignals,
    platformSignals,
    aiNarrative
  };
};

const getLatestRecommendation = async (entityId) => {
  await ensureReady();
  const record = await CoreRecommendation.findOne({
    where: { entityId },
    order: [['generated_at', 'DESC']]
  });
  return record ? record.get({ plain: true }) : null;
};

module.exports = {
  runRecommendationEngine,
  getLatestRecommendation
};


