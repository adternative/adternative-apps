const cron = require('node-cron');

const { refreshBenchmarksFromSource } = require('../services/benchmarks');

const BENCHMARK_SOURCES = [
  {
    industry: 'ecommerce',
    endpoint: process.env.CORE_BENCHMARK_ECOMMERCE_URL,
    apiKey: process.env.CORE_BENCHMARK_ECOMMERCE_KEY
  },
  {
    industry: 'saas',
    endpoint: process.env.CORE_BENCHMARK_SAAS_URL,
    apiKey: process.env.CORE_BENCHMARK_SAAS_KEY
  }
];

const runRefresh = async () => {
  const results = [];
  for (const source of BENCHMARK_SOURCES) {
    if (!source.endpoint) continue;
    try {
      const payload = await refreshBenchmarksFromSource(source);
      results.push({ industry: source.industry, status: 'ok', payload });
    } catch (error) {
      results.push({ industry: source.industry, status: 'failed', error: error.message });
    }
  }
  return results;
};

const scheduleBenchmarkRefresh = () => {
  const cronExpr = process.env.CORE_BENCHMARK_CRON || '0 6 * * 1';
  return cron.schedule(cronExpr, () => {
    runRefresh()
      .then((output) => {
        console.log('[CORE] Benchmark refresh complete:', JSON.stringify(output));
      })
      .catch((error) => {
        console.error('[CORE] Benchmark refresh failed:', error.message);
      });
  }, {
    timezone: process.env.CORE_TIMEZONE || 'UTC'
  });
};

module.exports = {
  runRefresh,
  scheduleBenchmarkRefresh
};


