const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const AdPlacement = sequelize.define('FlowAdPlacement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ad_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform_account_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  campaign_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adset_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_ad_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'creating', 'running', 'paused', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'flow_ad_placements',
  indexes: [
    { fields: ['ad_id'] },
    { fields: ['platform_account_id'] },
    { fields: ['status'] }
  ]
});

module.exports = AdPlacement;


