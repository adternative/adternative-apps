const fetchTikTokSignals = async ({ targetAge }) => {
  const genZAffinity = Array.isArray(targetAge) && targetAge.some((age) => ['18-24', '25-34'].includes(age)) ? 0.88 : 0.65;
  return {
    platform: 'tiktok_ads',
    estimatedCpm: 6.4,
    estimatedCpc: 0.98,
    affinity: genZAffinity,
    conversionLift: 0.029,
    reachPotential: 0.72
  };
};

module.exports = {
  fetchTikTokSignals
};


