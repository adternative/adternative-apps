const { fetchGoogleAdsSignals } = require('./googleAds');
const { fetchMetaAdsSignals } = require('./metaAds');
const { fetchLinkedInSignals } = require('./linkedinAds');
const { fetchTikTokSignals } = require('./tiktokAds');
const { fetchYouTubeSignals } = require('./youtubeAds');

const normaliseKey = (value) => String(value || '').toLowerCase().replace(/\s+/g, '_');

const fetchPlatformSignals = async ({ entityProfile, analytics = {} }) => {
  const industry = normaliseKey(entityProfile.industry);
  const totalBudget = Number(entityProfile.budgetRangeMax || entityProfile.budgetRangeMin || 0);
  const audienceSize = analytics?.traffic?.sessions || 50000;
  const targetAge = Array.isArray(entityProfile?.targetAudience?.ageRanges)
    ? entityProfile.targetAudience.ageRanges
    : analytics?.audience?.ageRanges?.map(({ range }) => range) || [];

  const [google, meta, linkedin, tiktok, youtube] = await Promise.all([
    fetchGoogleAdsSignals({ industry, budget: totalBudget }),
    fetchMetaAdsSignals({ industry, audienceSize }),
    fetchLinkedInSignals({ industry, dealSize: entityProfile?.avgDealSize }),
    fetchTikTokSignals({ targetAge }),
    fetchYouTubeSignals({ contentStrengths: entityProfile?.contentStrengths || [] })
  ]);

  const signals = [google, meta, linkedin, tiktok, youtube].reduce((acc, entry) => {
    if (!entry?.platform) return acc;
    acc[entry.platform] = entry;
    return acc;
  }, {});

  return signals;
};

module.exports = {
  fetchPlatformSignals
};


