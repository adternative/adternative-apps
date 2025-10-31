const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoreRecommendation = sequelize.define('CoreRecommendation', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    recommendedChannels: { type: DataTypes.JSON, allowNull: false, field: 'recommended_channels' },
    suggestedBudgets: { type: DataTypes.JSON, allowNull: false, field: 'suggested_budgets' },
    estimatedOutcomes: { type: DataTypes.JSON, allowNull: false, field: 'estimated_outcomes' },
    aiNarrative: { type: DataTypes.TEXT('long'), allowNull: true, field: 'ai_narrative' },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'generated_at' }
  }, {
    tableName: 'core_recommendations',
    underscored: true,
    timestamps: false,
    indexes: [{ fields: ['entity_id', 'generated_at'] }]
  });

  return CoreRecommendation;
};


