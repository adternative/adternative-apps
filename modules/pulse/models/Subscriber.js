const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Subscriber = sequelize.define('Pulse_Subscriber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  audience_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  first_name: {
    type: DataTypes.STRING
  },
  last_name: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('subscribed', 'unsubscribed', 'cleaned', 'pending'),
    defaultValue: 'subscribed'
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'pulse_subscribers',
  timestamps: false,
  indexes: [
    { fields: ['audience_id'] },
    { unique: false, fields: ['email'] }
  ]
});

module.exports = Subscriber;


