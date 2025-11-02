const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TechnicalIssue = sequelize.define('ReverbTechnicalIssue', {
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
    category: {
      type: DataTypes.ENUM('performance', 'crawlability', 'indexation', 'content', 'security', 'infrastructure'),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT('medium'),
      allowNull: false
    },
    context: {
      type: DataTypes.JSON,
      allowNull: true
    },
    detectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'detected_at'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    }
  }, {
    tableName: 'reverb_technical_issues',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['workspace_id', 'category']
      },
      {
        fields: ['workspace_id', 'severity']
      }
    ]
  });

  return TechnicalIssue;
};


