const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbAiInsight = sequelize.define('ReverbAiInsight', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'site_id' },
    category: { type: DataTypes.STRING(128), allowNull: false },
    summary: { type: DataTypes.TEXT('long'), allowNull: false },
    confidence: { type: DataTypes.FLOAT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'generated_at' }
  }, {
    tableName: 'reverb_ai_insights',
    underscored: true,
    indexes: [{ fields: ['entity_id', 'category', 'generated_at'] }]
  });

  return ReverbAiInsight;
};


