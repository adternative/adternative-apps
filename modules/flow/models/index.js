const sequelize = require('../../../config/database');
const { Entity } = require('../../../models');

// Import all models
const PlatformAccount = require('./PlatformAccount');
const Post = require('./Post');
const PostShare = require('./PostShare');
const Ad = require('./Ad');
const AdPlacement = require('./AdPlacement');
const ContentAsset = require('./ContentAsset');

// Define associations
const defineAssociations = () => {
  // Entity relations
  Entity.hasMany(PlatformAccount, { foreignKey: 'entity_id', as: 'platformAccounts', onDelete: 'CASCADE' });
  PlatformAccount.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });

  Entity.hasMany(Post, { foreignKey: 'entity_id', as: 'posts', onDelete: 'CASCADE' });
  Post.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });

  Entity.hasMany(Ad, { foreignKey: 'entity_id', as: 'ads', onDelete: 'CASCADE' });
  Ad.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });

  Entity.hasMany(ContentAsset, { foreignKey: 'entity_id', as: 'assets', onDelete: 'CASCADE' });
  ContentAsset.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });

  // Post shares
  Post.hasMany(PostShare, { foreignKey: 'post_id', as: 'shares', onDelete: 'CASCADE' });
  PostShare.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

  PlatformAccount.hasMany(PostShare, { foreignKey: 'platform_account_id', as: 'postShares', onDelete: 'CASCADE' });
  PostShare.belongsTo(PlatformAccount, { foreignKey: 'platform_account_id', as: 'platformAccount' });

  // Ad placements
  Ad.hasMany(AdPlacement, { foreignKey: 'ad_id', as: 'placements', onDelete: 'CASCADE' });
  AdPlacement.belongsTo(Ad, { foreignKey: 'ad_id', as: 'ad' });

  PlatformAccount.hasMany(AdPlacement, { foreignKey: 'platform_account_id', as: 'adPlacements', onDelete: 'CASCADE' });
  AdPlacement.belongsTo(PlatformAccount, { foreignKey: 'platform_account_id', as: 'platformAccount' });
};

defineAssociations();

// Sync models
const syncDatabase = async () => {
  try {
    console.log('[FLOW] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[FLOW] Database synced');
  } catch (error) {
    console.error('[FLOW] Database sync error:', error.message);
  }
};

// Ensure required tables exist for FLOW
const ensureReady = async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.error('[FLOW] Error ensuring readiness:', e.message);
    throw e;
  }
};

module.exports = {
  sequelize,
  PlatformAccount,
  Post,
  PostShare,
  Ad,
  AdPlacement,
  ContentAsset,
  syncDatabase,
  ensureReady,
  Models: { PlatformAccount, Post, PostShare, Ad, AdPlacement, ContentAsset }
};

