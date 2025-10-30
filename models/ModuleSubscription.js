const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ACTIVE_STATUSES = ['active', 'trialing'];

const ModuleSubscription = sequelize.define('ModuleSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  module_key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  plan_interval: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'trialing', 'past_due', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  price_amount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  price_currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cancel_at_period_end: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  canceled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'module_subscriptions',
  indexes: [
    {
      name: 'idx_module_subscriptions_entity',
      fields: ['entity_id']
    },
    {
      name: 'idx_module_subscriptions_module',
      fields: ['module_key']
    },
    {
      name: 'idx_module_subscriptions_entity_module',
      fields: ['entity_id', 'module_key']
    },
    {
      name: 'idx_module_subscriptions_status_period',
      fields: ['status', 'current_period_end']
    }
  ]
});

ModuleSubscription.ACTIVE_STATUSES = ACTIVE_STATUSES;

module.exports = ModuleSubscription;

