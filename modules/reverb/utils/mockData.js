const sampleDates = (days = 7) => {
  const now = new Date();
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - idx);
    d.setHours(12, 0, 0, 0);
    return d;
  }).reverse();
};

const generateSiteAuditMock = ({ domain }) => {
  const pages = [
    {
      url: `https://${domain}/`,
      statusCode: 200,
      meta: {
        title: 'Home - REVERB Demo',
        description: 'Welcome to the REVERB SEO intelligence sandbox.'
      },
      headings: { h1: ['REVERB Intelligence'], h2: ['Overview'] },
      schema: { type: 'WebPage', properties: { name: 'Home' } },
      lighthouseMetrics: { performance: 0.82, accessibility: 0.94, seo: 0.88 },
      issues: {
        warnings: ['Meta description slightly long'],
        opportunities: ['Add FAQ schema']
      }
    },
    {
      url: `https://${domain}/blog` ,
      statusCode: 200,
      meta: {
        title: 'Blog - REVERB Demo',
        description: 'Latest updates on SEO intelligence.'
      },
      headings: { h1: ['SEO Intelligence Blog'], h2: ['Latest posts'] },
      schema: { type: 'Blog', properties: { name: 'Reverb Blog' } },
      lighthouseMetrics: { performance: 0.74, accessibility: 0.9, seo: 0.86 },
      issues: {
        warnings: ['Image missing alt attribute'],
        errors: ['Broken internal link detected /blog/404']
      }
    },
    {
      url: `https://${domain}/pricing`,
      statusCode: 301,
      redirectTarget: `https://${domain}/plans`,
      lighthouseMetrics: { performance: 0.69, accessibility: 0.85, seo: 0.8 },
      issues: {
        warnings: ['301 redirect in sitemap'],
        opportunities: ['Consolidate duplicate content']
      }
    }
  ];

  const totals = {
    crawledPages: pages.length,
    brokenLinks: 2,
    redirectChains: 1,
    metaIssues: 1,
    schemaItems: 2,
    imagesMissingAlt: 3
  };

  return {
    summary: totals,
    pages,
    lighthouse: {
      performance: 0.78,
      accessibility: 0.9,
      seo: 0.87,
      bestPractices: 0.88
    },
    issues: {
      critical: ['Broken internal links found on /blog'],
      warnings: ['Structured data coverage < 60%'],
      recommendations: [
        'Prioritize fixing 2 broken links to avoid ranking loss.',
        'Add FAQ schema to / to capture People Also Ask features.'
      ]
    }
  };
};

const generateKeywordMocks = ({ siteId }) => {
  const keywords = [
    {
      keyword: 'seo intelligence platform',
      intent: 'commercial',
      location: 'United States',
      device: 'desktop',
      snapshots: sampleDates(14).map((date, idx) => ({
        capturedAt: date,
        position: 8 - Math.min(idx, 5),
        previousPosition: 10 - Math.min(idx + 1, 5),
        volume: 1600,
        difficulty: 48,
        serpVolatility: 0.32,
        trafficPotential: 480
      }))
    },
    {
      keyword: 'seo dashboard tool',
      intent: 'commercial',
      location: 'United States',
      device: 'desktop',
      snapshots: sampleDates(14).map((date, idx) => ({
        capturedAt: date,
        position: 14 - Math.min(idx, 6),
        previousPosition: 16 - Math.min(idx + 1, 6),
        volume: 2200,
        difficulty: 55,
        serpVolatility: 0.41,
        trafficPotential: 360
      }))
    },
    {
      keyword: 'content decay analysis',
      intent: 'informational',
      location: 'United States',
      device: 'desktop',
      snapshots: sampleDates(14).map((date, idx) => ({
        capturedAt: date,
        position: 6 + Math.min(idx, 4),
        previousPosition: 5 + Math.min(idx + 1, 4),
        volume: 900,
        difficulty: 38,
        serpVolatility: 0.22,
        trafficPotential: 190
      }))
    }
  ];

  return keywords.map((item, index) => ({
    id: index + 1,
    siteId,
    ...item
  }));
};

const generateSerpMock = ({ keyword }) => {
  const base = ['Example.io', 'DemoLabs.com', 'SearchInsights.ai', 'RankMaster.pro', 'KeywordGenius.app'];
  return {
    capturedAt: new Date(),
    featureSummary: {
      topStories: false,
      peopleAlsoAsk: true,
      faqs: keyword.includes('content'),
      video: keyword.includes('tool')
    },
    results: base.map((domain, idx) => ({
      rank: idx + 1,
      url: `https://${domain.toLowerCase()}/${keyword.replace(/\s+/g, '-')}`,
      title: `${domain} on ${keyword}`,
      snippet: 'Actionable insights and detailed analysis to outrank competitors.',
      type: idx === 0 ? 'organic' : 'organic'
    }))
  };
};

const generateBacklinkMocks = ({ siteId }) => {
  const sources = [
    'https://marketingweekly.com/reverb-strategy',
    'https://growthstories.co/seo-platforms',
    'https://producthunt.com/posts/reverb',
    'https://medium.com/@searchgeek/reverb-review'
  ];

  return sources.map((sourceUrl, idx) => ({
    id: idx + 1,
    siteId,
    sourceUrl,
    targetUrl: idx % 2 ? 'https://reverb-demo.com/features' : 'https://reverb-demo.com/blog/seo-intelligence',
    anchorText: idx % 2 ? 'advanced seo insights' : 'REVERB intelligence engine',
    rel: idx === 2 ? 'nofollow' : 'dofollow',
    metrics: {
      domainAuthority: 60 - idx * 4,
      pageAuthority: 52 - idx * 3,
      spamScore: 2 + idx
    },
    history: sampleDates(6).map((date, hIdx) => ({
      capturedAt: date,
      status: hIdx === 5 && idx === 1 ? 'lost' : 'active',
      domainAuthority: 60 - idx * 4 + hIdx,
      pageAuthority: 50 - idx * 2 + hIdx / 2,
      backlinkVelocity: 3 + idx
    }))
  }));
};

const generateCompetitorMocks = ({ siteId }) => {
  const competitors = ['insightmatters.io', 'rankcraft.ai', 'velocityseo.com'];
  return competitors.map((domain, idx) => ({
    id: idx + 1,
    siteId,
    domain,
    keywordOverlap: 62 - idx * 7,
    backlinkOverlap: 48 - idx * 5,
    contentGap: [
      {
        topic: 'Predictive SEO workflows',
        opportunityScore: 78 - idx * 6,
        difficulty: 42 + idx * 4
      },
      {
        topic: 'Entity-based auditing',
        opportunityScore: 72 - idx * 5,
        difficulty: 38 + idx * 5
      }
    ]
  }));
};

const generateRankHistoryMock = ({ keyword }) => {
  return sampleDates(30).map((date, idx) => ({
    recordedAt: date,
    position: Math.max(1, 12 - Math.floor(idx / 3)),
    visibilityScore: 72 + Math.sin(idx / 5) * 5,
    url: `https://reverb-demo.com/${keyword.replace(/\s+/g, '-')}`,
    change: idx === 0 ? 0 : Math.floor(Math.random() * 3) - 1
  }));
};

const generateEventMocks = ({ entityId, siteId }) => {
  const dates = sampleDates(6);
  return [
    {
      entityId,
      siteId,
      type: 'algorithm_update',
      title: 'Google Core Update',
      occurredAt: dates[1],
      metadata: { impact: 'medium', note: 'SERP volatility spiked 21%.' }
    },
    {
      entityId,
      siteId,
      type: 'content_refresh',
      title: 'Refreshed /blog/seo-intelligence',
      occurredAt: dates[2],
      metadata: { author: 'SEO Team', change: '+3 positions' }
    },
    {
      entityId,
      siteId,
      type: 'backlink_spike',
      title: 'Backlink velocity increase',
      occurredAt: dates[4],
      metadata: { newLinks: 12, referringDomains: 6 }
    }
  ];
};

const generateAiInsightMocks = ({ entityId, siteId }) => ([
  {
    entityId,
    siteId,
    category: 'rank_drop_risk',
    summary: 'Keywords tied to “seo dashboard tool” show rising volatility and likely need content depth updates.',
    confidence: 0.68,
    metadata: { keyword: 'seo dashboard tool', recommendedAction: 'Expand use-cases section and add social proof.' }
  },
  {
    entityId,
    siteId,
    category: 'content_refresh',
    summary: 'Refresh evergreen guide “Content Decay Analysis” — engagement down 27% in GA4 and new competitors emerged.',
    confidence: 0.74,
    metadata: { url: '/blog/content-decay-analysis', priority: 'high' }
  },
  {
    entityId,
    siteId,
    category: 'new_topic',
    summary: 'Emerging topic cluster: “predictive seo automation” with low competition but increasing search demand.',
    confidence: 0.61,
    metadata: { suggestedOutline: ['Automation benefits', 'Workflow templates', 'Case studies'] }
  }
]);

module.exports = {
  generateSiteAuditMock,
  generateKeywordMocks,
  generateSerpMock,
  generateBacklinkMocks,
  generateCompetitorMocks,
  generateRankHistoryMock,
  generateEventMocks,
  generateAiInsightMocks
};


