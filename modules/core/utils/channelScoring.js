const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const normalizeValue = (value, { min = 0, max = 1, flip = false } = {}) => {
  if (!Number.isFinite(value)) return 0;
  const clamped = clamp((value - min) / (max - min || 1));
  return flip ? 1 - clamped : clamped;
};

const resolveIndustryModifier = (modifiers = {}, industry) => {
  if (!industry) return 1;
  const key = String(industry).toLowerCase();
  const entry = Object.entries(modifiers).find(([label]) => label.toLowerCase() === key);
  if (!entry) return 1;
  const [, values] = entry;
  return Number.isFinite(values.conv) ? values.conv : 1;
};

const deriveGoalBias = (goal) => {
  switch (goal) {
    case 'awareness':
      return { reach: 0.45, ctr: 0.35, conversion: 0.2 };
    case 'leads':
      return { reach: 0.25, ctr: 0.35, conversion: 0.4 };
    case 'sales':
      return { reach: 0.2, ctr: 0.3, conversion: 0.5 };
    case 'conversions':
      return { reach: 0.2, ctr: 0.3, conversion: 0.5 };
    default:
      return { reach: 0.33, ctr: 0.33, conversion: 0.34 };
  }
};

const computeChannelScores = ({
  channels = [],
  entityProfile = {},
  benchmark = {},
  platformSignals = {},
  socialSignals = {},
  analytics = {}
}) => {
  const goalBias = deriveGoalBias(entityProfile.goals);
  const benchmarkMetrics = benchmark.metrics || {};

  return channels.map((channel) => {
    const platform = platformSignals[channel.name?.toLowerCase?.()] || {};
    const social = socialSignals[channel.name?.toLowerCase?.()] || {};
    const industryModifier = resolveIndustryModifier(channel.industryModifiers, entityProfile.industry);

    const efficiencyScore = normalizeValue(channel.avgCpm, { min: 4, max: 35, flip: true });
    const ctrScore = normalizeValue(channel.avgCtr, { min: 0.01, max: 0.08 });
    const conversionScore = normalizeValue(channel.avgConvRate, { min: 0.01, max: 0.1 });

    const benchmarkFit = normalizeValue(benchmarkMetrics.avg_conv_rate, { min: 0.015, max: 0.08 });
    const audienceAffinity = normalizeValue(platform.affinity || social.overlap || analytics?.audience?.match || 0.5, { min: 0, max: 1 });

    const weighted = (
      efficiencyScore * goalBias.reach +
      ctrScore * goalBias.ctr +
      conversionScore * goalBias.conversion
    );

    const composite = clamp((weighted * 0.6) + (audienceAffinity * 0.25) + (benchmarkFit * 0.15));
    const score = Math.round(composite * industryModifier * 100);

    return {
      channelId: channel.id,
      name: channel.name,
      category: channel.category,
      score,
      breakdown: {
        efficiency: Number((efficiencyScore * 100).toFixed(1)),
        engagement: Number((ctrScore * 100).toFixed(1)),
        conversion: Number((conversionScore * 100).toFixed(1)),
        audienceAffinity: Number((audienceAffinity * 100).toFixed(1)),
        benchmarkFit: Number((benchmarkFit * 100).toFixed(1))
      },
      rationale: [
        `Industry modifier ${industryModifier.toFixed(2)} applied for ${entityProfile.industry || 'general'} sector`,
        `Budget efficiency score ${(efficiencyScore * 100).toFixed(0)} vs CPM`,
        `Audience overlap ${(audienceAffinity * 100).toFixed(0)} based on platform/signal blend`
      ]
    };
  }).sort((a, b) => b.score - a.score);
};

module.exports = {
  computeChannelScores
};


