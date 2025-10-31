const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbSiteAudit = sequelize.define('ReverbSiteAudit', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'site_id' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    crawlerSummary: { type: DataTypes.JSON, allowNull: true },
    lighthouseSummary: { type: DataTypes.JSON, allowNull: true },
    technicalHealthScore: { type: DataTypes.FLOAT, allowNull: true },
    performanceScore: { type: DataTypes.FLOAT, allowNull: true },
    accessibilityScore: { type: DataTypes.FLOAT, allowNull: true },
    seoScore: { type: DataTypes.FLOAT, allowNull: true },
    issues: { type: DataTypes.JSON, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' }
  }, {
    tableName: 'reverb_site_audits',
    underscored: true
  });

  return ReverbSiteAudit;
};


