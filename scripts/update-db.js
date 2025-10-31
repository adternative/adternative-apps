require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const MODULE_ENTRY_FILES = ['models/index.js', 'database.js'];

function preloadModuleSchemas() {
  const modulesDir = path.join(__dirname, '..', 'modules');
  if (!fs.existsSync(modulesDir)) return [];

  const loadedEntries = [];
  const moduleNames = fs.readdirSync(modulesDir).filter((item) => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const moduleName of moduleNames) {
    for (const entry of MODULE_ENTRY_FILES) {
      const entryPath = path.join(modulesDir, moduleName, entry);
      if (!fs.existsSync(entryPath)) continue;

      try {
        require(entryPath);
        loadedEntries.push(`${moduleName}/${entry}`);
        console.log(`✓ Registered models from ${moduleName}/${entry}`);
      } catch (error) {
        console.warn(`! Failed to load ${moduleName}/${entry}: ${error.message}`);
      }
    }
  }

  if (!loadedEntries.length) {
    console.warn('! No module schemas were registered. Ensure modules export models or database definitions.');
  }

  return loadedEntries;
}

async function syncNewModelTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    console.log('\nRegistering application and module models...');
    preloadModuleSchemas();

    console.log('\nCreating any missing tables (without altering existing data)...');
    await sequelize.sync();
    console.log('✓ New tables synchronized successfully.');

    console.log('\n✓ Database update completed without wiping existing data!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database update failed:', error);
    process.exit(1);
  }
}

syncNewModelTables();


