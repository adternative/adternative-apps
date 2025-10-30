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

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');
    
    console.log('\nPreloading module models...');
    preloadModuleModels();

    console.log('\nSyncing database models (including modules)...');
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synchronized successfully.');
    
    console.log('\n✓ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();

