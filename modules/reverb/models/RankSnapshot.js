const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RankSnapshot = sequelize.define('ReverbRankSnapshot', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    workspaceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'workspace_id'
    },
    keyword: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    positionDelta: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'position_delta'
    },
    searchVolume: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'search_volume'
    },
    trackedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'tracked_at'
    }
  }, {
    tableName: 'reverb_rank_snapshots',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['workspace_id', 'keyword', 'tracked_at']
      }
    ]
  });

  return RankSnapshot;
};



