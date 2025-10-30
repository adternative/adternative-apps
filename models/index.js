const sequelize = require('../config/database');
const User = require('./User');
const Entity = require('./Entity');
const EntityUsers = require('./EntityUsers');
const ModuleSubscription = require('./ModuleSubscription');


// Define associations

// User - Entity associations
User.hasMany(Entity, {
  foreignKey: 'user_id',
  as: 'entities',
  onDelete: 'CASCADE'
});

Entity.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'owner'
});

// Many-to-many membership with roles via EntityMember pivot
User.belongsToMany(Entity, {
  through: EntityUsers,
  foreignKey: 'user_id',
  otherKey: 'entity_id',
  as: 'memberEntities'
});

Entity.belongsToMany(User, {
  through: EntityUsers,
  foreignKey: 'entity_id',
  otherKey: 'user_id',
  as: 'members'
});

// Entity - ModuleSubscription associations
Entity.hasMany(ModuleSubscription, {
  foreignKey: 'entity_id',
  as: 'moduleSubscriptions',
  onDelete: 'CASCADE'
});

ModuleSubscription.belongsTo(Entity, {
  foreignKey: 'entity_id',
  as: 'entity'
});

// (Unit model removed)

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models - creates all tables
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Entity,
  EntityUsers,
  ModuleSubscription,
  syncDatabase
};
