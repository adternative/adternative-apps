const { createHash } = require('crypto');
const { Op } = require('sequelize');
const { models } = require('../database');

const { RankSnapshot } = models;

const deterministic = (value) => createHash('md5').update(value).digest();

const captureRankSnapshots = async ({ workspace, keywordInsights }) => {
  if (!Array.isArray(keywordInsights) || !keywordInsights.length) return [];

  const keywords = keywordInsights.map((item) => item.keyword);
  const previousSnapshots = await RankSnapshot.findAll({
    where: {
      workspaceId: workspace.id,
      keyword: { [Op.in]: keywords }
    },
    order: [['keyword', 'ASC'], ['trackedAt', 'DESC']]
  });

  const latestByKeyword = previousSnapshots.reduce((acc, snapshot) => {
    if (!acc[snapshot.keyword]) {
      acc[snapshot.keyword] = snapshot;
    }
    return acc;
  }, {});

  const rows = keywordInsights.map((insight) => {
    const hash = deterministic(`${workspace.id}:${insight.keyword}:${Date.now()}`);
    const drift = (hash[0] % 5) - 2; // -2 to +2
    const position = Math.max(1, insight.currentRank + drift);
    const previous = latestByKeyword[insight.keyword];
    const delta = previous ? previous.position - position : 0;

    return {
      workspaceId: workspace.id,
      keyword: insight.keyword,
      position,
      positionDelta: delta,
      searchVolume: insight.searchVolume,
      trackedAt: new Date()
    };
  });

  return RankSnapshot.bulkCreate(rows);
};

const getRankTimeline = async ({ workspaceId, keyword, limit = 12 }) => {
  return RankSnapshot.findAll({
    where: { workspaceId, keyword },
    order: [['trackedAt', 'DESC']],
    limit
  });
};

const summarizeRankPerformance = async ({ workspaceId }) => {
  const snapshots = await RankSnapshot.findAll({
    where: { workspaceId },
    order: [['trackedAt', 'DESC']],
    limit: 500
  });

  if (!snapshots.length) {
    return {
      trackedKeywords: 0,
      avgPosition: 0,
      improving: 0,
      declining: 0
    };
  }

  const summary = snapshots.reduce((acc, snapshot) => {
    acc.tracked.add(snapshot.keyword);
    acc.positionTotal += snapshot.position;
    acc.samples += 1;
    if (snapshot.positionDelta > 0) acc.improving += 1;
    if (snapshot.positionDelta < 0) acc.declining += 1;
    return acc;
  }, { tracked: new Set(), positionTotal: 0, samples: 0, improving: 0, declining: 0 });

  return {
    trackedKeywords: summary.tracked.size,
    avgPosition: Math.round(summary.positionTotal / Math.max(1, summary.samples)),
    improving: summary.improving,
    declining: summary.declining
  };
};

module.exports = {
  captureRankSnapshots,
  getRankTimeline,
  summarizeRankPerformance
};



