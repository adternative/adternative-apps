const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Demographic = sequelize.define('Demographic', {
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
      // multiple demographics per entity supported
    },
  age_range: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    validate: {
      ageRangeShape(value) {
        if (value == null) return;
        if (typeof value !== 'object' || Array.isArray(value)) throw new Error('age_range must be an object');
        if (value.min != null && typeof value.min !== 'number') throw new Error('age_range.min must be a number');
        if (value.max != null && typeof value.max !== 'number') throw new Error('age_range.max must be a number');
      }
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'non-binary','all'),
    allowNull: true,
    defaultValue: 'all'
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    validate: {
      locationShape(value) {
        if (value == null) return;
        if (typeof value !== 'object' || Array.isArray(value)) throw new Error('location must be an object');
        if (value.country != null && typeof value.country !== 'string') throw new Error('location.country must be a string');
        if (value.city != null && typeof value.city !== 'string') throw new Error('location.city must be a string');
      }
    }
  },
  income: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    validate: {
      incomeShape(value) {
        if (value == null) return;
        if (typeof value !== 'object' || Array.isArray(value)) throw new Error('income must be an object');
        if (value.min != null && typeof value.min !== 'number') throw new Error('income.min must be a number');
        if (value.max != null && typeof value.max !== 'number') throw new Error('income.max must be a number');
      }
    }
  },
  education: {
    type: DataTypes.ENUM('elementary', 'high_school', 'bachelor', 'master', 'phd'),
    allowNull: true,
    defaultValue: null
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    validate: {
      interestsShape(value) {
        if (value == null) return;
        if (!Array.isArray(value)) throw new Error('interests must be an array');
        for (const i of value) if (typeof i !== 'string') throw new Error('interests items must be strings');
      }
    }
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
    validate: {
      isLanguageCode(value) {
        if (value == null) return;
        if (typeof value !== 'string') throw new Error('language must be a string');
        const trimmed = value.trim();
        // Accept ISO 639-1 with optional region: en, en-US
        const re = /^[a-z]{2}(-[A-Z]{2})?$/;
        if (!re.test(trimmed)) throw new Error('language must be a valid language code (e.g., en or en-US)');
      }
    }
  }

}, {
  tableName: 'demographics',
  indexes: [
    { fields: ['entity_id'] }
  ]
});

module.exports = Demographic;
