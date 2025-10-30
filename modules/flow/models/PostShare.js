const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const PostShare = sequelize.define('FlowPostShare', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform_account_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'publishing', 'published', 'failed'),
    defaultValue: 'pending'
  },
  external_post_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'flow_post_shares',
  indexes: [
    { fields: ['post_id'] },
    { fields: ['platform_account_id'] },
    { fields: ['status'] }
  ]
});

module.exports = PostShare;


