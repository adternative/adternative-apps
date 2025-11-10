const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');
const { getAvailableApps } = require('../utils/appLoader');

const Goal = require('../models/Goal');
const Demographic = require('../models/Demographic');

// Ensure all routes require auth
router.use(authenticateToken);

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
        goals: [],
        demographics: [],
        editingGoal: null
      });
    }

    const entityId = req.currentEntity.id;
    const goalId = req.query.id || null;

    // Load demographics for this entity (for the create widget)
    const demographicRecords = await Demographic.findAll({
      where: { entity_id: entityId },
      order: [['createdAt', 'DESC']]
    });
    // Ensure we render plain data (JSON fields as plain objects)
    const demographics = Array.isArray(demographicRecords) ? demographicRecords.map(r => r.get({ plain: true })) : [];

    // Load goals for this entity with associated demographic
    const goalRecords = await Goal.findAll({
      where: { entity_id: entityId },
      include: [{
        model: Demographic,
        as: 'demographic',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    // Ensure we render plain data (JSON fields as plain objects)
    const goals = Array.isArray(goalRecords) ? goalRecords.map(r => {
      const plain = r.get({ plain: true });
      // Ensure demographic is properly attached
      if (r.demographic) {
        plain.demographic = r.demographic.get({ plain: true });
      }
      return plain;
    }) : [];

    // If editing, load the specific goal
    let editingGoal = null;
    if (goalId) {
      const goalRecord = await Goal.findOne({
        where: { id: goalId, entity_id: entityId },
        include: [{
          model: Demographic,
          as: 'demographic',
          attributes: ['id', 'name']
        }]
      });
      if (goalRecord) {
        editingGoal = goalRecord.get({ plain: true });
        if (goalRecord.demographic) {
          editingGoal.demographic = goalRecord.demographic.get({ plain: true });
        }
      }
    }

    if (prefersJson) {
      return res.json({
        success: true,
        goals,
        demographics,
        editingGoal
      });
    }

    return res.render('goals', {
      title: 'Goals',
      user: req.user,
      goals,
      demographics,
      editingGoal
    });
  } catch (error) {
    console.error('[Goals] Render error:', error);
    res.status(500);
    return res.render('goals', {
      title: 'Goals',
      user: req.user,
      goals: [],
      demographics: [],
      editingGoal: null,
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
    const goalId = req.body.id || null;
    const isUpdate = Boolean(goalId);

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
    const demographicId = typeof demographic_id === 'string' ? demographic_id.trim() : null;
    const demographic = demographicId ? await Demographic.findOne({ where: { id: demographicId, entity_id: entityId } }) : null;
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

    let goal;
    if (isUpdate) {
      // Update existing goal
      const existingGoal = await Goal.findOne({ where: { id: goalId, entity_id: entityId } });
      if (!existingGoal) {
        if (prefersJson) {
          return res.status(404).json({ success: false, error: 'Goal not found', code: 'GOAL_NOT_FOUND' });
        }
        return res.redirect('/goals?error=goal_not_found');
      }

      await existingGoal.update({
        name: trimmedName,
        demographic_id: demographic.id,
        objective,
        priority: finalPriority
      });
      goal = existingGoal;
    } else {
      // Create new goal
      goal = await Goal.create({
        name: trimmedName,
        entity_id: entityId,
        demographic_id: demographic.id,
        objective,
        priority: finalPriority
      });
    }

    if (prefersJson) {
      return res.status(isUpdate ? 200 : 201).json({ success: true, goal });
    }
    return res.redirect(isUpdate ? `/goals?id=${goalId}&updated=1` : '/goals?created=1');
  } catch (error) {
    console.error('[Goals] Save error:', error);
    const prefersJson = req.accepts(['html', 'json']) === 'json';
    if (prefersJson) {
      return res.status(500).json({ success: false, error: 'Failed to save goal', code: 'SAVE_GOAL_ERROR' });
    }
    return res.redirect('/goals?error=server_error');
  }
});


module.exports = router;


