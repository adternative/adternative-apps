const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoreBenchmark = sequelize.define('CoreBenchmark', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    industry: { type: DataTypes.STRING(128), allowNull: false },
    source: { type: DataTypes.STRING(255), allowNull: true },
    metrics: { type: DataTypes.JSON, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' }
  }, {
    tableName: 'core_benchmarks',
    underscored: true,
    timestamps: false,
    indexes: [{ fields: ['industry'], unique: true }]
  });

  return CoreBenchmark;
};


