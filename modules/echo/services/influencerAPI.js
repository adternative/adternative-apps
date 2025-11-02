const axios = require('axios');
const { influencers: mockInfluencers } = require('../utils/mockData');
const { computeAudienceOverlap, normalizeTopicList } = require('../utils/scoring');

const API_URL = process.env.ECHO_INFLUENCER_API_URL;
const API_KEY = process.env.ECHO_INFLUENCER_API_KEY;

const safeGet = (obj, path, fallback) => {
  try {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj) ?? fallback;
  } catch (_) {
    return fallback;
  }
};

const normalizeInfluencer = (payload) => ({
  id: payload.id,
  name: payload.name,
  handle: payload.handle,
  profileImage: payload.profileImage,
  bio: payload.bio,
  contactEmail: payload.contactEmail,
  country: payload.country,
  language: payload.language,
  topics: payload.topics || [],
  authenticityScore: payload.authenticityScore,
  averageEngagementRate: payload.averageEngagementRate,
  followersTotal: payload.followersTotal,
  estimatedReach: payload.estimatedReach,
  avgCostPerPost: payload.avgCostPerPost,
  platforms: payload.platforms || []
});

const filterInfluencers = ({
  list,
  industryTopics = [],
  region,
  language,
  minEngagement,
  audienceProfile,
  priorityPlatforms = []
}) => {
  return list.filter((influencer) => {
    if (language && influencer.language && influencer.language !== language) {
      return false;
    }

    if (region && influencer.country && influencer.country !== region) {
      return false;
    }

    if (typeof minEngagement === 'number' && influencer.averageEngagementRate < minEngagement) {
      return false;
    }

    if (industryTopics.length > 0) {
      const influencerTopics = normalizeTopicList(influencer.topics).map((topic) => topic.toLowerCase());
      const overlap = industryTopics.some((topic) => influencerTopics.includes(String(topic).toLowerCase()));
      if (!overlap) {
        return false;
      }
    }

    if (priorityPlatforms.length > 0) {
      const platforms = influencer.platforms || [];
      const hasPriority = platforms.some((platform) =>
        priorityPlatforms.includes(String(platform.platform).toLowerCase())
      );
      if (!hasPriority) {
        return false;
      }
    }

    if (audienceProfile) {
      const influencerAudience = safeGet(influencer, 'platforms[0].audienceDemographics');
      const overlapScore = computeAudienceOverlap(influencerAudience, audienceProfile);
      if (overlapScore < 0.35) {
        return false;
      }
    }

    return true;
  });
};

const fetchFromRemote = async (filters) => {
  if (!API_URL || !API_KEY) return null;

  try {
    const response = await axios.get(API_URL, {
      params: filters,
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
      timeout: 7000
    });

    const payload = Array.isArray(response.data?.influencers)
      ? response.data.influencers
      : Array.isArray(response.data)
        ? response.data
        : [];

    return payload.map(normalizeInfluencer);
  } catch (error) {
    console.warn('[ECHO] Remote influencer API failed, falling back to mock data:', error.message);
    return null;
  }
};

const fetchInfluencers = async (filters = {}) => {
  const remote = await fetchFromRemote(filters);
  if (remote && remote.length > 0) {
    return filterInfluencers({ list: remote, ...filters });
  }

  return filterInfluencers({ list: mockInfluencers.map(normalizeInfluencer), ...filters });
};

module.exports = {
  fetchInfluencers
};


