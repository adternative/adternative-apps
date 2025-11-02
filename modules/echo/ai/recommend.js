const formatPlatformSummary = (influencers = []) => {
  const platformTotals = influencers.reduce((acc, influencer) => {
    for (const platform of influencer.platforms || []) {
      acc[platform.platform] = (acc[platform.platform] || 0) + (platform.followers || 0);
    }
    return acc;
  }, {});

  return Object.entries(platformTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([platform, followers]) => `${platform} (~${Math.round(followers / 1000)}k followers)`)
    .join(', ');
};

const toSentenceList = (handles = []) => {
  if (!handles.length) return '';
  if (handles.length === 1) return handles[0];
  return `${handles.slice(0, -1).join(', ')} and ${handles.slice(-1)[0]}`;
};

const humanizeGoals = (goals = []) => {
  if (!Array.isArray(goals) || goals.length === 0) return '';
  return ` focused on ${goals.join(', ')}`;
};

const generateRecommendations = ({ entity, influencers = [], filters = {} }) => {
  if (!entity) {
    return {
      summary: 'Unable to generate recommendations without entity context.',
      highlights: []
    };
  }

  const topInfluencers = influencers.slice(0, 3);
  const handles = topInfluencers.map((inf) => `@${inf.handle}`);
  const combinedReach = topInfluencers.reduce((acc, inf) => acc + (inf.estimatedReach || 0), 0);
  const totalReachLabel = combinedReach > 0 ? `${(combinedReach / 1_000_000).toFixed(1)}M` : 'under 1M';

  const goalsSummary = humanizeGoals(filters.goals);
  const summary = `For ${entity.name || 'your brand'}${goalsSummary}, the top creators are ${toSentenceList(
    handles
  )}, bringing a combined reach of ${totalReachLabel} and engagement rates above ${Math.round(
    (topInfluencers[0]?.averageEngagementRate || 0.04) * 100
  )}%.`;

  const platformSummary = formatPlatformSummary(topInfluencers);
  const topInsight = topInfluencers[0]
    ? `@${topInfluencers[0].handle} leads with a fit score of ${topInfluencers[0].fitScore} and strong ${
        (topInfluencers[0].platforms?.[0]?.platform || 'multi-platform')
      } performance.`
    : 'Not enough influencer data yet to highlight a clear leader.';

  const highlights = [
    topInsight,
    platformSummary ? `Channels to prioritize: ${platformSummary}.` : null,
    filters.region ? `Audience alignment optimized for ${filters.region}.` : null
  ].filter(Boolean);

  return {
    summary,
    highlights
  };
};

module.exports = {
  generateRecommendations
};


