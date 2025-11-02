const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Influencer = sequelize.define(
    'EchoInfluencer',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      handle: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      profileImage: {
        field: 'profile_image',
        type: DataTypes.STRING,
        allowNull: true
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      contactEmail: {
        field: 'contact_email',
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: { msg: 'contact_email must be a valid email address' }
        }
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true
      },
      language: {
        type: DataTypes.STRING,
        allowNull: true
      },
      topics: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      authenticityScore: {
        field: 'authenticity_score',
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0,
          max: 1
        }
      },
      averageEngagementRate: {
        field: 'average_engagement_rate',
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      followersTotal: {
        field: 'followers_total',
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0
      },
      estimatedReach: {
        field: 'estimated_reach',
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0
      },
      avgCostPerPost: {
        field: 'avg_cost_per_post',
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      }
    },
    {
      tableName: 'echo_influencers',
      underscored: true,
      indexes: [
        {
          fields: ['handle'],
          unique: true
        },
        {
          fields: ['country', 'language']
        }
      ]
    }
  );

  return Influencer;
};


