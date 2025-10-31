const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbKeyword = sequelize.define('ReverbKeyword', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'entity_id' },
    siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'site_id' },
    keyword: { type: DataTypes.STRING(255), allowNull: false },
    intent: { type: DataTypes.STRING(64), allowNull: true },
    location: { type: DataTypes.STRING(128), allowNull: true },
    device: { type: DataTypes.STRING(32), allowNull: true, defaultValue: 'desktop' },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_keywords',
    underscored: true,
    indexes: [{ fields: ['entity_id', 'keyword'] }, { fields: ['site_id', 'keyword'], unique: true }]
  });

  return ReverbKeyword;
};


