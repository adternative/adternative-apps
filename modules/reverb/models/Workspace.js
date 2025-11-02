const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Workspace = sequelize.define('ReverbWorkspace', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    entityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'entity_id'
    },
    primaryDomain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'primary_domain'
    },
    allowedSubdomains: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'allowed_subdomains',
      defaultValue: []
    },
    lastAnalysisAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_analysis_at'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reverb_workspaces',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Workspace;
};


