const axios = require('axios');

const SOCIAL_PATTERNS = {
  instagram: /instagram\.com\/(?!explore)([A-Za-z0-9_.]+)/i,
  facebook: /facebook\.com\/([A-Za-z0-9_.]+)/i,
  linkedin: /linkedin\.com\/(company|in)\/([A-Za-z0-9_.-]+)/i,
  twitter: /twitter\.com\/([A-Za-z0-9_]+)/i,
  tiktok: /tiktok\.com\/@([A-Za-z0-9_.]+)/i,
  youtube: /youtube\.com\/(channel|c|user)\/([A-Za-z0-9_.-]+)/i
};

const fetchFollowerEstimate = async (platform, handle) => {
  // Placeholder: integrate individual platform APIs later.
  return {
    platform,
    handle,
    followers: Math.round(5000 + Math.random() * 50000),
    lastSyncedAt: new Date().toISOString()
  };
};

const discoverSocialProfiles = async (website) => {
  if (!website) return {};
  try {
    const response = await axios.get(website, { timeout: 3500 });
    const html = typeof response.data === 'string' ? response.data : String(response.data || '');
    const matches = {};

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      const result = html.match(pattern);
      if (result) {
        matches[platform] = result.slice(1).filter(Boolean)[0];
      }
    }

    return matches;
  } catch (error) {
    console.warn('[CORE] Failed to scan social profiles:', error.message);
    return {};
  }
};

const fetchSocialSignals = async ({ website, socialProfiles = {} }) => {
  const discoveredProfiles = await discoverSocialProfiles(website);
  const combined = { ...discoveredProfiles, ...socialProfiles };

  const results = {};
  for (const [platform, handle] of Object.entries(combined)) {
    results[platform.toLowerCase()] = await fetchFollowerEstimate(platform, handle);
  }

  return results;
};

module.exports = {
  fetchSocialSignals,
  discoverSocialProfiles
};


