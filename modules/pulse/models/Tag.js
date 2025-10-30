const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Tag = sequelize.define('Pulse_Tag', {
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
  }
}, {
  tableName: 'pulse_tags',
  timestamps: false,
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['name'] }
  ]
});

module.exports = Tag;


