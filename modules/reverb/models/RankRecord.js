const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbRankRecord = sequelize.define('ReverbRankRecord', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    keywordId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'keyword_id' },
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'recorded_at' },
    position: { type: DataTypes.INTEGER, allowNull: true },
    url: { type: DataTypes.TEXT('medium'), allowNull: true },
    change: { type: DataTypes.INTEGER, allowNull: true },
    visibilityScore: { type: DataTypes.FLOAT, allowNull: true, field: 'visibility_score' }
  }, {
    tableName: 'reverb_rank_records',
    underscored: true,
    indexes: [{ fields: ['keyword_id', 'recorded_at'] }]
  });

  return ReverbRankRecord;
};


