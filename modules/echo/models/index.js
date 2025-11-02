const sequelize = require('../../../config/database');

const Influencer = require('./Influencer')(sequelize);
const InfluencerPlatform = require('./InfluencerPlatform')(sequelize);
const Match = require('./Match')(sequelize);

let associationsApplied = false;

const applyAssociations = () => {
  if (associationsApplied) return;

  Influencer.hasMany(InfluencerPlatform, {
    foreignKey: 'influencer_id',
    as: 'platforms',
    onDelete: 'CASCADE'
  });
  InfluencerPlatform.belongsTo(Influencer, {
    foreignKey: 'influencer_id',
    as: 'influencer'
  });

  Influencer.hasMany(Match, {
    foreignKey: 'influencer_id',
    as: 'matches',
    onDelete: 'CASCADE'
  });
  Match.belongsTo(Influencer, {
    foreignKey: 'influencer_id',
    as: 'influencer'
  });

  associationsApplied = true;
};

applyAssociations();

const models = {
  Influencer,
  InfluencerPlatform,
  Match
};

module.exports = {
  sequelize,
  ...models,
  models,
  applyAssociations
};

