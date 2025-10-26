const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Entity = sequelize.define('Entity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Social media platform connections
  socialMediaPlatforms: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Object containing connected social media platforms and their IDs'
  },
  // Google Search Console connection
  googleSearchConsole: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Object containing Google Search Console configuration'
  },
  // Additional integrations
  integrations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Object containing other platform integrations'
  }
}, {
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['industry']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Entity;
