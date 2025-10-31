const sequelize = require('../../../config/database');

const CoreEntity = require('./CoreEntity')(sequelize);
const CoreChannel = require('./CoreChannel')(sequelize);
const CoreBenchmark = require('./CoreBenchmark')(sequelize);
const CoreRecommendation = require('./CoreRecommendation')(sequelize);

let associationsApplied = false;

const applyAssociations = () => {
  if (associationsApplied) return;

  CoreEntity.hasMany(CoreRecommendation, { foreignKey: 'entity_id', as: 'recommendations' });
  CoreRecommendation.belongsTo(CoreEntity, { foreignKey: 'entity_id', as: 'entity' });

  associationsApplied = true;
};

applyAssociations();

const models = {
  CoreEntity,
  CoreChannel,
  CoreBenchmark,
  CoreRecommendation
};

module.exports = {
  sequelize,
  ...models,
  models,
  applyAssociations
};

