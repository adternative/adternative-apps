const sequelize = require('../../../config/database');

// Sync models
const syncDatabase = async () => {
  try {
    console.log('[REVERB] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[REVERB] Models synced successfully');
  } catch (error) {
    console.error('[REVERB] Error syncing models:', error);
  }
};

// Ensure required tables exist for REVERB
const ensureReady = async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.error('[REVERB] Error ensuring readiness:', e.message);
    throw e;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  ensureReady
};

