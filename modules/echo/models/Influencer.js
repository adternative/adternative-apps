const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Influencer = sequelize.define(
    'EchoInfluencer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      photo: {
        field: 'photo',
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      socials: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          socialsShape(value) {
            if (value == null) return;
            if (!Array.isArray(value)) throw new Error('socials must be an array');
            const allowed = ['instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'linkedin', 'blog'];
            for (const entry of value) {
              if (!entry || typeof entry !== 'object') throw new Error('socials entries must be objects');
              const platform = String(entry.platform || '').toLowerCase();
              if (!allowed.includes(platform)) throw new Error('socials.platform must be a supported platform');
              if (typeof entry.handle !== 'string' || !entry.handle.trim()) throw new Error('socials.handle must be a non-empty string');
            }
          }
        }
      },
      contactEmail: {
        field: 'contact_email',
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: { msg: 'contact_email must be a valid email address' }
        }
      },
      demographics: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        validate: {
          demographicsShape(value) {
            if (value == null) return;
            if (typeof value !== 'object' || Array.isArray(value)) throw new Error('demographics must be an object');
            const { location, education, interests, language } = value;
            if (location != null) {
              if (typeof location !== 'object') throw new Error('demographics.location must be an object');
              if (location.country != null && typeof location.country !== 'string') throw new Error('demographics.location.country must be a string');
              if (location.city != null && typeof location.city !== 'string') throw new Error('demographics.location.city must be a string');
            }
            if (language != null) {
              if (typeof language !== 'string') throw new Error('demographics.language must be a string');
              const re = /^[a-z]{2}(-[A-Z]{2})?$/;
              if (!re.test(language.trim())) throw new Error('demographics.language must be a valid language code (e.g., en or en-US)');
            }
            if (education != null) {
              const allowedEdu = ['elementary', 'high_school', 'bachelor', 'master', 'phd'];
              if (!allowedEdu.includes(String(education))) throw new Error('demographics.education must be a valid value');
            }
            if (interests != null) {
              if (!Array.isArray(interests)) throw new Error('demographics.interests must be an array');
              for (const i of interests) {
                if (typeof i !== 'string') throw new Error('demographics.interests must contain strings');
              }
            }
          }
        }
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
          fields: ['name'],
          unique: true
        }
      ]
    }
  );

  return Influencer;
};


