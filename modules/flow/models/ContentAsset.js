const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const ContentAsset = sequelize.define('FlowContentAsset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'text', 'link', 'carousel', 'other'),
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'flow_content_assets',
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['type'] }
  ]
});

module.exports = ContentAsset;


