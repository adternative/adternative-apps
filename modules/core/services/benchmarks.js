const axios = require('axios');
const { ensureReady, models } = require('../database');
const { DEFAULT_BENCHMARKS } = require('../utils/mockData');

const { CoreBenchmark } = models;

const benchmarkCache = new Map();

const toKey = (industry) => String(industry || 'general').toLowerCase();

const fetchBenchmarksForIndustry = async (industry) => {
  await ensureReady();
  const key = toKey(industry);
  if (benchmarkCache.has(key)) {
    return benchmarkCache.get(key);
  }

  let record = await CoreBenchmark.findOne({ where: { industry: key } });

  if (!record) {
    const fallback = DEFAULT_BENCHMARKS.find((item) => toKey(item.industry) === key) || DEFAULT_BENCHMARKS[0];
    if (fallback) {
      record = await CoreBenchmark.create({
        industry: key,
        source: fallback.source,
        metrics: fallback.metrics,
        updatedAt: fallback.updatedAt || new Date()
      });
    }
  }

  benchmarkCache.set(key, record?.toJSON() || null);
  return benchmarkCache.get(key);
};

const refreshBenchmarksFromSource = async ({ industry, endpoint, apiKey }) => {
  if (!industry || !endpoint) {
    throw new Error('Industry and endpoint are required to refresh benchmarks');
  }

  await ensureReady();
  try {
    const response = await axios.get(endpoint, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      timeout: 5000
    });

    const metrics = response.data?.metrics || {};
    const payload = {
      industry: toKey(industry),
      source: response.data?.source || endpoint,
      metrics,
      updatedAt: new Date()
    };

    await CoreBenchmark.upsert(payload);
    benchmarkCache.set(payload.industry, payload);
    return payload;
  } catch (error) {
    console.warn('[CORE] Failed to refresh benchmarks from source:', error.message);
    const fallback = await fetchBenchmarksForIndustry(industry);
    return fallback;
  }
};

const listBenchmarks = async () => {
  await ensureReady();
  const records = await CoreBenchmark.findAll({ order: [['industry', 'ASC']] });
  return records.map((record) => record.toJSON());
};

module.exports = {
  fetchBenchmarksForIndustry,
  refreshBenchmarksFromSource,
  listBenchmarks
};


