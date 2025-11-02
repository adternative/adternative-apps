const { industryTopicMap } = require('../utils/mockData');

const fallbackTopics = ['brand storytelling', 'community', 'growth marketing'];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const getRelevantTopicsForIndustry = (industry) => {
  const key = normalizeKey(industry);
  if (!key) return fallbackTopics;

  const topics = industryTopicMap[key];
  if (Array.isArray(topics) && topics.length > 0) {
    return topics;
  }

  return fallbackTopics;
};

module.exports = {
  getRelevantTopicsForIndustry
};


