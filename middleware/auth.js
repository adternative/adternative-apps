const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token or session
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies && req.cookies.authToken ? req.cookies.authToken : null;
    const token = headerToken || cookieToken;
    const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');

    // Check for session-based authentication first (for HTML requests)
    if (!req.user && isHtmlRequest && req.session && req.session.userId) {
      const user = await User.findByPk(req.session.userId, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.is_active) {
        req.user = user;
        return next();
      }
    }

    // Check for JWT token
    if (!token) {
      if (isHtmlRequest) {
        return res.redirect('/login');
      }
      
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if still active (skip if already set)
    const user = req.user || await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.is_active) {
      if (isHtmlRequest) {
        return res.redirect('/login');
      }
      
      return res.status(401).json({ 
        error: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }

    // Store user in session for HTML requests
    if (isHtmlRequest) {
      req.session.userId = user.id;
    }

    req.user = user;
    // Ensure downstream middlewares can reuse the bearer token when it originated from cookies
    if (!authHeader && cookieToken) {
      req.headers.authorization = `Bearer ${cookieToken}`;
    }
    next();
  } catch (error) {
    const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');
    
    if (error.name === 'JsonWebTokenError') {
      if (isHtmlRequest) {
        return res.redirect('/login');
      }
      
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      if (isHtmlRequest) {
        return res.redirect('/login');
      }
      
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Middleware to check if user owns an entity
const requireEntityOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const entityId = req.params.entityId || req.body.entityId;
    
    if (!entityId) {
      return res.status(400).json({ 
        error: 'Entity ID required',
        code: 'ENTITY_ID_REQUIRED'
      });
    }

    const { Entity } = require('../models');
    const entity = await Entity.findOne({
      where: {
        id: entityId,
        userId: req.user.id,
        is_active: true
      }
    });

    if (!entity) {
      return res.status(403).json({ 
        error: 'Entity not found or access denied',
        code: 'ENTITY_ACCESS_DENIED'
      });
    }

    req.entity = entity;
    next();
  } catch (error) {
    console.error('Entity ownership middleware error:', error);
    return res.status(500).json({ 
      error: 'Entity ownership verification error',
      code: 'ENTITY_VERIFICATION_ERROR'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies && req.cookies.authToken ? req.cookies.authToken : null;
    const token = headerToken || cookieToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireEntityOwnership,
  optionalAuth
};
