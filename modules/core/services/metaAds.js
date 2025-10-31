const fetchMetaAdsSignals = async ({ industry, audienceSize }) => {
  const demographicFit = industry === 'beauty' ? 0.78 : industry === 'ecommerce' ? 0.72 : 0.6;
  const reachPotential = audienceSize ? Math.min(1, audienceSize / 750000) : 0.55;

  return {
    platform: 'meta_ads',
    estimatedCpm: 8.1,
    estimatedCpc: 1.25,
    affinity: demographicFit,
    conversionLift: 0.034,
    reachPotential
  };
};

module.exports = {
  fetchMetaAdsSignals
};


