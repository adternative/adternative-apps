const fetchGoogleAdsSignals = async ({ industry, budget }) => {
  const multiplier = industry === 'saas' ? 1.15 : industry === 'ecommerce' ? 1.05 : 1;
  return {
    platform: 'google_ads',
    estimatedCpm: 11.5 * multiplier,
    estimatedCpc: 1.9 * multiplier,
    affinity: 0.62 * multiplier,
    conversionLift: 0.045 * multiplier,
    budgetUtilization: budget ? Math.min(1, budget / 50000) : 0.4
  };
};

module.exports = {
  fetchGoogleAdsSignals
};


