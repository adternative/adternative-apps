const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');
const { withAvailableApps } = require('../middleware/paywall');
const { getAvailableApps } = require('../utils/appLoader');

const Goal = require('../models/Goal');
const Demographic = require('../models/Demographic');

// Ensure all routes require auth and load available apps for sidebar
router.use(authenticateToken, withAvailableApps);

// GET /goals – Render goals page for current entity
router.get('/', currentEntity, async (req, res) => {
  try {
    const prefersJson = req.accepts(['html', 'json']) === 'json';

    // If no entity selected, render page (frame will prompt entity creation)
    if (!req.currentEntity) {
      if (prefersJson) {
        return res.status(400).json({
          success: false,
          error: 'No entity selected',
          code: 'NO_ENTITY_SELECTED'
        });
      }
      return res.render('goals', {
        title: 'Goals',
        user: req.user,
        availableApps: req.availableApps || getAvailableApps(),
        goals: [],
        demographics: []
      });
    }

    const entityId = req.currentEntity.id;

    // Load demographics for this entity (for the create widget)
    const demographics = await Demographic.findAll({
      where: { entity_id: entityId },
      order: [['created_at', 'DESC']]
    });

    // Load goals for this entity
    const goals = await Goal.findAll({
      where: { entity_id: entityId },
      order: [['created_at', 'DESC']]
    });

    if (prefersJson) {
      return res.json({
        success: true,
        goals,
        demographics
      });
    }

    return res.render('goals', {
      title: 'Goals',
      user: req.user,
      availableApps: req.availableApps || getAvailableApps(),
      goals,
      demographics
    });
  } catch (error) {
    console.error('[Goals] Render error:', error);
    res.status(500);
    return res.render('goals', {
      title: 'Goals',
      user: req.user,
      availableApps: req.availableApps || getAvailableApps(),
      goals: [],
      demographics: [],
      error: 'Failed to load goals'
    });
  }
});

// POST /goals – Create a new goal for the current entity
router.post('/', currentEntity, async (req, res) => {
  try {
    const prefersJson = req.accepts(['html', 'json']) === 'json';

    if (!req.currentEntity) {
      if (prefersJson) {
        return res.status(400).json({ success: false, error: 'No entity selected', code: 'NO_ENTITY_SELECTED' });
      }
      return res.redirect('/goals?error=no_entity');
    }

    const entityId = req.currentEntity.id;

    const {
      name,
      demographic_id,
      kpi,
      metric,
      current_value,
      target_value,
      budget,
      priority
    } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      if (prefersJson) {
        return res.status(400).json({ success: false, error: 'name is required', code: 'MISSING_NAME' });
      }
      return res.redirect('/goals?error=missing_name');
    }

    // Validate demographic belongs to current entity
    const demographicIdNum = demographic_id ? Number(demographic_id) : null;
    const demographic = demographicIdNum ? await Demographic.findOne({ where: { id: demographicIdNum, entityId } }) : null;
    if (!demographic) {
      if (prefersJson) {
        return res.status(400).json({ success: false, error: 'Invalid demographic', code: 'INVALID_DEMOGRAPHIC' });
      }
      return res.redirect('/goals?error=invalid_demographic');
    }

    // Validate objective fields
    const allowedKpis = ['awareness', 'leads', 'sales', 'retention'];
    const allowedMetrics = ['reach', 'impressions', 'ctr', 'cpa', 'roas', 'bounce rate'];
    const selectedKpi = typeof kpi === 'string' ? kpi.trim().toLowerCase() : '';
    const selectedMetric = typeof metric === 'string' ? metric.trim().toLowerCase() : '';
    if (!allowedKpis.includes(selectedKpi) || !allowedMetrics.includes(selectedMetric)) {
      if (prefersJson) {
        return res.status(400).json({ success: false, error: 'Invalid kpi or metric', code: 'INVALID_OBJECTIVE' });
      }
      return res.redirect('/goals?error=invalid_objective');
    }

    // Coerce numbers
    const coerceNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const currentValueNum = coerceNum(current_value);
    const targetValueNum = coerceNum(target_value);
    const budgetNum = coerceNum(budget);

    if (targetValueNum === null || budgetNum === null) {
      if (prefersJson) {
        return res.status(400).json({ success: false, error: 'target_value and budget are required', code: 'MISSING_NUMERIC_FIELDS' });
      }
      return res.redirect('/goals?error=missing_fields');
    }

    const priorityVal = (typeof priority === 'string' ? priority.trim().toLowerCase() : 'medium');
    const allowedPriorities = ['low', 'medium', 'high'];
    const finalPriority = allowedPriorities.includes(priorityVal) ? priorityVal : 'medium';

    const objective = {
      kpi: selectedKpi,
      metric: selectedMetric,
      current_value: currentValueNum,
      target_value: targetValueNum,
      budget: budgetNum
    };

    const goal = await Goal.create({
      name: trimmedName,
      entity_id: entityId,
      demographic_id: demographic.id,
      objective,
      priority: finalPriority
    });

    if (prefersJson) {
      return res.status(201).json({ success: true, goal });
    }
    return res.redirect('/goals?created=1');
  } catch (error) {
    console.error('[Goals] Create error:', error);
    const prefersJson = req.accepts(['html', 'json']) === 'json';
    if (prefersJson) {
      return res.status(500).json({ success: false, error: 'Failed to create goal', code: 'CREATE_GOAL_ERROR' });
    }
    return res.redirect('/goals?error=server_error');
  }
});

module.exports = router;


