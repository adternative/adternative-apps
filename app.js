var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var entitiesRouter = require('./routes/entities');

// Import middleware and utilities
const { requireAuth } = require('./middleware/global');
const { loadAppRoutes, loadModules, loadModuleDatabases, getAvailableApps } = require('./utils/appLoader');
const { Entity } = require('./models');

// Initialize database
const { syncDatabase } = require('./models');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration with longer duration
app.use(session({
  secret: process.env.SESSION_SECRET || '4ugm3nt3d-c0mmun1c4710n',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Global authentication middleware (except for public routes)
app.use(requireAuth);

// Attach user entities and default-select first entity if none selected
app.use(async (req, res, next) => {
  try {
    // Ensure req.user from session for HTML requests before route-level auth
    if (!req.user && req.session && req.session.userId) {
      const { User } = require('./models');
      const u = await User.findByPk(req.session.userId, { attributes: { exclude: ['password'] } });
      if (u && u.is_active) {
        req.user = u;
      }
    }

    if (!req.user) {
      res.locals.noEntities = false;
      return next();
    }

    const entities = await Entity.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['createdAt', 'DESC']]
    });

    // Attach to user for templates that expect user.entities
    try {
      req.user.entities = entities;
    } catch (_) {}

    // Expose to templates
    res.locals.user = req.user;
    res.locals.noEntities = entities.length === 0;

    // Determine selected entity (prefer session)
    let selected = null;
    if (req.session.currentEntityId) {
      selected = entities.find(e => e.id === req.session.currentEntityId) || null;
    }
    if (!selected && entities.length > 0) {
      selected = entities[0];
      req.session.currentEntityId = selected.id;
    }
    res.locals.selectedEntityId = selected ? selected.id : '';
    res.locals.selectedEntityName = selected ? selected.name : '';

    // Default-select first entity if none selected
    if (!req.session.currentEntityId && entities.length > 0) {
      req.session.currentEntityId = entities[0].id;
    }

    next();
  } catch (e) {
    next();
  }
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/entities', entitiesRouter);

// Legacy aliases: support /app/* and /module/* by redirecting to /*
app.use(['/app', '/module'], (req, res) => {
  const newUrl = req.originalUrl.replace(/^\/(app|module)/, '');
  res.redirect(newUrl || '/');
});

// Load dynamic app routes (legacy) and modules before 404 handler
loadAppRoutes(app);

// Mount module routes synchronously BEFORE 404 handler
const moduleLoadResult = loadModules(app);
if (moduleLoadResult.errors && moduleLoadResult.errors.length > 0) {
  console.warn('[App] Some modules failed to load:', moduleLoadResult.errors);
}
console.log(`[App] Loaded ${moduleLoadResult.loaded} modules`);

// Initialize module databases in background (non-blocking)
(async () => {
  try {
    await loadModuleDatabases();
    console.log('[App] Module databases initialized');
  } catch (error) {
    console.error('[App] Error initializing module databases:', error.message);
  }
})();

// Initialize database connection
syncDatabase();

// Initialize reputation monitoring scheduler (disabled by default, enable via env var)
if (process.env.ENABLE_REPUTATION_SCANNER === 'true') {
  try {
    const { startScheduler } = require('./modules/reputation/scheduler');
    startScheduler(process.env.SCANNER_SCHEDULE || '0 * * * *'); // Default: every hour
    console.log('[App] Reputation monitoring scheduler started');
  } catch (error) {
    console.error('[App] Scheduler init error:', error);
  }
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
