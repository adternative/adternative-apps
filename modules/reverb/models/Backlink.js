const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Backlink = sequelize.define('ReverbBacklink', {
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
    sourceUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'source_url'
    },
    sourceDomain: {
      type: DataTypes.STRING(191),
      allowNull: false,
      field: 'source_domain'
    },
    targetUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'target_url'
    },
    anchorText: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'anchor_text'
    },
    authorityScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'authority_score'
    },
    spamScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'spam_score'
    },
    type: {
      type: DataTypes.ENUM('follow', 'nofollow', 'ugc', 'sponsored'),
      allowNull: false,
      defaultValue: 'follow'
    },
    firstSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'first_seen_at'
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen_at'
    }
  }, {
    tableName: 'reverb_backlinks',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['workspace_id', 'source_url']
      },
      {
        fields: ['workspace_id', 'authority_score']
      },
      {
        fields: ['workspace_id', 'source_domain']
      }
    ]
  });

  return Backlink;
};
