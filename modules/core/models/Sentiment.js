const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../../../config/database');

const Sentiment = sequelize.define('Sentiment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Foreign key to entities table'
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['twitter', 'reddit', 'facebook', 'instagram', 'linkedin']]
    }
  },
  posts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of posts scanned'
  },
  positive: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of positive sentiment posts'
  },
  neutral: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of neutral sentiment posts'
  },
  negative: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of negative sentiment posts'
  },
  score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: -1,
      max: 1
    },
    comment: 'Sentiment score from -1 (very negative) to +1 (very positive)'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'low',
    comment: 'Reputation risk level based on sentiment'
  },
  collectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when sentiment data was collected'
  }
}, {
  tableName: 'core_sentiments',
  indexes: [
    {
      fields: ['entity_id']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['riskLevel']
    },
    {
      fields: ['collectedAt']
    },
    {
      fields: ['entity_id', 'collectedAt']
    }
  ],
});

module.exports = Sentiment;

