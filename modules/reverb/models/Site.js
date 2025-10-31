const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbSite = sequelize.define('ReverbSite', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    domain: { type: DataTypes.STRING(255), allowNull: false },
    defaultLocation: { type: DataTypes.STRING(128), allowNull: true, field: 'default_location' },
    defaultDevice: { type: DataTypes.STRING(32), allowNull: true, defaultValue: 'desktop', field: 'default_device' },
    metadata: { type: DataTypes.JSON, allowNull: true },
    lastAuditAt: { type: DataTypes.DATE, allowNull: true, field: 'last_audit_at' }
  }, {
    tableName: 'reverb_sites',
    underscored: true,
    indexes: [{ fields: ['entity_id', 'domain'], unique: true }]
  });

  return ReverbSite;
};


