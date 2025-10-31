const fetchLinkedInSignals = async ({ industry, dealSize }) => {
  const b2bIndustries = ['saas', 'finance', 'professional services'];
  const affinity = b2bIndustries.includes(String(industry || '').toLowerCase()) ? 0.82 : 0.55;
  const conversionLift = dealSize && dealSize > 25000 ? 0.075 : 0.058;

  return {
    platform: 'linkedin_ads',
    estimatedCpm: 29.5,
    estimatedCpc: 6.8,
    affinity,
    conversionLift,
    reachPotential: 0.35
  };
};

module.exports = {
  fetchLinkedInSignals
};


