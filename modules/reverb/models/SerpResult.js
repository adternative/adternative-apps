const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbSerpResult = sequelize.define('ReverbSerpResult', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serpSnapshotId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'serp_snapshot_id' },
    rank: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.TEXT('medium'), allowNull: false },
    title: { type: DataTypes.TEXT('medium'), allowNull: true },
    snippet: { type: DataTypes.TEXT('long'), allowNull: true },
    type: { type: DataTypes.STRING(64), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_serp_results',
    underscored: true,
    indexes: [{ fields: ['serp_snapshot_id', 'rank'] }]
  });

  return ReverbSerpResult;
};


