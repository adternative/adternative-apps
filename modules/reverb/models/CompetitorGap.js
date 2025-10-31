const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbCompetitorGap = sequelize.define('ReverbCompetitorGap', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    competitorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'competitor_id' },
    keyword: { type: DataTypes.STRING(255), allowNull: false },
    overlapScore: { type: DataTypes.FLOAT, allowNull: true, field: 'overlap_score' },
    opportunityScore: { type: DataTypes.FLOAT, allowNull: true, field: 'opportunity_score' },
    notes: { type: DataTypes.TEXT('medium'), allowNull: true }
  }, {
    tableName: 'reverb_competitor_gaps',
    underscored: true,
    indexes: [{ fields: ['competitor_id', 'keyword'] }]
  });

  return ReverbCompetitorGap;
};


