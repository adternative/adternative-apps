const fs = require('fs');
const path = require('path');
const subscriptionPlans = require('../config/subscriptions');

const DEFAULT_CURRENCY = subscriptionPlans?.defaultCurrency || 'USD';

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const normalizeAmount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.round(numeric);
    }
  }
  return null;
};

const normalizePlanDetails = (plan) => {
  if (!plan || typeof plan !== 'object') {
    return null;
  }
  const amount = normalizeAmount(plan.amount);
  if (amount === null) {
    return null;
  }
  const currency = (typeof plan.currency === 'string' && plan.currency.trim())
    ? plan.currency.trim().toUpperCase()
    : DEFAULT_CURRENCY;
  return { amount, currency };
};

const normalizePricing = (pricing) => {
  if (!pricing || typeof pricing !== 'object') {
    return null;
  }

  const normalized = {};
  const monthly = normalizePlanDetails(pricing.monthly);
  if (monthly) {
    normalized.monthly = monthly;
  }

  const yearly = normalizePlanDetails(pricing.yearly);
  if (yearly) {
    normalized.yearly = yearly;
  }

  return Object.keys(normalized).length ? normalized : null;
};

// Function to dynamically load app routes (legacy routes/app structure)
const loadAppRoutes = (app) => {
  const appRoutesDir = path.join(__dirname, '../routes/app');
  
  // Create app routes directory if it doesn't exist
  if (!fs.existsSync(appRoutesDir)) {
    fs.mkdirSync(appRoutesDir, { recursive: true });
  }

  // Read all files in the app routes directory
  const files = fs.readdirSync(appRoutesDir).filter(file => file.endsWith('.js'));

  files.forEach(file => {
    const routePath = path.join(appRoutesDir, file);
    const routeName = path.basename(file, '.js');
    
    try {
      const router = require(routePath);
      app.use(`/${routeName.toLowerCase()}`, router);
      console.log(`Loaded app route: /${routeName.toLowerCase()}`);
    } catch (error) {
      console.error(`Error loading route ${file}:`, error);
    }
  });
};

// Function to dynamically load modules from modules/ folder
const loadModules = (app) => {
  const modulesDir = path.join(__dirname, '../modules');
  
  if (!fs.existsSync(modulesDir)) {
    return { loaded: 0, errors: [] };
  }

  const modules = fs.readdirSync(modulesDir).filter(item => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });

  let loadedCount = 0;
  const errors = [];

  for (const moduleName of modules) {
    try {
      const modulePath = path.join(modulesDir, moduleName);
      
      // Check if module has required files
      const hasRoutes = fs.existsSync(path.join(modulePath, 'routes.js'));
      const hasModels = fs.existsSync(path.join(modulePath, 'models', 'index.js'));
      const hasConfig = fs.existsSync(path.join(modulePath, 'config.js'));
      
      if (!hasRoutes && !hasModels && !hasConfig) {
        console.log(`[Module Loader] Skipping ${moduleName}: No routes.js, models/index.js, or config.js found`);
        continue;
      }
      
      // Load module routes
      if (hasRoutes) {
        try {
          const moduleRoutes = require(path.join(modulePath, 'routes.js'));
          if (moduleRoutes && typeof moduleRoutes === 'function') {
            // Mount synchronously to preserve middleware order before 404 handler
            moduleRoutes(app);
          } else if (moduleRoutes && moduleRoutes.default) {
            moduleRoutes.default(app);
          } else {
            // Assume it's a router
            app.use(`/${moduleName.toLowerCase()}`, moduleRoutes);
          }
          console.log(`[Module Loader] Loaded routes for module: ${moduleName}`);
        } catch (error) {
          console.error(`[Module Loader] Error loading routes for ${moduleName}:`, error.message);
          errors.push({ module: moduleName, type: 'routes', error: error.message });
        }
      }
      
      // Note: models/index.js is loaded separately via loadModuleDatabases()
      loadedCount++;
      
    } catch (error) {
      console.error(`[Module Loader] Error loading module ${moduleName}:`, error.message);
      errors.push({ module: moduleName, error: error.message });
    }
  }

  return { loaded: loadedCount, errors };
};

// Function to load module database definitions
const loadModuleDatabases = async () => {
  const modulesDir = path.join(__dirname, '../modules');
  const results = [];
  
  if (!fs.existsSync(modulesDir)) {
    return results;
  }

  const modules = fs.readdirSync(modulesDir).filter(item => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const moduleName of modules) {
    const modulePath = path.join(modulesDir, moduleName);
    const modelsFile = path.join(modulePath, 'models', 'index.js');
    
    if (fs.existsSync(modelsFile)) {
      try {
        const dbConfig = require(modelsFile);
        if (typeof dbConfig === 'function') {
          await dbConfig();
        } else {
          // Handle object exports
          if (dbConfig.syncDatabase && typeof dbConfig.syncDatabase === 'function') {
            await dbConfig.syncDatabase();
          }
          if (dbConfig.ensureReady && typeof dbConfig.ensureReady === 'function') {
            await dbConfig.ensureReady();
          }
        }
        results.push({ module: moduleName, status: 'success' });
        console.log(`[Module Loader] Loaded database for module: ${moduleName}`);
      } catch (error) {
        console.error(`[Module Loader] Error loading database for ${moduleName}:`, error.message);
        results.push({ module: moduleName, status: 'error', error: error.message });
      }
    }
  }

  return results;
};

// Helper: read JSON safely
const readJSONSafe = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Module Loader] Failed to read JSON: ${filePath} - ${e.message}`);
    return null;
  }
};

// Function to get available apps for sidebar (from modules/*)
const getAvailableApps = () => {
  const modulesDir = path.join(__dirname, '../modules');

  if (!fs.existsSync(modulesDir)) {
    return [];
  }

  const moduleNames = fs.readdirSync(modulesDir).filter(item => {
    const fullPath = path.join(modulesDir, item);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'routes.js'));
  });

  return moduleNames.map((moduleName) => {
    const configPath = path.join(modulesDir, moduleName, 'config.json');
    const config = readJSONSafe(configPath) || {};
    const displayName = (config.name || moduleName).toUpperCase();
    const icon = config.icon;
    const links = Array.isArray(config.links) ? config.links : [];
    const description = typeof config.description === 'string' ? config.description : null;
    const pricing = normalizePricing(config.pricing);
    const moduleKey = normalizeKey(moduleName);

    return {
      key: moduleKey,
      name: displayName,
      path: `/${moduleKey}`,
      icon,
      description,
      links,
      pricing
    };
  });
};

const isModule = (path) => {
  const modulesDir = path.join(__dirname, '../modules');
  return fs.existsSync(path.join(modulesDir, path));
};


module.exports = {
  isModule,
  loadAppRoutes,
  loadModules,
  loadModuleDatabases,
  getAvailableApps
};
