const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbCompetitor = sequelize.define('ReverbCompetitor', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'site_id' },
    domain: { type: DataTypes.STRING(255), allowNull: false },
    labels: { type: DataTypes.JSON, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_competitors',
    underscored: true,
    indexes: [{ fields: ['site_id', 'domain'], unique: true }]
  });

  return ReverbCompetitor;
};


