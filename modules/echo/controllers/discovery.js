const { fetchInfluencers } = require('../services/influencerAPI');
const { getRelevantTopicsForIndustry } = require('../services/industryMatch');
const { computeInfluencerFitScore } = require('../utils/scoring');
const { upsertInfluencerWithPlatforms, recordMatches } = require('../database');
const { generateRecommendations } = require('../ai/recommend');

const ensureEntity = (req) => {
  if (req.currentEntity) return req.currentEntity;
  const error = new Error('No active entity selected');
  error.status = 400;
  throw error;
};

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const defaultAudienceProfile = ({ region, language }) => {
  const profile = {};
  if (region) {
    profile.location = { [region.replace(/\s+/g, '')]: 60, Other: 40 };
  }
  if (language) {
    profile.language = { [language]: 70, other: 30 };
  }
  profile.gender = { female: 50, male: 50 };
  profile.age = { '18-24': 30, '25-34': 40, '35-44': 20, other: 10 };
  return profile;
};

const buildFiltersFromRequest = (req) => {
  const body = req.body || {};
  const query = req.query || {};
  const src = { ...query, ...body };

  const region = src.region || src.country || null;
  const language = src.language || src.locale || null;
  const minEngagement = src.minEngagement ? Number(src.minEngagement) : null;
  const priorityPlatforms = parseArray(src.platforms || src.priorityPlatforms).map((value) =>
    value.toLowerCase()
  );
  const goals = parseArray(src.goals);

  let audienceProfile = src.audienceProfile || src.audience;
  if (typeof audienceProfile === 'string') {
    try {
      audienceProfile = JSON.parse(audienceProfile);
    } catch (error) {
      audienceProfile = null;
    }
  }

  return {
    region,
    language,
    minEngagement,
    goals,
    priorityPlatforms,
    audienceProfile
  };
};

const discoverInfluencersForEntity = async ({ entity, filters, persist = true }) => {
  const normalizedFilters = { ...filters };
  if (!normalizedFilters.audienceProfile) {
    normalizedFilters.audienceProfile = defaultAudienceProfile(normalizedFilters);
  }

  const industryTopics = getRelevantTopicsForIndustry(entity.industry);

  const influencers = await fetchInfluencers({
    industryTopics,
    region: normalizedFilters.region,
    language: normalizedFilters.language,
    minEngagement: normalizedFilters.minEngagement,
    priorityPlatforms: normalizedFilters.priorityPlatforms,
    audienceProfile: normalizedFilters.audienceProfile
  });

  const scored = [];
  for (const influencer of influencers) {
    let persistedRecord = null;
    if (persist) {
      persistedRecord = await upsertInfluencerWithPlatforms(influencer);
    }

    const baseRecord = persistedRecord && typeof persistedRecord.get === 'function'
      ? persistedRecord.get({ plain: true })
      : persistedRecord || influencer;

    const { score, breakdown } = computeInfluencerFitScore({
      influencer: baseRecord,
      brandTopics: industryTopics,
      audienceProfile: normalizedFilters.audienceProfile,
      priorityPlatforms: normalizedFilters.priorityPlatforms
    });

    const enriched = {
      ...baseRecord,
      fitScore: score,
      scoreBreakdown: breakdown
    };

    scored.push(enriched);
  }

  scored.sort((a, b) => b.fitScore - a.fitScore);

  const topMatches = scored.slice(0, 10);

  if (persist && topMatches.length > 0) {
    await recordMatches({
      entityId: entity.id,
      matches: topMatches.map((match) => ({
        influencerId: match.id,
        score: match.fitScore,
        rationale: `High topic match (${Math.round(
          match.scoreBreakdown.topicSimilarity * 100
        )}%), audience overlap ${Math.round(match.scoreBreakdown.audienceOverlap * 100)}%.`,
        isFavorite: false
      }))
    });
  }

  const aiBundle = generateRecommendations({
    entity,
    influencers: scored.slice(0, 3),
    filters: normalizedFilters
  });

  return {
    influencers: scored,
    filters: normalizedFilters,
    ai: aiBundle
  };
};

module.exports = {
  buildFiltersFromRequest,
  discoverInfluencersForEntity
};


