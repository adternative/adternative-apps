const fs = require('fs');
const path = require('path');

// Function to dynamically load app routes
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

// Function to get available apps for sidebar
const getAvailableApps = () => {
  const appRoutesDir = path.join(__dirname, '../routes/app');
  
  if (!fs.existsSync(appRoutesDir)) {
    return [];
  }

  const files = fs.readdirSync(appRoutesDir).filter(file => file.endsWith('.js'));
  
  return files.map(file => {
    const routeName = path.basename(file, '.js');
    return {
      name: routeName.toUpperCase(),
      path: `/${routeName.toLowerCase()}`,
      icon: getAppIcon(routeName)
    };
  });
};

// Function to get appropriate icon for each app
const getAppIcon = (appName) => {
  const iconMap = {
    'core': 'diameter',
    'flow': 'workflow',
    'echo': 'waves',
    'reverb': 'audio-waveform',
    'default': 'grid'
  };
  
  return iconMap[appName.toLowerCase()] || iconMap.default;
};

module.exports = {
  loadAppRoutes,
  getAvailableApps
};
