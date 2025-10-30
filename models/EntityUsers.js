const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EntityUsers = sequelize.define('EntityUsers', {
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('manager', 'editor', 'owner'),
    allowNull: false,
    defaultValue: 'manager'
  }
}, {
  tableName: 'entity_members',
  indexes: [
    {
      unique: true,
      fields: ['entity_id', 'user_id']
    },
    {
      fields: ['role']
    }
  ]
});

module.exports = EntityUsers;


