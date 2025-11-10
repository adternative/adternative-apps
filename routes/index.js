var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { User, Entity } = require('../models');
const { CoreDemographic } = require('../modules/core/models');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { getAvailableApps } = require('../utils/appLoader');
const { uploadEntityLogo, getPublicUrl } = require('../config/storage');

const AUTH_COOKIE_NAME = 'authToken';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/* GET home page - requires authentication */
router.get('/', authenticateToken, function(req, res, next) {
  // Render dashboard as the home page
  res.render('overview', { 
    title: 'Overview',
    user: req.user
  });
});


/* GET home page - requires authentication */
router.get('/admin', authenticateToken, requireRole(['admin']), function(req, res, next) {
  // Aggregate settings definitions from modules/*/config.json synchronously
  const modulesDir = path.join(__dirname, '../modules');
  const settingsDefs = [];
  // Build a model name -> model and table name -> model map resiliently
  const nameToModel = new Map();
  const tableToModel = new Map();
  try {
    if (fs.existsSync(modulesDir)) {
      const moduleNames = fs.readdirSync(modulesDir).filter((name) => {
        const full = path.join(modulesDir, name);
        return fs.statSync(full).isDirectory();
      });
      for (const moduleName of moduleNames) {
        let exportedModels = null;
        // Try index.js first
        try {
          const modelsIndex = path.join(modulesDir, moduleName, 'models', 'index.js');
          if (fs.existsSync(modelsIndex)) {
            // eslint-disable-next-line import/no-dynamic-require, global-require
            const mod = require(modelsIndex);
            exportedModels = (mod && mod.models) ? mod.models : mod;
          }
        } catch (_) { /* ignore */ }
        // Fallback: per-file
        if (!exportedModels) {
          try {
            const modelsDir = path.join(modulesDir, moduleName, 'models');
            if (fs.existsSync(modelsDir)) {
              const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
              exportedModels = {};
              for (const file of files) {
                try {
                  // eslint-disable-next-line import/no-dynamic-require, global-require
                  const factory = require(path.join(modelsDir, file));
                  if (typeof factory === 'function') {
                    let modelInstance = null;
                    try { modelInstance = factory(sequelize); } catch (_) {
                      const base = path.basename(file, '.js');
                      const guess = base.charAt(0).toUpperCase() + base.slice(1);
                      if (sequelize.isDefined && sequelize.isDefined(guess)) {
                        modelInstance = sequelize.model(guess);
                      }
                    }
                    if (modelInstance) {
                      exportedModels[modelInstance.name] = modelInstance;
                    }
                  }
                } catch (_) { /* ignore */ }
              }
            }
          } catch (_) { /* ignore */ }
        }
        if (exportedModels && typeof exportedModels === 'object') {
          for (const key of Object.keys(exportedModels)) {
            const model = exportedModels[key];
            try {
              const tableName = typeof model.getTableName === 'function' ? model.getTableName() : model.tableName;
              if (tableName && !tableToModel.has(tableName)) tableToModel.set(tableName, model);
              const modelName = model && model.name ? String(model.name) : key;
              if (modelName && !nameToModel.has(modelName)) nameToModel.set(modelName, model);
            } catch (_) { /* ignore */ }
          }
        }
      }
    }
  } catch (_) { /* ignore */ }
  try {
    if (fs.existsSync(modulesDir)) {
      const moduleNames = fs.readdirSync(modulesDir).filter((name) => {
        const full = path.join(modulesDir, name);
        return fs.statSync(full).isDirectory();
      });
      for (const moduleName of moduleNames) {
        const configPath = path.join(modulesDir, moduleName, 'config.json');
        if (!fs.existsSync(configPath)) continue;
        try {
          const json = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const settings = Array.isArray(json.settings) ? json.settings : [];
          const moduleKey = String(moduleName || '').toLowerCase();
          const moduleDisplayName = typeof json.name === 'string' ? json.name : moduleName;
          const moduleIcon = typeof json.icon === 'string' ? json.icon : null;
          settings.forEach((s) => {
            if (!s || typeof s !== 'object') return;
            const fields = Array.isArray(s.fields) ? s.fields.filter(Boolean) : [];
            if (!fields.length) return;
            let table = s.table;
            if (!table && s.model) {
              const modelName = String(s.model);
              const model = nameToModel.get(modelName) || nameToModel.get(modelName.trim()) || null;
              if (model) {
                try { table = typeof model.getTableName === 'function' ? model.getTableName() : model.tableName; } catch (_) {}
              }
            }
            if (!table) return;
            settingsDefs.push({
              moduleKey,
              moduleName: moduleDisplayName,
              moduleIcon,
              name: s.name || table,
              table,
              model: s.model || null,
              fields
            });
          });
        } catch (_) { /* ignore invalid module config */ }
      }
    }
  } catch (_) { /* ignore */ }

  res.render('admin', { 
    title: 'Admin',
    user: req.user,
    settingsDefs
  });
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    user: null
  });
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register',
    user: null
  });
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    const role = 'user';

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store user in session for HTML requests
    req.session.userId = user.id;

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fullName: user.getFullName()
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user with password scope
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store user in session for HTML requests
    req.session.userId = user.id;

    // Preselect most recently created entity if user hasn't picked one
    if (!req.session.currentEntityId) {
      const lastEntity = await Entity.findOne({
        where: { user_id: user.id, is_active: true },
        order: [['createdAt', 'DESC']]
      });
      if (lastEntity) {
        req.session.currentEntityId = lastEntity.id;
      }
    }

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fullName: user.getFullName()
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Create entity via HTML form submission
router.post('/entity', authenticateToken, async (req, res) => {
  const prefersJson = req.accepts(['html', 'json']) === 'json';

  try {
    if (!req.user) {
      if (prefersJson) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      return res.redirect('/login');
    }

    const { name, industry, description, website, photo, photoFilename } = req.body || {};
    let demographics = null;
    if (req.body && typeof req.body.demographics !== 'undefined') {
      if (typeof req.body.demographics === 'string' && req.body.demographics.trim()) {
        try {
          demographics = JSON.parse(req.body.demographics);
        } catch (_) {
          if (prefersJson) {
            return res.status(400).json({
              success: false,
              error: 'demographics must be valid JSON',
              code: 'INVALID_DEMOGRAPHICS_JSON'
            });
          }
          return res.redirect('/?openEntityModal=1&entityError=invalid_demographics');
        }
      } else if (req.body.demographics && typeof req.body.demographics === 'object') {
        demographics = req.body.demographics;
      }
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedIndustry = typeof industry === 'string' ? industry.trim() : '';
    const sanitizedDescription = typeof description === 'string' && description.trim() ? description.trim() : null;
    const sanitizedWebsite = typeof website === 'string' && website.trim() ? website.trim() : null;

    if (!trimmedName || !trimmedIndustry) {
      if (prefersJson) {
        return res.status(400).json({
          success: false,
          error: 'Name and industry are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }
      return res.redirect('/?openEntityModal=1&entityError=missing_fields');
    }

    const entity = await Entity.create({
      name: trimmedName,
      industry: trimmedIndustry,
      description: sanitizedDescription,
      website: sanitizedWebsite,
      user_id: req.user.id
    });

    if (demographics) {
      try {
        await CoreDemographic.create({ entityId: entity.id, demographic: demographics });
      } catch (e) {
        // non-fatal for entity creation; log for observability
        console.warn('Failed to persist demographics to core_demographics:', e.message);
      }
    }

    req.session.currentEntityId = entity.id;

    // Handle photo upload to branding/logo category
    if (photo) {
      try {
        const matches = photo.match(/^data:([^;]+);base64,(.*)$/);
        const base64Payload = matches ? matches[2] : photo;
        const buffer = Buffer.from(base64Payload, 'base64');
        const originalName = typeof photoFilename === 'string' && photoFilename.trim() ? photoFilename.trim() : 'entity-logo.png';
        const uploaded = await uploadEntityLogo({ buffer, originalName, entityId: entity.id, publicRead: true });
        if (uploaded && (uploaded.url || uploaded.key)) {
          const url = uploaded.url || getPublicUrl(uploaded.key);
          await entity.update({ photo: url });
        }
      } catch (e) {
        console.warn('Failed to upload entity logo:', e.message);
        // Non-fatal for entity creation
      }
    }

    if (prefersJson) {
      return res.status(201).json({
        success: true,
        entity: {
          id: entity.id,
          name: entity.name,
          industry: entity.industry,
          photo: entity.photo,
          description: entity.description,
          website: entity.website,
          demographics: demographics || null,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt
        }
      });
    }

    return res.redirect('/');
  } catch (error) {
    console.error('Create entity via form error:', error);
    if (prefersJson) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create entity',
        code: 'CREATE_ENTITY_ERROR'
      });
    }
    return res.redirect('/?openEntityModal=1&entityError=server_error');
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        association: 'entities',
        where: { is_active: true },
        required: false
      }]
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fullName: user.getFullName(),
        entities: user.entities || []
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already taken',
          code: 'EMAIL_TAKEN'
        });
      }
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      email: email || user.email
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fullName: user.getFullName()
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    const user = await User.scope('withPassword').findByPk(req.user.id);

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
    
    res.clearCookie('connect.sid');
    res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});
module.exports = router;
