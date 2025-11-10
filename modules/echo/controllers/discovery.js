const { computeInfluencerFitScore, normalizeTopicList } = require('../utils/scoring');
const { ensureReady } = require('../database');
const { Influencer } = require('../models');

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};



// Provide a neutral default audience profile when none is supplied.
// Returning null lets downstream scoring treat audience overlap as neutral (0.5).
const defaultAudienceProfile = (_filters) => {
  return null;
};

const buildAudienceProfileFromDemographic = (demographic) => {
  if (!demographic || typeof demographic !== 'object') return null;
  const profile = {};
  // Gender is ENUM on Demographic; do not convert to numeric distributions.
  // Leave profile.gender unset to keep gender overlap neutral in scoring.
  const ageRange = demographic.age_range || demographic.ageRange;
  const buckets = ['18-24', '25-34', '35-44', '45-54', '55+'];
  if (ageRange && typeof ageRange.min === 'number' && typeof ageRange.max === 'number') {
    const { min, max } = ageRange;
    const weights = {};
    for (const bucket of buckets) {
      const parts = bucket.split('-');
      const bMin = parts[0] === '55+' ? 55 : parseInt(parts[0], 10);
      const bMax = parts[1] ? parseInt(parts[1], 10) : 120;
      const overlap = Math.max(0, Math.min(max, bMax) - Math.max(min, bMin));
      weights[bucket] = overlap > 0 ? overlap : 0;
    }
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    profile.age = Object.fromEntries(buckets.map((b) => [b, Math.round((weights[b] / total) * 100)]));
  }
  const location = demographic.location || {};
  if (location && (location.country || location.city)) {
    const key = (location.country || location.city || 'Other').replace(/\s+/g, '');
    profile.location = { [key]: 70, Other: 30 };
  }
  return profile;
};

const topicsFromGoal = (goal) => {
  if (!goal || typeof goal !== 'object') return [];
  const topics = [];
  const name = goal.name || '';
  const objective = goal.objective || {};
  const kpi = String(objective.kpi || '').toLowerCase();
  const metric = String(objective.metric || '').toLowerCase();
  if (name) topics.push(name);
  if (kpi) {
    topics.push(kpi);
    if (kpi === 'awareness') topics.push('branding', 'reach', 'viral', 'top of funnel');
    if (kpi === 'leads') topics.push('lead gen', 'webinars', 'email signup', 'landing pages');
    if (kpi === 'sales') topics.push('product review', 'unboxing', 'discount code', 'affiliate');
    if (kpi === 'retention') topics.push('loyalty', 'community', 'education', 'how-to');
  }
  if (metric) {
    topics.push(metric);
    if (metric === 'ctr') topics.push('call to action', 'link in bio');
    if (metric === 'roas') topics.push('paid social', 'performance', 'conversion');
    if (metric === 'cpa') topics.push('offer', 'trial', 'signup');
  }
  return topics;
};

const buildFiltersFromRequest = (req) => {
  const body = req.body || {};
  const query = req.query || {};
  const src = { ...query, ...body };
  const minEngagement = src.minEngagement ? Number(src.minEngagement) / (String(src.minEngagement).includes('%') ? 100 : 1) : null;
  const priorityPlatforms = parseArray(src.platforms || src.priorityPlatforms).map((v) => v.toLowerCase());
  const goals = parseArray(src.goals);
  let audienceProfile = src.audienceProfile || src.audience;
  if (typeof audienceProfile === 'string') {
    try { audienceProfile = JSON.parse(audienceProfile); } catch (_) { audienceProfile = null; }
  }
  return { minEngagement, goals, priorityPlatforms, audienceProfile };
};

const discoverInfluencersForEntity = async ({ entity, filters, selectedGoal, selectedDemographic }) => {
  await ensureReady();
  const normalizedFilters = { ...filters };
  const demographicProfile = buildAudienceProfileFromDemographic(selectedDemographic);
  if (!normalizedFilters.audienceProfile) {
    normalizedFilters.audienceProfile = demographicProfile || defaultAudienceProfile(normalizedFilters);
  } else if (demographicProfile) {
    normalizedFilters.audienceProfile = demographicProfile;
  }

  // Build brand topics from available signals (no external services)
  const industryTopics = normalizeTopicList(entity?.industry || []);
  const goalTopics = topicsFromGoal(selectedGoal);
  const demographicTopics = Array.isArray(selectedDemographic?.interests) ? selectedDemographic.interests : [];
  const brandTopics = [
    ...industryTopics,
    ...normalizeTopicList(goalTopics),
    ...normalizeTopicList(demographicTopics)
  ].filter(Boolean);

  const all = await Influencer.findAll();
  const influencers = Array.isArray(all) ? all.map((m) => m.get({ plain: true })) : [];

  const scored = influencers.map((inf) => {
    const { score, breakdown } = computeInfluencerFitScore({
      influencer: inf,
      brandTopics,
      audienceProfile: normalizedFilters.audienceProfile,
      priorityPlatforms: normalizedFilters.priorityPlatforms || []
    });
    return { ...inf, fitScore: score, scoreBreakdown: breakdown };
  });

  scored.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
  return { influencers: scored, filters: normalizedFilters, ai: null };
};

module.exports = {
  buildFiltersFromRequest,
  discoverInfluencersForEntity,
  topicsFromGoal,
  buildAudienceProfileFromDemographic
};


