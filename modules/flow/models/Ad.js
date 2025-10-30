const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Ad = sequelize.define('FlowAd', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  objective: {
    type: DataTypes.STRING,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed'),
    defaultValue: 'draft'
  },
  creative: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  targeting: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'flow_ads',
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['status'] },
    { fields: ['start_date'] }
  ]
});

module.exports = Ad;


