const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbSerpSnapshot = sequelize.define('ReverbSerpSnapshot', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    keywordId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'keyword_id' },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'captured_at' },
    location: { type: DataTypes.STRING(128), allowNull: true },
    device: { type: DataTypes.STRING(32), allowNull: true },
    rawHtml: { type: DataTypes.TEXT('long'), allowNull: true, field: 'raw_html' },
    featureSummary: { type: DataTypes.JSON, allowNull: true, field: 'feature_summary' }
  }, {
    tableName: 'reverb_serp_snapshots',
    underscored: true,
    indexes: [{ fields: ['keyword_id', 'captured_at'] }]
  });

  return ReverbSerpSnapshot;
};


