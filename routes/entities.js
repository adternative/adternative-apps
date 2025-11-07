const express = require('express');
const { Op } = require('sequelize');
const { Entity, ModuleSubscription } = require('../models');
const { uploadEntityLogo } = require('../config/storage');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { currentEntity, requireCurrentEntity, getUserEntities, switchEntity } = require('../middleware/entity');
const { PlatformAccount } = require('../modules/flow/models');
const { getAvailableApps } = require('../utils/appLoader');
const subscriptionPlans = require('../config/subscriptions');

const ACTIVE_SUBSCRIPTION_STATUSES = ModuleSubscription.ACTIVE_STATUSES || ['active', 'trialing'];
const GRACE_PERIOD_MS = (subscriptionPlans?.gracePeriodDays || 0) * 24 * 60 * 60 * 1000;
const DEFAULT_CURRENCY = subscriptionPlans?.defaultCurrency || 'USD';
const FALLBACK_MODULE_PLANS = subscriptionPlans.modules || {};

const normalizeModuleKey = (key) => String(key || '').trim().toLowerCase();

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const calculatePeriodEnd = (start, interval) => {
  if (interval === 'yearly') {
    return addYears(start, 1);
  }
  return addMonths(start, 1);
};

const isActiveSubscription = (subscription) => {
  if (!subscription) return false;
  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
    return false;
  }
  const endTime = new Date(subscription.current_period_end).getTime();
  if (Number.isNaN(endTime)) return false;
  return endTime >= Date.now() - GRACE_PERIOD_MS;
};

const coerceAmount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
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
  const amount = coerceAmount(plan.amount);
  if (amount === null) {
    return null;
  }
  const currency = (typeof plan.currency === 'string' && plan.currency.trim())
    ? plan.currency.trim().toUpperCase()
    : DEFAULT_CURRENCY;
  return { amount, currency };
};

const normalizePlanSet = (planSet) => {
  if (!planSet || typeof planSet !== 'object') {
    return {};
  }
  const normalized = {};
  const monthly = normalizePlanDetails(planSet.monthly);
  if (monthly) {
    normalized.monthly = monthly;
  }
  const yearly = normalizePlanDetails(planSet.yearly);
  if (yearly) {
    normalized.yearly = yearly;
  }
  return normalized;
};

const mergePlanSets = (primary, fallback) => {
  const normalizedPrimary = normalizePlanSet(primary);
  const normalizedFallback = normalizePlanSet(fallback);
  return {
    monthly: normalizedPrimary.monthly || normalizedFallback.monthly || null,
    yearly: normalizedPrimary.yearly || normalizedFallback.yearly || null
  };
};

const getModuleCatalogMap = () => {
  const apps = getAvailableApps();
  const catalog = new Map();

  apps.forEach((app) => {
    const moduleKey = normalizeModuleKey(app.key || app.path?.replace(/^\//, '') || '');
    if (!moduleKey) {
      return;
    }

    const plans = mergePlanSets(app.pricing, FALLBACK_MODULE_PLANS[moduleKey]);

    catalog.set(moduleKey, {
      moduleKey,
      name: app.name,
      icon: app.icon || null,
      description: app.description || null,
      plans
    });
  });

  // Include fallback-only modules that might not have routes yet
  Object.entries(FALLBACK_MODULE_PLANS).forEach(([key, config]) => {
    const normalizedKey = normalizeModuleKey(key);
    if (catalog.has(normalizedKey)) {
      return;
    }
    const plans = mergePlanSets(null, config);
    catalog.set(normalizedKey, {
      moduleKey: normalizedKey,
      name: config.label || normalizedKey.toUpperCase(),
      icon: null,
      description: config.description || null,
      plans
    });
  });

  return catalog;
};

const buildModuleCatalog = () => Array.from(getModuleCatalogMap().values());

const findModulePlan = (moduleKey) => {
  if (!moduleKey) {
    return null;
  }
  const catalog = getModuleCatalogMap();
  return catalog.get(normalizeModuleKey(moduleKey))?.plans || null;
};

const findEntityForUser = async (userId, entityId) => {
  if (!userId || !entityId) return null;
  return Entity.findOne({
    where: {
      id: entityId,
      user_id: userId,
      is_active: true
    }
  });
};

const formatSubscriptionResponse = (subscription) => ({
  id: subscription.id,
  moduleKey: subscription.module_key,
  planInterval: subscription.plan_interval,
  status: subscription.status,
  price: {
    amount: subscription.price_amount,
    currency: subscription.price_currency
  },
  currentPeriodStart: subscription.current_period_start,
  currentPeriodEnd: subscription.current_period_end,
  cancelAtPeriodEnd: subscription.cancel_at_period_end,
  canceledAt: subscription.canceled_at,
  isActive: isActiveSubscription(subscription)
});

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's entities
router.get('/', getUserEntities, async (req, res) => {
  try {
    res.json({
      success: true,
      entities: req.userEntities.map(entity => ({
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        photo: entity.photo,
        description: entity.description,
        website: entity.website,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({
      error: 'Failed to fetch entities',
      code: 'FETCH_ENTITIES_ERROR'
    });
  }
});

// Get current entity
router.get('/current', currentEntity, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.status(404).json({
        error: 'No entity selected',
        code: 'NO_ENTITY_SELECTED'
      });
    }

    res.json({
      success: true,
      entity: {
        id: req.currentEntity.id,
        name: req.currentEntity.name,
        industry: req.currentEntity.industry,
        photo: req.currentEntity.photo,
        description: req.currentEntity.description,
        website: req.currentEntity.website,
        socialMediaPlatforms: req.currentEntity.socialMediaPlatforms,
        googleSearchConsole: req.currentEntity.googleSearchConsole,
        integrations: req.currentEntity.integrations,
        createdAt: req.currentEntity.createdAt,
        updatedAt: req.currentEntity.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current entity error:', error);
    res.status(500).json({
      error: 'Failed to fetch current entity',
      code: 'FETCH_CURRENT_ENTITY_ERROR'
    });
  }
});

// Create new entity
router.post('/', async (req, res) => {
  try {
    const { name, industry, description, website, photo } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        error: 'Name and industry are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    

    const entity = await Entity.create({
      name,
      industry,
      description,
      website,
      user_id: req.user.id
    });

    if (photo) {
      const uploaded = await uploadEntityLogo({ buffer: Buffer.from(photo, 'base64'), originalName: 'entity-photo.png', entityId: entity.id, publicRead: true });
      if (uploaded && (uploaded.url || uploaded.key)) {
        const url = uploaded.url || require('../config/storage').getPublicUrl(uploaded.key);
        await entity.update({ photo: url });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Entity created successfully',
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        photo: entity.photo,
        description: entity.description,
        website: entity.website,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({
      error: 'Failed to create entity',
      code: 'CREATE_ENTITY_ERROR'
    });
  }
});

// List subscriptions for an entity
router.get('/:entityId/subscriptions', async (req, res) => {
  try {
    const { entityId } = req.params;
    const entity = await findEntityForUser(req.user?.id, entityId);

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    const subscriptions = await ModuleSubscription.findAll({
      where: { entity_id: entityId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      entity: {
        id: entity.id,
        name: entity.name
      },
      subscriptions: subscriptions.map(formatSubscriptionResponse),
      catalog: buildModuleCatalog()
    });
  } catch (error) {
    console.error('List entity subscriptions error:', error);
    res.status(500).json({
      error: 'Failed to fetch subscriptions',
      code: 'LIST_SUBSCRIPTIONS_ERROR'
    });
  }
});

// Create or renew a subscription for a module
router.post('/:entityId/subscriptions', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { moduleKey, planInterval, metadata } = req.body || {};

    if (!moduleKey || !planInterval) {
      return res.status(400).json({
        error: 'moduleKey and planInterval are required',
        code: 'MISSING_SUBSCRIPTION_FIELDS'
      });
    }

    const normalizedModuleKey = normalizeModuleKey(moduleKey);
    const interval = normalizeModuleKey(planInterval);

    if (!['monthly', 'yearly'].includes(interval)) {
      return res.status(400).json({
        error: 'planInterval must be either monthly or yearly',
        code: 'INVALID_PLAN_INTERVAL'
      });
    }

    const entity = await findEntityForUser(req.user?.id, entityId);
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    const modulePlan = findModulePlan(normalizedModuleKey);
    if (!modulePlan || !modulePlan[interval]) {
      return res.status(400).json({
        error: 'Requested module plan is not available',
        code: 'MODULE_PLAN_UNAVAILABLE'
      });
    }

    const activeExisting = await ModuleSubscription.findOne({
      where: {
        entity_id: entityId,
        module_key: normalizedModuleKey,
        status: { [Op.in]: ACTIVE_SUBSCRIPTION_STATUSES },
        current_period_end: { [Op.gt]: new Date(Date.now() - GRACE_PERIOD_MS) }
      }
    });

    if (activeExisting) {
      return res.status(409).json({
        error: 'An active subscription already exists for this module',
        code: 'SUBSCRIPTION_ALREADY_ACTIVE',
        subscriptionId: activeExisting.id
      });
    }

    const now = new Date();
    const periodEnd = calculatePeriodEnd(now, interval);
    const priceCurrency = modulePlan[interval].currency || subscriptionPlans.defaultCurrency || 'USD';
    const priceAmount = typeof modulePlan[interval].amount === 'number' ? modulePlan[interval].amount : 0;

    const subscription = await ModuleSubscription.create({
      entity_id: entityId,
      module_key: normalizedModuleKey,
      plan_interval: interval,
      status: 'active',
      price_amount: priceAmount,
      price_currency: priceCurrency,
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      metadata: metadata && typeof metadata === 'object' ? metadata : null
    });

    res.status(201).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: formatSubscriptionResponse(subscription)
    });
  } catch (error) {
    console.error('Create entity subscription error:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      code: 'CREATE_SUBSCRIPTION_ERROR'
    });
  }
});

// Update subscription plan interval or metadata
router.patch('/:entityId/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { entityId, subscriptionId } = req.params;
    const { planInterval, cancelAtPeriodEnd, metadata } = req.body || {};

    const entity = await findEntityForUser(req.user?.id, entityId);
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    const subscription = await ModuleSubscription.findOne({
      where: {
        id: subscriptionId,
        entity_id: entityId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    const updates = {};
    let intervalUpdated = false;

    if (planInterval) {
      const interval = normalizeModuleKey(planInterval);
      if (!['monthly', 'yearly'].includes(interval)) {
        return res.status(400).json({
          error: 'planInterval must be either monthly or yearly',
          code: 'INVALID_PLAN_INTERVAL'
        });
      }

      const modulePlan = findModulePlan(subscription.module_key);
      if (!modulePlan || !modulePlan[interval]) {
        return res.status(400).json({
          error: 'Requested module plan is not available',
          code: 'MODULE_PLAN_UNAVAILABLE'
        });
      }

      const now = new Date();
      updates.plan_interval = interval;
      updates.price_amount = typeof modulePlan[interval].amount === 'number' ? modulePlan[interval].amount : 0;
      updates.price_currency = modulePlan[interval].currency || subscription.price_currency || subscriptionPlans.defaultCurrency || 'USD';
      updates.current_period_start = now;
      updates.current_period_end = calculatePeriodEnd(now, interval);
      updates.status = 'active';
      updates.cancel_at_period_end = false;
      updates.canceled_at = null;
      intervalUpdated = true;
    }

    if (typeof cancelAtPeriodEnd === 'boolean') {
      updates.cancel_at_period_end = cancelAtPeriodEnd;

      if (!cancelAtPeriodEnd && subscription.cancel_at_period_end) {
        updates.status = subscription.status === 'canceled' ? 'active' : subscription.status;
        updates.canceled_at = null;
      }
    }

    if (metadata && typeof metadata === 'object') {
      updates.metadata = metadata;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided for subscription',
        code: 'NO_SUBSCRIPTION_UPDATES'
      });
    }

    await subscription.update(updates);

    // Reload if the interval was updated to ensure calculated fields are current
    if (intervalUpdated) {
      await subscription.reload();
    }

    res.json({
      success: true,
      subscription: formatSubscriptionResponse(subscription)
    });
  } catch (error) {
    console.error('Update entity subscription error:', error);
    res.status(500).json({
      error: 'Failed to update subscription',
      code: 'UPDATE_SUBSCRIPTION_ERROR'
    });
  }
});

// Cancel a subscription (either immediately or at period end)
router.post('/:entityId/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { entityId, subscriptionId } = req.params;
    const { cancelAtPeriodEnd = true } = req.body || {};

    const entity = await findEntityForUser(req.user?.id, entityId);
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    const subscription = await ModuleSubscription.findOne({
      where: {
        id: subscriptionId,
        entity_id: entityId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    if (cancelAtPeriodEnd) {
      await subscription.update({
        cancel_at_period_end: true,
        status: ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) ? subscription.status : 'active'
      });
    } else {
      const now = new Date();
      await subscription.update({
        cancel_at_period_end: false,
        status: 'canceled',
        canceled_at: now,
        current_period_end: now
      });
    }

    res.json({
      success: true,
      subscription: formatSubscriptionResponse(subscription)
    });
  } catch (error) {
    console.error('Cancel entity subscription error:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      code: 'CANCEL_SUBSCRIPTION_ERROR'
    });
  }
});

// Get specific entity
router.get('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        user_id: req.user.id,
        is_active: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        photo: entity.photo,
        description: entity.description,
        website: entity.website,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Get entity error:', error);
    res.status(500).json({
      error: 'Failed to fetch entity',
      code: 'FETCH_ENTITY_ERROR'
    });
  }
});

// Update entity
router.put('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { name, industry, description, website } = req.body;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        user_id: req.user.id,
        is_active: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    await entity.update({
      name: name || entity.name,
      industry: industry || entity.industry,
      description: description !== undefined ? description : entity.description,
      website: website !== undefined ? website : entity.website,
    });

    res.json({
      success: true,
      message: 'Entity updated successfully',
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        photo: entity.photo,
        description: entity.description,
        website: entity.website,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({
      error: 'Failed to update entity',
      code: 'UPDATE_ENTITY_ERROR'
    });
  }
});

// Update entity photo
router.put('/:entityId/photo', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { photoData, photoFilename, remove } = req.body || {};

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        user_id: req.user.id,
        is_active: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    if (remove === true) {
      await entity.update({ photo: null });
      return res.json({ success: true, message: 'Photo removed', photo: null });
    }

    if (!photoData || typeof photoData !== 'string') {
      return res.status(400).json({
        error: 'photoData (base64) is required',
        code: 'MISSING_PHOTO_DATA'
      });
    }

    const matches = photoData.match(/^data:([^;]+);base64,(.*)$/);
    const base64Payload = matches ? matches[2] : photoData;
    const buffer = Buffer.from(base64Payload, 'base64');
    const originalName = typeof photoFilename === 'string' && photoFilename.trim() ? photoFilename.trim() : 'entity-photo.png';
    const uploaded = await uploadEntityLogo({ buffer, originalName, entityId: entity.id, publicRead: true });
    const url = uploaded && (uploaded.url || (uploaded.key ? require('../config/storage').getPublicUrl(uploaded.key) : null));
    if (!url) {
      return res.status(500).json({ error: 'Upload failed', code: 'PHOTO_UPLOAD_FAILED' });
    }
    await entity.update({ photo: url });

    return res.json({ success: true, message: 'Photo updated', photo: url, entityId: entity.id });
  } catch (error) {
    console.error('Update entity photo error:', error);
    res.status(500).json({
      error: 'Failed to update photo',
      code: 'UPDATE_PHOTO_ERROR'
    });
  }
});

// Delete entity (soft delete)
router.delete('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        user_id: req.user.id,
        is_active: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    await entity.update({ is_active: false });

    res.json({
      success: true,
      message: 'Entity deleted successfully'
    });
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({
      error: 'Failed to delete entity',
      code: 'DELETE_ENTITY_ERROR'
    });
  }
});

// Switch current entity
router.post('/switch', switchEntity);

// Connect a social platform account to the current entity
router.post('/accounts', currentEntity, async (req, res) => {
  try {
    const entityId = req.currentEntity && req.currentEntity.id || req.body.entity_id;
    if (!entityId) return res.status(400).json({ success: false, error: 'No entity selected' });
    const { platform, account_name, account_id } = req.body || {};
    if (!platform || !account_name || !account_id) {
      return res.status(400).json({ success: false, error: 'platform, account_name and account_id are required' });
    }
    const allowed = ['facebook','instagram','tiktok','linkedin','twitter','google','youtube'];
    if (!allowed.includes(platform)) {
      return res.status(400).json({ success: false, error: 'Invalid platform' });
    }
    // Ensure the entity belongs to current user
    const entity = await Entity.findOne({ where: { id: entityId, user_id: req.user.id, is_active: true } });
    if (!entity) return res.status(404).json({ success: false, error: 'Entity not found' });
    // Create platform account
    const acc = await PlatformAccount.create({ entity_id: entityId, platform, account_name, account_id, is_active: true, details: {} });
    res.json({ success: true, account: acc });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
