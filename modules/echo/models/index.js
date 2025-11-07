const sequelize = require('../../../config/database');
const Influencer = require('./Influencer')(sequelize);



const models = {
  Influencer,
};

module.exports = {
  sequelize,
  ...models,
  models,
};

