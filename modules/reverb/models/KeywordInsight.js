const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KeywordInsight = sequelize.define('ReverbKeywordInsight', {
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
    searchVolume: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'search_volume'
    },
    difficulty: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    intent: {
      type: DataTypes.ENUM('informational', 'navigational', 'transactional', 'commercial'),
      allowNull: false
    },
    opportunityScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      field: 'opportunity_score'
    },
    currentRank: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'current_rank'
    },
    rankingUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'ranking_url'
    },
    lastUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_updated_at'
    }
  }, {
    tableName: 'reverb_keyword_insights',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['workspace_id', 'keyword']
      },
      {
        fields: ['workspace_id', 'opportunity_score']
      }
    ]
  });

  return KeywordInsight;
};


