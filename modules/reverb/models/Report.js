const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('ReverbReport', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    crawlId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'crawl_id'
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reverb_reports',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Report;
};


