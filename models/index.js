const sequelize = require('../config/database');
const User = require('./User');
const Entity = require('./Entity');

// Define associations
User.hasMany(Entity, {
  foreignKey: 'userId',
  as: 'entities',
  onDelete: 'CASCADE'
});

Entity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
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
  syncDatabase
};
