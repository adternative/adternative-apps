const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Campaign = sequelize.define('Pulse_Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  audience_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  template_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'failed'),
    defaultValue: 'draft'
  },
  scheduled_for: {
    type: DataTypes.DATE
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'pulse_campaigns',
  timestamps: false,
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['audience_id'] },
    { fields: ['template_id'] }
  ]
});

module.exports = Campaign;


