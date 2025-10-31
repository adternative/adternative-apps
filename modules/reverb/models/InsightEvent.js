const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbInsightEvent = sequelize.define('ReverbInsightEvent', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'site_id' },
    type: { type: DataTypes.STRING(128), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT('long'), allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'occurred_at' },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_insight_events',
    underscored: true,
    indexes: [{ fields: ['entity_id', 'occurred_at'] }]
  });

  return ReverbInsightEvent;
};


