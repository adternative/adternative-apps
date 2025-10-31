const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const calculateTechnicalHealthScore = ({
  totals = {},
  lighthouse = {},
  penalties = {}
}) => {
  const pages = totals.crawledPages || 0;
  const brokenLinks = totals.brokenLinks || 0;
  const redirectChains = totals.redirectChains || 0;
  const metaIssues = totals.metaIssues || 0;
  const schemaItems = totals.schemaItems || 0;
  const imagesMissingAlt = totals.imagesMissingAlt || 0;

  const performance = (lighthouse.performance ?? 0.75) * 100;
  const accessibility = (lighthouse.accessibility ?? 0.9) * 100;
  const seo = (lighthouse.seo ?? 0.85) * 100;

  const baseScore = (performance * 0.35) + (accessibility * 0.1) + (seo * 0.35) + 20;

  const brokenPenalty = (brokenLinks / Math.max(pages, 1)) * 45;
  const redirectPenalty = redirectChains * 4;
  const metaPenalty = metaIssues * 3;
  const accessibilityPenalty = Math.min(imagesMissingAlt, 10) * 2.5;
  const schemaBonus = schemaItems > pages * 0.4 ? 6 : -4;

  const penaltyExtras = Object.values(penalties).reduce((acc, value) => acc + (value || 0), 0);

  const score = baseScore - brokenPenalty - redirectPenalty - metaPenalty - accessibilityPenalty + schemaBonus - penaltyExtras;
  return Number(clamp(score).toFixed(2));
};

const calculateKeywordDifficulty = ({
  serpVolatility = 0.3,
  avgDomainAuthority = 55,
  backlinkStrength = 50
}) => {
  const volatilityFactor = serpVolatility * 45;
  const authorityFactor = (avgDomainAuthority / 100) * 35;
  const backlinkFactor = (backlinkStrength / 100) * 20;
  return Number(clamp(volatilityFactor + authorityFactor + backlinkFactor).toFixed(2));
};

const aggregateBacklinkVelocity = (snapshots = []) => {
  if (!snapshots.length) return { velocity: 0, trend: 'flat' };
  const sorted = [...snapshots].sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const velocity = ((last.domainAuthority || 0) - (first.domainAuthority || 0)) / Math.max(sorted.length - 1, 1);
  const trend = velocity > 0 ? 'up' : velocity < 0 ? 'down' : 'flat';
  return { velocity: Number(velocity.toFixed(2)), trend };
};

const calculateVisibilityScore = (records = []) => {
  if (!records.length) return 0;
  const total = records.reduce((sum, record) => sum + (record.visibilityScore || 0), 0);
  return Number((total / records.length).toFixed(2));
};

module.exports = {
  calculateTechnicalHealthScore,
  calculateKeywordDifficulty,
  aggregateBacklinkVelocity,
  calculateVisibilityScore
};


