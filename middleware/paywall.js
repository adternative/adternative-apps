const { Op } = require('sequelize');
const { getAvailableApps } = require('../utils/appLoader');
const subscriptionPlans = require('../config/subscriptions');
const { Entity, ModuleSubscription } = require('../models');

// Constants
const ACTIVE_SUBSCRIPTION_STATUSES = ModuleSubscription.ACTIVE_STATUSES || ['active', 'trialing'];
const GRACE_PERIOD_MS = (subscriptionPlans?.gracePeriodDays || 0) * 24 * 60 * 60 * 1000;
const DEFAULT_FREE_MODULES = new Set([]);

// Normalize module key from path or canonical name
const normalizeKey = (key) => String(key || '').trim().toLowerCase();

// Determine if a subscription is considered active (includes grace window)
const isSubscriptionWithinActiveWindow = (periodEnd) => {
  if (!periodEnd) return false;
  const end = new Date(periodEnd).getTime();
  if (Number.isNaN(end)) return false;
  const threshold = Date.now() - GRACE_PERIOD_MS;
  return end >= threshold;
};

// Load active subscription keys for an entity with memoization per request
const loadEntitySubscriptionKeys = async (entityId, req) => {
  if (!entityId) return [];

  // Request-level cache to avoid duplicate queries when multiple paywall checks run
  if (req?._activeSubscriptionKeys && req._activeSubscriptionKeys[entityId]) {
    return req._activeSubscriptionKeys[entityId];
  }

  const boundary = new Date(Date.now() - GRACE_PERIOD_MS);
  const subscriptions = await ModuleSubscription.findAll({
    where: {
      entity_id: entityId,
      status: { [Op.in]: ACTIVE_SUBSCRIPTION_STATUSES },
      current_period_end: { [Op.gt]: boundary }
    }
  });

  const keys = subscriptions
    .filter((sub) => isSubscriptionWithinActiveWindow(sub.current_period_end))
    .map((sub) => normalizeKey(sub.module_key));

  if (req) {
    req._activeSubscriptionKeys = req._activeSubscriptionKeys || {};
    req._activeSubscriptionKeys[entityId] = keys;
  }

  return keys;
};

// Combine legacy allowlists with active subscription keys
const mergeAllowedKeys = (allowedKeys = [], subscriptionKeys = []) => {
  const merged = new Set(DEFAULT_FREE_MODULES);
  allowedKeys.forEach((key) => merged.add(normalizeKey(key)));
  subscriptionKeys.forEach((key) => merged.add(normalizeKey(key)));
  return Array.from(merged);
};

// Resolve the module key from an Express route path like '/core', '/echo', etc.
const resolveModuleKeyFromPath = (path) => {
  if (!path) return '';
  const parts = path.split('/').filter(Boolean);
  return normalizeKey(parts[0] || '');
};

// Extract allowed app keys from current entity metadata
const getEntityAllowedApps = (entity) => {
  if (!entity) return [];

  // Prefer explicit list on integrations or metadata
  const integrations = entity.integrations || {};
  const allowed = integrations.allowedApps || integrations.apps || entity.allowedApps || [];

  // Coerce to array of normalized keys
  if (Array.isArray(allowed)) {
    return allowed.map(normalizeKey);
  }

  // If object map { core: true } convert to keys with truthy values
  if (allowed && typeof allowed === 'object') {
    return Object.keys(allowed).filter((k) => !!allowed[k]).map(normalizeKey);
  }

  return [];
};

// Quietly resolve current entity without sending responses
const loadCurrentEntityQuietly = async (req) => {
  try {
    if (!req.user) return null;

    // Prefer entityId from route params/body, then session
    const entityId = req.params?.entityId || req.body?.entityId || req.session?.currentEntityId;
    if (!entityId) return null;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        user_id: req.user.id,
        is_active: true
      }
    });
    return entity || null;
  } catch (_) {
    return null;
  }
};

// Middleware: attach filtered availableApps for rendering navigation
const withAvailableApps = async (req, res, next) => {
  try {
    const allApps = getAvailableApps();

    // Admins see all apps
    if (req.user && req.user.role === 'admin') {
      req.availableApps = allApps;
      return next();
    }

    // If not authenticated, expose no apps
    if (!req.user) {
      req.availableApps = [];
      return next();
    }

    // Load current entity quietly to determine entitlements
    const entity = await loadCurrentEntityQuietly(req);
    const subscriptionKeys = entity ? await loadEntitySubscriptionKeys(entity.id, req) : [];
    req.entitySubscriptionKeys = subscriptionKeys;

    const allowedKeys = mergeAllowedKeys(getEntityAllowedApps(entity), subscriptionKeys);

  // If no explicit entitlements, only expose genuinely free modules
  if (!entity || allowedKeys.length === 0) {
    const freeApps = allApps
      .filter((app) => DEFAULT_FREE_MODULES.has(resolveModuleKeyFromPath(app.path)))
      .map((app) => ({ ...app, isAccessible: true }));
    req.availableApps = freeApps;
    return next();
  }

    const filtered = allApps.filter((app) => {
      const keyFromPath = resolveModuleKeyFromPath(app.path);
      const keyFromName = normalizeKey(app.name);
      return allowedKeys.includes(keyFromPath) || allowedKeys.includes(keyFromName) || DEFAULT_FREE_MODULES.has(keyFromPath) || DEFAULT_FREE_MODULES.has(keyFromName);
    }).map((app) => ({
      ...app,
      isAccessible: true
    }));

    req.availableApps = filtered;
    next();
  } catch (error) {
    console.error('[Paywall] withAvailableApps error:', error);
    // Fallback: expose nothing to avoid leaking premium links
    req.availableApps = [];
    next();
  }
};

// Middleware factory: require access to a specific app key (e.g., 'core', 'echo')
const requireAppAccess = (appKey) => {
  const requiredKey = normalizeKey(appKey);
  return async (req, res, next) => {
    try {
      if (DEFAULT_FREE_MODULES.has(requiredKey)) {
        return next();
      }

      // Admin bypass
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      // Load current entity quietly
      const entity = await loadCurrentEntityQuietly(req);

      const subscriptionKeys = req.entitySubscriptionKeys || await loadEntitySubscriptionKeys(entity?.id, req);
      const allowedKeys = mergeAllowedKeys(getEntityAllowedApps(entity), subscriptionKeys);

      if (!allowedKeys.includes(requiredKey)) {
        return res.status(402).json({
          error: 'App access requires an active subscription for this entity',
          code: 'APP_ACCESS_DENIED',
          app: requiredKey,
        });
      }

      next();
    } catch (error) {
      console.error('[Paywall] requireAppAccess error:', error);
      return res.status(500).json({
        error: 'Paywall validation error',
        code: 'PAYWALL_ERROR'
      });
    }
  };
};

module.exports = {
  withAvailableApps,
  requireAppAccess
};


