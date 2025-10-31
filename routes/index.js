var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const { User, Entity } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { getAvailableApps } = require('../utils/appLoader');
const { withAvailableApps } = require('../middleware/paywall');

const AUTH_COOKIE_NAME = 'authToken';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/* GET home page - requires authentication */
router.get('/', authenticateToken, withAvailableApps, function(req, res, next) {
  // Render dashboard as the home page
  res.render('home', { 
    title: 'Home',
    user: req.user,
    availableApps: req.availableApps || getAvailableApps()
  });
});


// Render login page
router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    user: null,
    availableApps: getAvailableApps()
  });
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register',
    user: null,
    availableApps: getAvailableApps()
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

    const { name, industry, description, website } = req.body || {};

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

    req.session.currentEntityId = entity.id;

    if (prefersJson) {
      return res.status(201).json({
        success: true,
        entity: {
          id: entity.id,
          name: entity.name,
          industry: entity.industry,
          description: entity.description,
          website: entity.website,
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
