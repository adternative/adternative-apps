const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoreEntity = sequelize.define('CoreEntity', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    baseEntityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true, field: 'base_entity_id' },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT('medium'), allowNull: true },
    website: { type: DataTypes.STRING(512), allowNull: true },
    industry: { type: DataTypes.STRING(128), allowNull: true },
    region: { type: DataTypes.STRING(128), allowNull: true },
    targetAudience: { type: DataTypes.JSON, allowNull: true, field: 'target_audience' },
    goals: { type: DataTypes.ENUM('awareness', 'leads', 'sales', 'conversions'), allowNull: true },
    budgetRangeMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'budget_range_min' },
    budgetRangeMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'budget_range_max' },
    contentStrengths: { type: DataTypes.JSON, allowNull: true, field: 'content_strengths' },
    socialProfiles: { type: DataTypes.JSON, allowNull: true, field: 'social_profiles' },
    avgMonthlyVisitors: { type: DataTypes.INTEGER, allowNull: true, field: 'avg_monthly_visitors' },
    conversionRate: { type: DataTypes.FLOAT, allowNull: true, field: 'conversion_rate' },
    preferredLanguages: { type: DataTypes.JSON, allowNull: true, field: 'preferred_languages' }
  }, {
    tableName: 'core_entities',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CoreEntity;
};


