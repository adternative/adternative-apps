require('dotenv').config();
const { sequelize, User, Entity } = require('../models');
const fs = require('fs');
const path = require('path');

function preloadModuleModels() {
  const modulesDir = path.join(__dirname, '..', 'modules');
  if (!fs.existsSync(modulesDir)) return [];
  const loaded = [];
  const moduleNames = fs.readdirSync(modulesDir).filter(item => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });
  for (const moduleName of moduleNames) {
    const modelsIndex = path.join(modulesDir, moduleName, 'models', 'index.js');
    if (fs.existsSync(modelsIndex)) {
      try {
        require(modelsIndex);
        loaded.push(moduleName);
        console.log(`✓ Preloaded models for module: ${moduleName}`);
      } catch (e) {
        console.warn(`! Failed to preload models for module ${moduleName}: ${e.message}`);
      }
    }
  }
  return loaded;
}


async function resetDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');
    
    console.log('\nWARNING: This will drop all tables and recreate them. All data will be lost!');
    console.log('Preloading module models...');
    preloadModuleModels();
    console.log('Resetting database models (including modules)...');
    
    await sequelize.sync({ force: true }); // Drops all tables and recreates them
    console.log('✓ Database models reset successfully.');
    
    console.log('\n✓ Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database reset failed:', error);
    process.exit(1);
  }
}

// Run reset
resetDatabase();

