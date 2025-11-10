const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define('ReverbSetting', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reverb_settings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Setting;
};


