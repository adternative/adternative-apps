const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PageAudit = sequelize.define('ReverbPageAudit', {
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
    url: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    statusCode: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      field: 'status_code'
    },
    auditScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'audit_score'
    },
    lighthouseScore: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'lighthouse_score'
    },
    issues: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    lastCrawledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_crawled_at'
    }
  }, {
    tableName: 'reverb_page_audits',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['workspace_id', 'url']
      },
      {
        fields: ['workspace_id', 'audit_score']
      }
    ]
  });

  return PageAudit;
};


