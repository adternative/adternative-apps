const { createHash } = require('crypto');
const { Op } = require('sequelize');
const { models } = require('../database');
const { normalizeHostname } = require('./workspace');

const { KeywordInsight } = models;

const INTENTS = ['informational', 'navigational', 'commercial', 'transactional'];

const slugify = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const deterministicMetrics = (keyword, hostname) => {
  const hash = createHash('sha1').update(`${hostname}:${keyword.toLowerCase()}`).digest();
  const searchVolume = 200 + (hash[1] % 180) * 50; // 200 - 9,200 range
  const difficulty = 5 + (hash[2] % 86); // 5-90
  const opportunityBase = 100 - difficulty;
  const intent = INTENTS[hash[3] % INTENTS.length];
  const rank = (hash[4] % 40) + 1; // 1-40
  const opportunityScore = Math.max(1, Math.min(100, Math.round(opportunityBase * 0.7 + (40 - rank) * 1.5 + (hash[5] % 10))));
  const rankingUrl = `https://${hostname}/${slugify(keyword)}`;

  return {
    searchVolume,
    difficulty,
    intent,
    opportunityScore,
    currentRank: rank,
    rankingUrl
  };
};

const deriveSeedKeywords = ({ entity, hostname }) => {
  const set = new Set();

  if (entity?.industry) {
    set.add(entity.industry);
    set.add(`${entity.industry} services`);
  }

  if (entity?.name) {
    const nameKeyword = entity.name.replace(/[^a-z0-9]+/gi, ' ').trim();
    if (nameKeyword) {
      set.add(nameKeyword);
      set.add(`${nameKeyword} review`);
    }
  }

  if (entity?.region) {
    set.add(`${entity.industry || 'brand'} ${entity.region}`.trim());
  }

  const targetAudience = entity?.targetAudience || {};
  const interests = Array.isArray(targetAudience.interests) ? targetAudience.interests : [];
  interests.forEach((interest) => {
    if (typeof interest === 'string' && interest.trim()) {
      set.add(`${interest.trim()} solutions`);
    }
  });

  set.add(`${hostname} pricing`);
  set.add(`${hostname} alternatives`);

  return Array.from(set).filter(Boolean).slice(0, 24);
};

const refreshKeywordInsights = async ({ entity, workspace, hostname, keywords }) => {
  const normalizedHostname = hostname || workspace.primaryDomain;
  const host = normalizeHostname(normalizedHostname);
  const seedKeywords = Array.from(new Set([...(keywords || []), ...deriveSeedKeywords({ entity, hostname: host })]));

  if (!seedKeywords.length) return [];

  const records = seedKeywords.map((keyword) => {
    const metrics = deterministicMetrics(keyword, host);
    return {
      workspaceId: workspace.id,
      keyword,
      ...metrics,
      lastUpdatedAt: new Date()
    };
  });

  await KeywordInsight.bulkCreate(records, {
    updateOnDuplicate: [
      'search_volume',
      'difficulty',
      'intent',
      'opportunity_score',
      'current_rank',
      'ranking_url',
      'last_updated_at',
      'updated_at'
    ]
  });

  return KeywordInsight.findAll({
    where: {
      workspaceId: workspace.id,
      keyword: { [Op.in]: seedKeywords }
    },
    order: [['opportunityScore', 'DESC']]
  });
};

const getKeywordInsights = async ({ workspaceId, limit = 20, orderBy = 'opportunityScore' }) => {
  const safeOrder = ['opportunityScore', 'searchVolume', 'difficulty', 'currentRank'].includes(orderBy)
    ? orderBy
    : 'opportunityScore';

  return KeywordInsight.findAll({
    where: { workspaceId },
    order: [[safeOrder, safeOrder === 'difficulty' ? 'ASC' : 'DESC']],
    limit
  });
};

const summarizeKeywordPerformance = async ({ workspaceId }) => {
  const keywords = await KeywordInsight.findAll({ where: { workspaceId } });
  if (!keywords.length) {
    return {
      totalTracked: 0,
      averageDifficulty: 0,
      averageOpportunity: 0,
      topOpportunity: null
    };
  }

  const totals = keywords.reduce((acc, keyword) => {
    acc.difficulty += keyword.difficulty;
    acc.opportunity += keyword.opportunityScore;
    acc.total += 1;
    if (!acc.top || keyword.opportunityScore > acc.top.opportunityScore) {
      acc.top = keyword;
    }
    return acc;
  }, { difficulty: 0, opportunity: 0, total: 0, top: null });

  return {
    totalTracked: totals.total,
    averageDifficulty: Math.round(totals.difficulty / totals.total),
    averageOpportunity: Math.round(totals.opportunity / totals.total),
    topOpportunity: totals.top
  };
};

module.exports = {
  refreshKeywordInsights,
  getKeywordInsights,
  summarizeKeywordPerformance,
  deriveSeedKeywords
};



