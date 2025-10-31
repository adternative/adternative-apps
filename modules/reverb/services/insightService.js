const { ensureReady, models } = require('../database');
const { getMockAiInsights, predictRankingDrops, suggestContentRefresh, recommendNewTopics } = require('../ai/insights');

const listAiInsights = async ({ entityId, siteId }) => {
  await ensureReady();
  const existing = await models.AiInsight.findAll({
    where: { entityId, siteId },
    order: [['generated_at', 'DESC']]
  });

  if (existing.length) return existing;

  const mocks = getMockAiInsights({ entityId, siteId });
  const created = await models.AiInsight.bulkCreate(mocks, { returning: true });
  return created;
};

const getPredictiveSummary = async ({ entityId, siteId, keyword, url }) => {
  const [ranking, refresh, topics] = await Promise.all([
    predictRankingDrops({ entityId, siteId, keyword, volatility: 0.34 }),
    suggestContentRefresh({ entityId, siteId, url, engagementDelta: -0.27 }),
    recommendNewTopics({ entityId, siteId })
  ]);

  return {
    ranking,
    refresh,
    topics
  };
};

module.exports = {
  listAiInsights,
  getPredictiveSummary
};


