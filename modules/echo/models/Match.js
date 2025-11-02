const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define(
    'EchoMatch',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      entityId: {
        field: 'entity_id',
        type: DataTypes.UUID,
        allowNull: false
      },
      influencerId: {
        field: 'influencer_id',
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      rationale: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isFavorite: {
        field: 'is_favorite',
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      tableName: 'echo_matches',
      underscored: true,
      indexes: [
        {
          fields: ['entity_id', 'influencer_id'],
          unique: true
        },
        {
          fields: ['entity_id']
        }
      ]
    }
  );

  return Match;
};


