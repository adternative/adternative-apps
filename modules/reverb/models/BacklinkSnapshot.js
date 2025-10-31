const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReverbBacklinkSnapshot = sequelize.define('ReverbBacklinkSnapshot', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    backlinkId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'backlink_id' },
    capturedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'captured_at' },
    status: { type: DataTypes.STRING(32), allowNull: true },
    domainAuthority: { type: DataTypes.FLOAT, allowNull: true, field: 'domain_authority' },
    pageAuthority: { type: DataTypes.FLOAT, allowNull: true, field: 'page_authority' },
    spamScore: { type: DataTypes.FLOAT, allowNull: true, field: 'spam_score' },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'reverb_backlink_snapshots',
    underscored: true,
    indexes: [{ fields: ['backlink_id', 'captured_at'] }]
  });

  return ReverbBacklinkSnapshot;
};


