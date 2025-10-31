const { generateAiInsightMocks } = require('../utils/mockData');

const predictRankingDrops = async ({ entityId, siteId, keyword, volatility }) => {
  return {
    keyword,
    probability: Math.min(0.95, 0.35 + (volatility || 0.3)),
    drivers: [
      'SERP volatility trending upward',
      'Competitors adding fresh content'
    ],
    recommendedActions: [
      'Audit top ranking page for thin sections',
      'Add supporting FAQs to capture People Also Ask'
    ]
  };
};

const suggestContentRefresh = async ({ entityId, siteId, url, engagementDelta }) => {
  return {
    url,
    urgency: engagementDelta < -0.2 ? 'high' : 'medium',
    summary: 'Engagement decline detected — consider adding updated case studies and schema enhancements.',
    outlineIdeas: ['Highlight 2025 data', 'Embed SERP volatility chart', 'Add internal links to new playbooks']
  };
};

const recommendNewTopics = async ({ entityId, siteId, trends = [] }) => {
  const topics = trends.length ? trends : [
    { topic: 'predictive seo automation', growth: 0.38 },
    { topic: 'entity audit workflows', growth: 0.29 }
  ];
  return topics.map((item) => ({
    topic: item.topic,
    growthRate: item.growth,
    angle: 'Map to customer pains around latency and opaque insights.',
    suggestedFormat: item.topic.includes('automation') ? 'playbook' : 'case study'
  }));
};

const getMockAiInsights = ({ entityId, siteId }) => {
  return generateAiInsightMocks({ entityId, siteId });
};

module.exports = {
  predictRankingDrops,
  suggestContentRefresh,
  recommendNewTopics,
  getMockAiInsights
};


