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

function getModuleDatabaseApis() {
  const modulesDir = path.join(__dirname, '..', 'modules');
  if (!fs.existsSync(modulesDir)) return [];

  const apis = [];
  const moduleNames = fs.readdirSync(modulesDir).filter((item) => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const moduleName of moduleNames) {
    const dbPath = path.join(modulesDir, moduleName, 'database.js');
    if (!fs.existsSync(dbPath)) continue;
    try {
      const api = require(dbPath);
      apis.push({ moduleName, api });
      console.log(`✓ Loaded database API for module: ${moduleName}`);
    } catch (error) {
      console.warn(`! Failed to load database API for ${moduleName}: ${error.message}`);
    }
  }

  return apis;
}

async function seedModuleData() {
  const moduleApis = getModuleDatabaseApis();
  if (!moduleApis.length) {
    console.log('No module database APIs found for seeding.');
    return;
  }

  console.log('\nSeeding module data (if hooks are available)...');
  for (const { moduleName, api } of moduleApis) {
    try {
      if (api && typeof api.ensureReady === 'function') {
        console.log(`→ ${moduleName}: ensureReady()`);
        await api.ensureReady();
        console.log(`✓ ${moduleName}: ensureReady complete`);
        continue;
      }

      // Fall back to any exported seed* functions
      const seedFns = Object.entries(api || {})
        .filter(([name, fn]) => typeof fn === 'function' && /^seed/i.test(name));
      if (seedFns.length) {
        console.log(`→ ${moduleName}: running ${seedFns.length} seed function(s)`);
        for (const [name, fn] of seedFns) {
          await fn();
          console.log(`  ✓ ${moduleName}: ${name} complete`);
        }
      } else {
        console.log(`→ ${moduleName}: no seeding hooks found, skipping`);
      }
    } catch (error) {
      console.warn(`! ${moduleName}: seeding failed - ${error.message}`);
    }
  }
}

async function syncNewModelTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    console.log('\nRegistering application and module models...');
    preloadModuleSchemas();

    console.log('\nCreating any missing tables (without altering existing data)...');
    await sequelize.sync({ alter: true });
    console.log('✓ New tables synchronized successfully.');

    // After syncing, seed module data if seeders are provided
    await seedModuleData();

    console.log('\n✓ Database update completed without wiping existing data!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database update failed:', error);
    process.exit(1);
  }
}

syncNewModelTables();


