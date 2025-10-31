const DEFAULT_CHANNELS = [
  {
    name: 'Google Ads',
    category: 'paid',
    avgCpm: 12,
    avgCpc: 1.8,
    avgCtr: 0.035,
    avgConvRate: 0.045,
    industryModifiers: {
      ecommerce: { cpm: 0.95, ctr: 1.1, conv: 1.2 },
      saas: { cpm: 1.1, ctr: 1.05, conv: 1.15 },
      healthcare: { cpm: 1.2, ctr: 0.85, conv: 0.9 }
    }
  },
  {
    name: 'Meta Ads',
    category: 'paid',
    avgCpm: 8.5,
    avgCpc: 1.2,
    avgCtr: 0.029,
    avgConvRate: 0.032,
    industryModifiers: {
      ecommerce: { cpm: 0.9, ctr: 1.2, conv: 1.15 },
      saas: { cpm: 1.05, ctr: 1.05, conv: 1.05 },
      hospitality: { cpm: 0.85, ctr: 1.3, conv: 1.1 }
    }
  },
  {
    name: 'LinkedIn Ads',
    category: 'paid',
    avgCpm: 28,
    avgCpc: 6.5,
    avgCtr: 0.015,
    avgConvRate: 0.056,
    industryModifiers: {
      saas: { cpm: 1, ctr: 1.15, conv: 1.2 },
      finance: { cpm: 1.2, ctr: 1.05, conv: 1.1 }
    }
  },
  {
    name: 'TikTok Ads',
    category: 'paid',
    avgCpm: 6.2,
    avgCpc: 0.95,
    avgCtr: 0.041,
    avgConvRate: 0.028,
    industryModifiers: {
      ecommerce: { cpm: 0.85, ctr: 1.35, conv: 1.25 },
      entertainment: { cpm: 0.75, ctr: 1.5, conv: 1.2 }
    }
  },
  {
    name: 'YouTube Ads',
    category: 'paid',
    avgCpm: 9.5,
    avgCpc: 2.1,
    avgCtr: 0.021,
    avgConvRate: 0.026,
    industryModifiers: {
      education: { cpm: 0.9, ctr: 1.2, conv: 1.15 },
      ecommerce: { cpm: 1, ctr: 1.05, conv: 1.1 }
    }
  },
  {
    name: 'Email',
    category: 'owned',
    avgCpm: 4.5,
    avgCpc: 0.4,
    avgCtr: 0.065,
    avgConvRate: 0.085,
    industryModifiers: {
      saas: { cpm: 1, ctr: 1.25, conv: 1.35 },
      ecommerce: { cpm: 1.05, ctr: 1.1, conv: 1.15 }
    }
  },
  {
    name: 'SEO',
    category: 'earned',
    avgCpm: 5.2,
    avgCpc: 0.3,
    avgCtr: 0.042,
    avgConvRate: 0.061,
    industryModifiers: {
      ecommerce: { cpm: 0.95, ctr: 1.15, conv: 1.2 },
      saas: { cpm: 1, ctr: 1.05, conv: 1.1 }
    }
  },
  {
    name: 'Influencer',
    category: 'earned',
    avgCpm: 14,
    avgCpc: 2.4,
    avgCtr: 0.018,
    avgConvRate: 0.031,
    industryModifiers: {
      beauty: { cpm: 0.8, ctr: 1.45, conv: 1.4 },
      ecommerce: { cpm: 0.9, ctr: 1.3, conv: 1.25 }
    }
  }
];

const DEFAULT_BENCHMARKS = [
  {
    industry: 'ecommerce',
    source: 'Statista 2024',
    metrics: {
      avg_cpm: 11.2,
      avg_ctr: 0.032,
      avg_conv_rate: 0.042,
      reach_index: 1.15,
      awareness_index: 1.1
    }
  },
  {
    industry: 'saas',
    source: 'Gartner 2024',
    metrics: {
      avg_cpm: 18.5,
      avg_ctr: 0.024,
      avg_conv_rate: 0.051,
      reach_index: 0.9,
      awareness_index: 0.95
    }
  },
  {
    industry: 'healthcare',
    source: 'Forrester 2024',
    metrics: {
      avg_cpm: 19.7,
      avg_ctr: 0.019,
      avg_conv_rate: 0.033,
      reach_index: 0.85,
      awareness_index: 0.8
    }
  }
];

const MOCK_ANALYTICS = {
  traffic: {
    sessions: 42000,
    uniqueVisitors: 28500,
    growthRate: 0.12
  },
  audience: {
    topCountries: ['United States', 'Canada', 'United Kingdom'],
    ageRanges: [{ range: '18-24', share: 0.18 }, { range: '25-34', share: 0.36 }, { range: '35-44', share: 0.22 }],
    genderSplit: { female: 0.54, male: 0.42, other: 0.04 }
  },
  goals: {
    awareness: { weight: 0.35 },
    leads: { weight: 0.4 },
    sales: { weight: 0.25 }
  }
};

module.exports = {
  DEFAULT_CHANNELS,
  DEFAULT_BENCHMARKS,
  MOCK_ANALYTICS
};


