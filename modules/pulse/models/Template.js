const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Template = sequelize.define('Pulse_Template', {
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
  subject: {
    type: DataTypes.STRING
  },
  html: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'pulse_templates',
  timestamps: false,
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['name'] }
  ]
});

module.exports = Template;


