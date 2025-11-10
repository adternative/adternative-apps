const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Crawl = sequelize.define('ReverbCrawl', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    startUrl: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      field: 'start_url'
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'completed'
    },
    pageCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'page_count'
    },
    digest: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reverb_crawls',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Crawl;
};


