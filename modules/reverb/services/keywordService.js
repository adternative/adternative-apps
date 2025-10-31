const axios = require('axios');
const { ensureReady, models } = require('../database');
const { generateKeywordMocks, generateSerpMock } = require('../utils/mockData');
const { calculateKeywordDifficulty } = require('../utils/score');
const { parseSerpHtml } = require('../utils/serpParser');

const keywordProviders = () => [{
  name: 'semrush',
  apiKey: process.env.SEMRUSH_API_KEY,
  endpoint: 'https://api.semrush.com'
}, {
  name: 'dataforseo',
  apiKey: process.env.DATAFORSEO_API_KEY,
  endpoint: 'https://api.dataforseo.com'
}, {
  name: 'google_ads',
  apiKey: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  endpoint: 'https://googleads.googleapis.com'
}];

const pickProvider = () => keywordProviders().find((provider) => provider.apiKey);

const fetchKeywordsFromProvider = async ({ query, provider }) => {
  if (!provider) return [];
  // Placeholder for real provider integration
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [];
};

const syncKeywords = async ({ entityId, siteId, domain, seedTopics = [], forceMock = false }) => {
  await ensureReady();
  const provider = pickProvider();
  const shouldUseMock = forceMock || !provider;

  let keywordPayloads;
  if (shouldUseMock) {
    keywordPayloads = generateKeywordMocks({ siteId });
  } else {
    const topics = seedTopics.length ? seedTopics : ['seo intelligence', domain];
    const allKeywords = await Promise.all(topics.map((topic) => fetchKeywordsFromProvider({ query: topic, provider })));
    keywordPayloads = allKeywords.flat().slice(0, 25);
  }

  const results = [];

  for (const payload of keywordPayloads) {
    const [keywordRecord] = await models.Keyword.findOrCreate({
      where: { siteId, keyword: payload.keyword },
      defaults: {
        entityId,
        siteId,
        keyword: payload.keyword,
        intent: payload.intent || 'unknown',
        location: payload.location,
        device: payload.device,
        metadata: payload.metadata || {}
      }
    });

    if (Array.isArray(payload.snapshots)) {
      for (const snapshot of payload.snapshots) {
        await models.KeywordSnapshot.findOrCreate({
          where: {
            keywordId: keywordRecord.id,
            capturedAt: snapshot.capturedAt
          },
          defaults: {
            position: snapshot.position,
            previousPosition: snapshot.previousPosition,
            volume: snapshot.volume,
            difficulty: snapshot.difficulty || calculateKeywordDifficulty({
              serpVolatility: snapshot.serpVolatility,
              avgDomainAuthority: 55,
              backlinkStrength: 50
            }),
            serpVolatility: snapshot.serpVolatility,
            ctrCurve: snapshot.ctrCurve || null,
            trafficPotential: snapshot.trafficPotential || null
          }
        });
      }
    }

    results.push(keywordRecord);
  }

  return models.Keyword.findAll({
    where: { siteId },
    include: [{ model: models.KeywordSnapshot, as: 'snapshots', limit: 10, order: [['captured_at', 'DESC']] }]
  });
};

const listKeywords = async ({ siteId, limit = 50, offset = 0 }) => {
  return models.Keyword.findAndCountAll({
    where: { siteId },
    limit,
    offset,
    order: [['updated_at', 'DESC']],
    include: [{ model: models.KeywordSnapshot, as: 'snapshots', limit: 5, order: [['captured_at', 'DESC']] }]
  });
};

const captureSerpSnapshot = async ({ keywordId }) => {
  const keywordRecord = await models.Keyword.findByPk(keywordId);
  if (!keywordRecord) throw new Error('Keyword not found');

  let snapshotPayload;
  const endpoint = 'https://www.google.com/search';

  if (process.env.REVERB_REAL_SERP === 'true') {
    const params = new URLSearchParams({ q: keywordRecord.keyword, hl: 'en', gl: 'us' });
    const { data } = await axios.get(`${endpoint}?${params.toString()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; REVERBbot/1.0)' }
    });
    const parsed = parseSerpHtml(data);
    snapshotPayload = { rawHtml: data, ...parsed };
  } else {
    const mock = generateSerpMock({ keyword: keywordRecord.keyword });
    snapshotPayload = { rawHtml: null, featureSummary: mock.featureSummary, results: mock.results };
  }

  const serpSnapshot = await models.SerpSnapshot.create({
    keywordId,
    capturedAt: snapshotPayload.capturedAt || new Date(),
    location: keywordRecord.location,
    device: keywordRecord.device,
    rawHtml: snapshotPayload.rawHtml,
    featureSummary: snapshotPayload.featureSummary
  });

  if (Array.isArray(snapshotPayload.results)) {
    await Promise.all(snapshotPayload.results.map((result) => models.SerpResult.create({
      serpSnapshotId: serpSnapshot.id,
      rank: result.rank,
      url: result.url,
      title: result.title,
      snippet: result.snippet,
      type: result.type,
      metadata: result.metadata || null
    })));
  }

  return serpSnapshot.reload({ include: [{ model: models.SerpResult, as: 'results', order: [['rank', 'ASC']] }] });
};

module.exports = {
  syncKeywords,
  listKeywords,
  captureSerpSnapshot
};


