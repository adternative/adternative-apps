const { sequelize, CoreEntity, CoreChannel, CoreBenchmark, CoreRecommendation, models } = require('./models');
const { DEFAULT_CHANNELS, DEFAULT_BENCHMARKS } = require('./utils/mockData');

// --- Setup Helpers ----------------------------------------------------------

const coreModels = [CoreEntity, CoreChannel, CoreBenchmark, CoreRecommendation];

const syncCoreModels = async ({ alter = true } = {}) => {
  const options = alter ? { alter: true } : {};
  for (const model of coreModels) {
    await model.sync(options);
  }
};

const seedDefaultChannels = async () => {
  for (const channel of DEFAULT_CHANNELS) {
    await CoreChannel.findOrCreate({
      where: { name: channel.name },
      defaults: {
        category: channel.category,
        avgCpm: channel.avgCpm,
        avgCpc: channel.avgCpc,
        avgCtr: channel.avgCtr,
        avgConvRate: channel.avgConvRate,
        industryModifiers: channel.industryModifiers
      }
    });
  }
};

const seedDefaultBenchmarks = async () => {
  for (const benchmark of DEFAULT_BENCHMARKS) {
    await CoreBenchmark.upsert({
      industry: benchmark.industry,
      source: benchmark.source,
      metrics: benchmark.metrics,
      updatedAt: benchmark.updatedAt || new Date()
    });
  }
};

let ensurePromise = null;

const ensureReady = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await syncCoreModels({ alter: true });
      await Promise.all([seedDefaultChannels(), seedDefaultBenchmarks()]);
    })().catch((error) => {
      ensurePromise = null;
      console.error('[CORE] ensureReady failed:', error.message);
      throw error;
    });
  }
  return ensurePromise;
};

module.exports = {
  sequelize,
  models,
  ensureReady,
  syncCoreModels,
  seedDefaultChannels,
  seedDefaultBenchmarks
};


