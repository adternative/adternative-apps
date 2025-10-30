const sequelize = require('../../../config/database');
const { Entity } = require('../../../models');

// Import all models
const Sentiment = require('./Sentiment');

// Associations
Entity.hasMany(Sentiment, { foreignKey: 'entity_id', as: 'sentiments', onDelete: 'CASCADE' });
Sentiment.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });

// Sync models
const syncDatabase = async () => {
  try {
    console.log('[CORE] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[CORE] Models synced successfully');
  } catch (error) {
    console.error('[CORE] Error syncing models:', error);
  }
};

// Ensure required tables exist for CORE
const ensureReady = async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.error('[CORE] Error ensuring readiness:', e.message);
    throw e;
  }
};

module.exports = {
  sequelize,
  Sentiment,
  syncDatabase,
  ensureReady
};

