const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbBacklink = sequelize.define('ReverbBacklink', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'site_id' },
    sourceUrl: { type: DataTypes.STRING(512), allowNull: false, field: 'source_url' },
    targetUrl: { type: DataTypes.STRING(512), allowNull: false, field: 'target_url' },
    anchorText: { type: DataTypes.TEXT('long'), allowNull: true, field: 'anchor_text' },
    rel: { type: DataTypes.STRING(64), allowNull: true },
    firstSeenAt: { type: DataTypes.DATE, allowNull: true, field: 'first_seen_at' },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true, field: 'last_seen_at' },
    status: { type: DataTypes.STRING(32), allowNull: true, defaultValue: 'active' },
    metrics: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_backlinks',
    underscored: true,
    indexes: [{ fields: ['site_id', 'source_url'], unique: true }]
  });

  return ReverbBacklink;
};


