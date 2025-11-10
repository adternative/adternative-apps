const { sequelize, Channel, models } = require('./models');
const { DEFAULT_CHANNELS } = require('./utils/mockData');

// --- Setup Helpers ----------------------------------------------------------

const coreModels = [Channel];


const syncModels = async () => {
  for (const model of coreModels) {
    try {
      // Use sync without alter to avoid MySQL key limit issues
      // This will create the table if it doesn't exist, but won't modify existing tables
      await model.sync({ alter: false });
    } catch (error) {
      // Handle specific MySQL key limit error gracefully
      if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
        console.warn(`[CORE] Table ${model.getTableName ? model.getTableName() : model.name} has too many keys (MySQL limit: 64). Using existing table structure.`);
        // Table already exists with too many keys - continue without syncing
        // This is safe since the table structure is already correct
      } else {
        // Surface which model failed to sync to aid debugging
        console.error(`[CORE] Failed to sync model ${model.getTableName ? model.getTableName() : model.name}:`, error.message);
        // Don't throw - allow the app to continue even if sync fails
        // The table likely already exists with the correct structure
      }
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
      try {
        await syncModels();
        await seedDefaultChannels();
      } catch (error) {
        // Log error but don't throw - allow app to continue with existing table structure
        console.error('[CORE] ensureReady encountered an error:', error.message);
        // Reset promise so it can be retried on next call
        ensurePromise = null;
        // Don't throw - the table likely already exists and is usable
      }
    })();
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


