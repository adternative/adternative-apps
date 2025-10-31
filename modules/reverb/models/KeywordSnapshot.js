const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbKeywordSnapshot = sequelize.define('ReverbKeywordSnapshot', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    keywordId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'keyword_id' },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'captured_at' },
    position: { type: DataTypes.INTEGER, allowNull: true },
    previousPosition: { type: DataTypes.INTEGER, allowNull: true, field: 'previous_position' },
    volume: { type: DataTypes.INTEGER, allowNull: true },
    difficulty: { type: DataTypes.FLOAT, allowNull: true },
    serpVolatility: { type: DataTypes.FLOAT, allowNull: true, field: 'serp_volatility' },
    ctrCurve: { type: DataTypes.JSON, allowNull: true, field: 'ctr_curve' },
    trafficPotential: { type: DataTypes.FLOAT, allowNull: true, field: 'traffic_potential' }
  }, {
    tableName: 'reverb_keyword_snapshots',
    underscored: true,
    indexes: [{ fields: ['keyword_id', 'captured_at'] }]
  });

  return ReverbKeywordSnapshot;
};


