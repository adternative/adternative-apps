const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbPageInsight = sequelize.define('ReverbPageInsight', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    auditId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'audit_id' },
    url: { type: DataTypes.STRING(1024), allowNull: false },
    statusCode: { type: DataTypes.INTEGER, allowNull: true, field: 'status_code' },
    isBroken: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_broken' },
    redirectTarget: { type: DataTypes.STRING(1024), allowNull: true, field: 'redirect_target' },
    meta: { type: DataTypes.JSON, allowNull: true },
    headings: { type: DataTypes.JSON, allowNull: true },
    schema: { type: DataTypes.JSON, allowNull: true },
    lighthouseMetrics: { type: DataTypes.JSON, allowNull: true, field: 'lighthouse_metrics' },
    notes: { type: DataTypes.TEXT('medium'), allowNull: true }
  }, {
    tableName: 'reverb_page_insights',
    underscored: true,
    indexes: [{ fields: ['audit_id'] }, { fields: ['url'] }]
  });

  return ReverbPageInsight;
};


