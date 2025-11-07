const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Channel = sequelize.define('Channel', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    category: { type: DataTypes.ENUM('paid', 'owned', 'earned'), allowNull: false, defaultValue: 'paid' },
    avgCpm: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_cpm' },
    avgCpc: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_cpc' },
    avgCtr: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_ctr' },
    avgConvRate: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_conv_rate' },
    industryModifiers: { type: DataTypes.JSON, allowNull: true, field: 'industry_modifiers' },
    demographicsModifiers: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      validate: {
        demographicsModifiersShape(value) {
          if (value == null) return;
          const items = Array.isArray(value) ? value : [value];
          for (const item of items) {
            if (typeof item !== 'object' || item == null) throw new Error('demographicsModifiers entries must be objects');
            const { age_range, gender, location, income, education, interests, language } = item;
            if (age_range != null) {
              if (typeof age_range !== 'object') throw new Error('age_range must be an object');
              if (age_range.min != null && typeof age_range.min !== 'number') throw new Error('age_range.min must be a number');
              if (age_range.max != null && typeof age_range.max !== 'number') throw new Error('age_range.max must be a number');
            }
            if (gender != null) {
              if (!Array.isArray(gender)) throw new Error('gender must be an array');
              for (const g of gender) if (typeof g !== 'string') throw new Error('gender items must be strings');
            }
            if (location != null) {
              if (typeof location !== 'object') throw new Error('location must be an object');
              if (location.country != null && typeof location.country !== 'string') throw new Error('location.country must be a string');
              if (location.city != null && typeof location.city !== 'string') throw new Error('location.city must be a string');
            }
            if (income != null) {
              if (typeof income !== 'object') throw new Error('income must be an object');
              if (income.min != null && typeof income.min !== 'number') throw new Error('income.min must be a number');
              if (income.max != null && typeof income.max !== 'number') throw new Error('income.max must be a number');
            }
            if (education != null) {
              const allowedEdu = ['elementary', 'high_school', 'bachelor', 'master', 'phd'];
              if (!allowedEdu.includes(String(education))) throw new Error('education must be a valid value');
            }
            if (interests != null) {
              if (!Array.isArray(interests)) throw new Error('interests must be an array');
              for (const i of interests) if (typeof i !== 'string') throw new Error('interests items must be strings');
            }
            if (language != null) {
              if (typeof language !== 'string') throw new Error('language must be a string');
              const re = /^[a-z]{2}(-[A-Z]{2})?$/;
              if (!re.test(language.trim())) throw new Error('language must be a valid code (e.g., en or en-US)');
            }
          }
        }
      }
    },
  }, {
    tableName: 'core_channels',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Channel;
};


