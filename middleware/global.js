const { authenticateToken } = require('./auth');

// Global authentication middleware - redirects unauthenticated users to login
const requireAuth = (req, res, next) => {
  // Skip auth for public routes
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Check if user is authenticated via session
  if (req.session && req.session.userId) {
    return next();
  }

  // Check for JWT token in Authorization header
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies && req.cookies.authToken ? req.cookies.authToken : null;
  const token = headerToken || cookieToken;

  if (token) {
    if (!authHeader && cookieToken) {
      req.headers.authorization = `Bearer ${cookieToken}`;
    }
    // Use existing JWT auth middleware
    return authenticateToken(req, res, next);
  }

  // Redirect to login if not authenticated
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.redirect('/login');
  }

  // Return JSON error for API requests
  return res.status(401).json({
    error: 'Authentication required',
    code: 'AUTH_REQUIRED'
  });
};

module.exports = { requireAuth };
