const sequelize = require('../../../config/database');

// Sync models
const syncDatabase = async () => {
  try {
    console.log('[ECHO] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[ECHO] Models synced successfully');
  } catch (error) {
    console.error('[ECHO] Error syncing models:', error);
  }
};

// Ensure required tables exist for ECHO
const ensureReady = async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.error('[ECHO] Error ensuring readiness:', e.message);
    throw e;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  ensureReady
};

