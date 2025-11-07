const sequelize = require('../../../config/database');
const Channel = require('./Channel')(sequelize);


const models = {
  Channel,
};

module.exports = {
  sequelize,
  ...models,
  models,
};

