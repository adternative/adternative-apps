const fetchYouTubeSignals = async ({ contentStrengths = [] }) => {
  const videoReady = contentStrengths.includes('video') || contentStrengths.includes('storytelling');
  return {
    platform: 'youtube_ads',
    estimatedCpm: 9.2,
    estimatedCpc: 2.05,
    affinity: videoReady ? 0.74 : 0.5,
    conversionLift: videoReady ? 0.033 : 0.024,
    reachPotential: 0.68
  };
};

module.exports = {
  fetchYouTubeSignals
};


