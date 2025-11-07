const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goal = sequelize.define('Goal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
      },
    demographic_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
    objective: {
        type: DataTypes.JSON,
        allowNull: false,
      defaultValue: {},
      validate: {
        objectiveShape(value) {
          if (value == null) throw new Error('objective is required');
          if (typeof value !== 'object' || Array.isArray(value)) throw new Error('objective must be an object');
          const allowedKpi = ['awareness', 'leads', 'sales', 'retention'];
          const allowedMetric = ['reach', 'impressions', 'ctr', 'cpa', 'roas', 'bounce rate'];
          if (!allowedKpi.includes(String(value.kpi))) throw new Error('objective.kpi must be a valid KPI');
          if (!allowedMetric.includes(String(value.metric))) throw new Error('objective.metric must be a valid metric');
          if (value.current_value != null && typeof value.current_value !== 'number') throw new Error('objective.current_value must be a number');
          if (typeof value.target_value !== 'number') throw new Error('objective.target_value must be a number');
          if (typeof value.budget !== 'number') throw new Error('objective.budget must be a number');
        }
      }
      },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    deadline: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'draft'
      },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
}, {
  tableName: 'goals',
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['demographic_id'] }
  ]
});

module.exports = Goal;
