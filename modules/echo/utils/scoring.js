const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeScore = (value, min = 0, max = 1) => {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
};

const normalizeTopicList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(/[,;|]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof input === 'object') {
    return Object.values(input)
      .flatMap((value) => normalizeTopicList(value))
      .filter(Boolean);
  }
  return [];
};

const computeTopicSimilarity = (brandTopics = [], influencerTopics = []) => {
  const normalizedBrandTopics = normalizeTopicList(brandTopics).map((topic) => topic.toLowerCase());
  const normalizedInfluencerTopics = normalizeTopicList(influencerTopics).map((topic) => topic.toLowerCase());

  if (!normalizedBrandTopics.length || !normalizedInfluencerTopics.length) {
    return 0.5; // neutral baseline when we lack data
  }

  const brandSet = new Set(normalizedBrandTopics);
  const influencerSet = new Set(normalizedInfluencerTopics);

  const intersection = [...brandSet].filter((topic) => influencerSet.has(topic));
  const similarity = intersection.length / Math.max(brandSet.size, 1);

  return clamp(similarity, 0, 1);
};

const computeAudienceOverlap = (influencerAudience = {}, brandAudience = {}) => {
  const scoreForDimension = (dimensionKey) => {
    const influencerBreakdown = influencerAudience?.[dimensionKey];
    const brandBreakdown = brandAudience?.[dimensionKey];
    if (!influencerBreakdown || !brandBreakdown) return 0.5;

    const influencerKeys = Object.keys(influencerBreakdown);
    if (influencerKeys.length === 0) return 0.5;

    let overlap = 0;
    for (const key of influencerKeys) {
      const influencerWeight = influencerBreakdown[key];
      const brandWeight = brandBreakdown[key];
      if (typeof influencerWeight !== 'number' || typeof brandWeight !== 'number') continue;
      overlap += Math.min(influencerWeight, brandWeight);
    }

    return clamp(overlap / 100, 0, 1);
  };

  const genderScore = scoreForDimension('gender');
  const ageScore = scoreForDimension('age');
  const locationScore = scoreForDimension('location');

  // Weighted towards age/location to reflect campaign targeting
  return clamp(genderScore * 0.25 + ageScore * 0.35 + locationScore * 0.4, 0, 1);
};

const computeEngagementAuthenticityScore = ({ engagementRate, authenticityScore }) => {
  const normalizedEngagement = normalizeScore(engagementRate, 0.01, 0.08); // 1% - 8%
  const normalizedAuthenticity = typeof authenticityScore === 'number' ? clamp(authenticityScore, 0, 1) : 0.6;
  return clamp(normalizedEngagement * 0.6 + normalizedAuthenticity * 0.4, 0, 1);
};

const computePlatformPerformance = (platforms = []) => {
  if (!platforms.length) return 0.4;

  const scores = platforms.map((platform) => {
    const followers = platform.followers || 0;
    const avgViews = platform.avgViews || 0;
    if (!followers) return 0.5;
    const ratio = avgViews / followers;
    return clamp(ratio, 0, 1);
  });

  const sum = scores.reduce((acc, val) => acc + val, 0);
  return clamp(sum / scores.length, 0, 1);
};

const computeCostEfficiency = ({ estimatedReach, avgCostPerPost }) => {
  if (!estimatedReach || !avgCostPerPost) return 0.5;
  const cpm = (avgCostPerPost / Math.max(estimatedReach, 1)) * 1000;
  // Normalize cpm: good if below $25, bad if above $120
  return clamp(normalizeScore(120 - cpm, 0, 120), 0, 1);
};

const computeInfluencerFitScore = ({
  influencer,
  brandTopics = [],
  audienceProfile,
  priorityPlatforms = []
}) => {
  if (!influencer) return { score: 0, breakdown: {} };

  const topicSimilarity = computeTopicSimilarity(brandTopics, influencer.topics || []);

  const primaryPlatformAudience = influencer.platforms && influencer.platforms.length
    ? influencer.platforms[0].audienceDemographics
    : null;

  const audienceOverlap = computeAudienceOverlap(primaryPlatformAudience, audienceProfile);

  const engagementAuthenticity = computeEngagementAuthenticityScore({
    engagementRate: influencer.averageEngagementRate,
    authenticityScore: influencer.authenticityScore
  });

  let platformPerformance = computePlatformPerformance(influencer.platforms);
  if (priorityPlatforms.length > 0) {
    const preferred = (influencer.platforms || []).filter((p) =>
      priorityPlatforms.includes(String(p.platform).toLowerCase())
    );
    if (preferred.length) {
      platformPerformance = computePlatformPerformance(preferred) * 0.6 + platformPerformance * 0.4;
    }
  }

  const costEfficiency = computeCostEfficiency({
    estimatedReach: influencer.estimatedReach,
    avgCostPerPost: influencer.avgCostPerPost
  });

  const weightedScore =
    topicSimilarity * 0.4 +
    audienceOverlap * 0.25 +
    engagementAuthenticity * 0.2 +
    platformPerformance * 0.1 +
    costEfficiency * 0.05;

  return {
    score: Math.round(clamp(weightedScore, 0, 1) * 100),
    breakdown: {
      topicSimilarity,
      audienceOverlap,
      engagementAuthenticity,
      platformPerformance,
      costEfficiency
    }
  };
};

module.exports = {
  computeInfluencerFitScore,
  computeAudienceOverlap,
  computePlatformPerformance,
  computeTopicSimilarity,
  normalizeScore,
  normalizeTopicList
};


