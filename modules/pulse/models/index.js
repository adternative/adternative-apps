const sequelize = require('../../../config/database');

// Import all models
const Audience = require('./Audience');
const Subscriber = require('./Subscriber');
const Campaign = require('./Campaign');
const Template = require('./Template');
const Tag = require('./Tag');

// Associations
Audience.hasMany(Subscriber, { foreignKey: 'audience_id', as: 'subscribers', onDelete: 'CASCADE' });
Subscriber.belongsTo(Audience, { foreignKey: 'audience_id', as: 'audience' });

Campaign.belongsTo(Audience, { foreignKey: 'audience_id', as: 'audience' });
Campaign.belongsTo(Template, { foreignKey: 'template_id', as: 'template' });

// M:N Subscriber <-> Tag
const SubscriberTag = sequelize.define('Pulse_SubscriberTag', {}, { tableName: 'pulse_subscriber_tags', timestamps: false });
Subscriber.belongsToMany(Tag, { through: SubscriberTag, foreignKey: 'subscriber_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Subscriber, { through: SubscriberTag, foreignKey: 'tag_id', otherKey: 'subscriber_id', as: 'subscribers' });

// Sync models
const syncDatabase = async () => {
  try {
    console.log('[PULSE] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[PULSE] Models synced');
  } catch (error) {
    console.error('[PULSE] Error syncing models:', error.message);
  }
};

// Ensure required tables exist
const ensureReady = async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.error('[PULSE] Error ensuring readiness:', e.message);
    throw e;
  }
};

module.exports = {
  sequelize,
  Audience,
  Subscriber,
  Campaign,
  Template,
  Tag,
  syncDatabase,
  ensureReady
};

