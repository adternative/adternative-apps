const { DataTypes } = require('sequelize');

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x', 'linkedin'];

module.exports = (sequelize) => {
  const InfluencerPlatform = sequelize.define(
    'EchoInfluencerPlatform',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      influencerId: {
        field: 'influencer_id',
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      platform: {
        type: DataTypes.ENUM(...PLATFORMS),
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      followers: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0
      },
      engagementRate: {
        field: 'engagement_rate',
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      avgViews: {
        field: 'avg_views',
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0
      },
      audienceDemographics: {
        field: 'audience_demographics',
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: { msg: 'link must be a valid URL' }
        }
      },
      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      lastUpdated: {
        field: 'last_updated',
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'echo_influencer_platforms',
      underscored: true,
      indexes: [
        {
          fields: ['influencer_id', 'platform'],
          unique: true
        },
        {
          fields: ['platform']
        }
      ]
    }
  );

  InfluencerPlatform.PLATFORMS = PLATFORMS;

  return InfluencerPlatform;
};


