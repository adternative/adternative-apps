const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoreChannel = sequelize.define('CoreChannel', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    category: { type: DataTypes.ENUM('paid', 'owned', 'earned'), allowNull: false, defaultValue: 'paid' },
    avgCpm: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_cpm' },
    avgCpc: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_cpc' },
    avgCtr: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_ctr' },
    avgConvRate: { type: DataTypes.FLOAT, allowNull: true, field: 'avg_conv_rate' },
    industryModifiers: { type: DataTypes.JSON, allowNull: true, field: 'industry_modifiers' }
  }, {
    tableName: 'core_channels',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CoreChannel;
};


