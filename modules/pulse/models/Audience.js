const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Audience = sequelize.define('Pulse_Audience', {
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
  description: {
    type: DataTypes.TEXT
  },
  default_from_name: {
    type: DataTypes.STRING
  },
  default_from_email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  default_subject: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'pulse_audiences',
  timestamps: false,
  indexes: [
    { fields: ['entity_id'] },
    { fields: ['name'] }
  ]
});

module.exports = Audience;


