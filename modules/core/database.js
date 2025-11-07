const { sequelize, Channel, models } = require('./models');
const { DEFAULT_CHANNELS } = require('./utils/mockData');

// --- Setup Helpers ----------------------------------------------------------

const coreModels = [Channel];


const syncModels = async () => {
  for (const model of coreModels) {
    try {
      await model.sync({ alter: true });
    } catch (error) {
      // Surface which model failed to sync to aid debugging
      console.error(`[CORE] Failed to sync model ${model.getTableName ? model.getTableName() : model.name}:`, error);
      throw error;
    }
  }
};

const seedDefaultChannels = async () => {
  for (const channel of DEFAULT_CHANNELS) {
    await Channel.findOrCreate({
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

let ensurePromise = null;

const ensureReady = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await syncModels();
      await seedDefaultChannels();
    })().catch((error) => {
      ensurePromise = null;
      console.error('[CORE] ensureReady failed:', error);
      throw error;
    });
  }
  return ensurePromise;
};

module.exports = {
  sequelize,
  models,
  ensureReady,
  syncModels,
  seedDefaultChannels
};


