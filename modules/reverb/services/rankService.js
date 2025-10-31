const { ensureReady, models } = require('../database');
const { generateRankHistoryMock } = require('../utils/mockData');
const { calculateVisibilityScore } = require('../utils/score');

const syncRankHistory = async ({ keywordId, forceMock = false }) => {
  await ensureReady();
  const keyword = await models.Keyword.findByPk(keywordId);
  if (!keyword) throw new Error('Keyword not found');

  const useMock = forceMock || !process.env.DATAFORSEO_API_KEY;
  const history = useMock ? generateRankHistoryMock({ keyword: keyword.keyword }) : [];

  for (const entry of history) {
    await models.RankRecord.findOrCreate({
      where: { keywordId, recordedAt: entry.recordedAt },
      defaults: {
        position: entry.position,
        url: entry.url,
        change: entry.change,
        visibilityScore: entry.visibilityScore
      }
    });
  }

  return listRankHistory({ keywordId });
};

const listRankHistory = async ({ keywordId, limit = 90 }) => {
  const records = await models.RankRecord.findAll({
    where: { keywordId },
    order: [['recorded_at', 'DESC']],
    limit
  });
  const visibility = calculateVisibilityScore(records.map((r) => r.toJSON()));
  return { records, visibility };
};

module.exports = {
  syncRankHistory,
  listRankHistory
};


