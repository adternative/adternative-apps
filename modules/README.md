# Module System

This directory contains add-on modules that extend the core application functionality. Each module is self-contained and auto-loaded by the application.

## Module Structure

Each module must follow this standard structure:

```
modules/
  [module-name]/
    ├── database.js       # Database models and sync logic
    ├── routes.js         # Express routes (receives app instance)
    ├── config.js         # Optional configuration
    ├── models/           # Module-specific Sequelize models
    │   └── [Model].js
    ├── views/            # Module-specific Pug templates
    │   └── [view].pug
    ├── controllers/      # Optional: Business logic
    ├── services/         # Optional: External services
    └── connectors/       # Optional: Third-party integrations
        └── [connector].js
```

## Creating a Module

### 1. Basic Structure

```bash
mkdir -p modules/my-module/{models,views}
cd modules/my-module
```

### 2. Database File (`database.js`)

This file defines your module's database tables using Sequelize:

```javascript
const sequelize = require('../../config/database');
const { DataTypes } = require('sequelize');

const MyModel = sequelize.define('MyModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'my_module_table',
  timestamps: false
});

// Sync function called by module loader
const syncModule = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('[My Module] Database synced');
  } catch (error) {
    console.error('[My Module] Database sync error:', error);
  }
};

module.exports = syncModule;
module.exports.MyModel = MyModel;
```

### 3. Routes File (`routes.js`)

This file sets up your module's Express routes:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { MyModel } = require('./database');

// All routes by default require authentication
router.use(authenticateToken);

// Define your routes
router.get('/api/data', async (req, res) => {
  try {
    const data = await MyModel.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export as function that receives app
module.exports = (app) => {
  app.use('/my-module', router);
  console.log('[My Module] Routes loaded at /my-module');
};
```

### 4. Optional Config File (`config.js`)

For module-specific configuration:

```javascript
module.exports = {
  name: 'My Module',
  version: '1.0.0',
  description: 'Module description',
  enabled: process.env.ENABLE_MY_MODULE === 'true',
  settings: {
    someSetting: process.env.MY_MODULE_SETTING || 'default'
  }
};
```

## Module Auto-Loading

The application automatically:

1. **Scans** `modules/` directory for module folders
2. **Loads** `database.js` to create/sync tables
3. **Loads** `routes.js` to register routes
4. **Executes** routes.js function with app instance

## Module Naming Convention

- Use lowercase with hyphens: `my-module`
- Routes will be mounted at: `/[module-name]`
- Example: `modules/reputation/` → routes at `/reputation`

## Example: Reputation Module

See `modules/reputation/` for a complete example with:

- Custom database models (Sentiment)
- Express routes
- Background schedulers
- External connectors
- Alert system

## Module Lifecycle

1. **Database Sync**: Called first to ensure tables exist
2. **Routes Loading**: Called with Express app instance
3. **Background Jobs**: Started if configured in main app

## Integration Points

### Middleware

Modules can use existing middleware:

```javascript
const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
```

### Models

Access to core models:

```javascript
const { User, Entity } = require('../../models');
```

### Database Connection

Use the shared Sequelize instance:

```javascript
const sequelize = require('../../config/database');
```

## Testing Your Module

1. Create the module structure
2. Restart the server
3. Check logs for: `[Module Loader] Loaded routes for module: [name]`
4. Test routes at: `http://localhost:3000/[module-name]/api/...`

## Paywall Integration (Future)

Modules can include paywall logic:

```javascript
module.exports = {
  requiresSubscription: true,
  subscriptionTier: 'premium',
  features: ['feature1', 'feature2']
};
```

## Best Practices

1. **Keep modules self-contained** - Don't modify core app files
2. **Use standard structure** - Follow the directory layout
3. **Prefix log messages** - `[Module Name] Your message`
4. **Handle errors gracefully** - Try/catch in critical paths
5. **Document dependencies** - If your module needs env vars or settings
6. **Version your module** - Include version in module metadata

## Module Dependencies

Modules can depend on npm packages. Add to root `package.json` or use `require()` for existing packages.

## Disabling Modules

Modules are enabled by default. To disable:

1. Move module folder outside `modules/`
2. Or add a check in `routes.js`:

```javascript
if (process.env.ENABLE_MY_MODULE !== 'true') {
  return; // Skip loading
}
```

## Adding Modules to Your App

Simply create the module folder structure in `modules/` and it will be auto-loaded on the next server restart.

## Support

For questions or issues, refer to existing modules like `modules/reputation/` for examples.

