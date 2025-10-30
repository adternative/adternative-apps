const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const PlatformAccount = sequelize.define('FlowPlatformAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'google', 'youtube'),
    allowNull: false
  },
  account_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  account_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'flow_platform_accounts',
  indexes: [
    { fields: ['entity_id'] },
    { unique: true, fields: ['entity_id', 'platform', 'account_id'] }
  ]
});

module.exports = PlatformAccount;


