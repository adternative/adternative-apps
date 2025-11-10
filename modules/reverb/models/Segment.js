const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Segment = sequelize.define('ReverbSegment', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    rules: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reverb_segments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Segment;
};


