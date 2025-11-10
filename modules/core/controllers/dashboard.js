const path = require('path');

const { getAvailableApps } = require('../../../utils/appLoader');
const { ensureReady } = require('../database');
// The original entity and recommendation controllers may be absent in this branch.
// For resilience, we lazily require them and fall back to light-weight defaults.
let getOrCreateCoreEntity;
let fetchAnalyticsSnapshot;
let runRecommendationEngine;
let getLatestRecommendation;
try {
  ({ getOrCreateCoreEntity, fetchAnalyticsSnapshot } = require('./entity'));
} catch (_) {
  getOrCreateCoreEntity = async (baseEntity) => baseEntity;
  fetchAnalyticsSnapshot = async () => ({ traffic: {}, audience: {} });
}
try {
  ({ runRecommendationEngine, getLatestRecommendation } = require('./recommendation'));
} catch (_) {
  runRecommendationEngine = async () => ({ recommendation: {}, scores: [], allocation: [], outcomes: {}, aiNarrative: null });
  getLatestRecommendation = async () => null;
}

// Goal-based channel scoring
const { computeChannelScores } = require('../utils/channelScoring');
const { DEFAULT_CHANNELS } = require('../utils/mockData');
const Demographic = require('../../../models/Demographic');
const Goal = require('../../../models/Goal');

const DASHBOARD_VIEW = path.join(__dirname, '..', 'views', 'index.pug');
const RECOMMENDATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const toPlain = (maybeModel) => {
  if (!maybeModel) return null;
  if (typeof maybeModel.get === 'function') {
    return maybeModel.get({ plain: true });
  }
  return maybeModel;
};

const parseTimestamp = (input) => {
  if (!input) return null;
  const timestamp = new Date(input).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const isRecommendationStale = (record) => {
  if (!record) return true;
  const generatedAt = parseTimestamp(record.generatedAt || record.generated_at || record.updatedAt);
  if (!generatedAt) return true;
  return Date.now() - generatedAt > RECOMMENDATION_TTL_MS;
};

const loadRecommendationBundle = async ({ coreEntity, analytics, skipRefreshWhenStale = false }) => {
  const latest = await getLatestRecommendation(coreEntity.id);

  if (latest && !isRecommendationStale(latest)) {
    return {
      recommendation: latest,
      scores: latest.recommendedChannels || [],
      allocation: latest.suggestedBudgets || [],
      outcomes: latest.estimatedOutcomes || {},
      aiNarrative: latest.aiNarrative || null,
      refreshed: false,
      benchmark: null,
      socialSignals: null,
      platformSignals: null
    };
  }

  if (skipRefreshWhenStale) {
    // Avoid heavy work when the caller doesn't need a fresh bundle
    return {
      recommendation: latest || {},
      scores: (latest && latest.recommendedChannels) || [],
      allocation: (latest && latest.suggestedBudgets) || [],
      outcomes: (latest && latest.estimatedOutcomes) || {},
      aiNarrative: (latest && latest.aiNarrative) || null,
      refreshed: false,
      benchmark: null,
      socialSignals: null,
      platformSignals: null
    };
  }

  const result = await runRecommendationEngine({ coreEntity, analytics });
  const recommendation = result.recommendation || {};

  return {
    recommendation,
    scores: result.scores || recommendation.recommendedChannels || [],
    allocation: result.allocation || recommendation.suggestedBudgets || [],
    outcomes: result.outcomes || recommendation.estimatedOutcomes || {},
    aiNarrative: result.aiNarrative || recommendation.aiNarrative || null,
    refreshed: true,
    benchmark: result.benchmark || null,
    socialSignals: result.socialSignals || null,
    platformSignals: result.platformSignals || null
  };
};

const buildDashboardContext = ({
  req,
  baseEntity,
  coreEntity,
  analytics,
  bundle
}) => {
  const entityProfile = toPlain(coreEntity) || toPlain(baseEntity) || {};
  const {
    recommendation,
    scores,
    allocation,
    outcomes,
    aiNarrative,
    refreshed,
    benchmark,
    socialSignals,
    platformSignals
  } = bundle;

  return {
    title: 'CORE • Intelligence',
    user: req.user,
    entity: entityProfile,
    analytics: analytics || {},
    scores: scores || recommendation.recommendedChannels || [],
    allocation: allocation || recommendation.suggestedBudgets || [],
    outcomes: outcomes || recommendation.estimatedOutcomes || {},
    aiNarrative: aiNarrative ?? recommendation.aiNarrative ?? null,
    updatedAt: recommendation.generatedAt || recommendation.updatedAt || new Date().toISOString(),
    refreshed,
    appName: 'CORE',
    coreEntity: entityProfile,
    benchmark: benchmark || null,
    socialSignals: socialSignals || null,
    platformSignals: platformSignals || null
  };
};

const ensureEntityContext = (req) => {
  if (req.currentEntity) {
    return req.currentEntity;
  }

  throw Object.assign(new Error('No active entity selected'), { status: 400, code: 'NO_ENTITY' });
};

const renderDashboard = async (req, res) => {
  try {
    const baseEntity = ensureEntityContext(req);

    await ensureReady();

    const analytics = await fetchAnalyticsSnapshot(baseEntity.id);
    const coreEntity = await getOrCreateCoreEntity(baseEntity);

    // Determine goal before loading the bundle to optionally skip heavy refresh
    const selectedGoalRaw = (req.query && req.query.goal) ? String(req.query.goal).toLowerCase() : '';
    const allowedGoals = ['awareness', 'leads', 'sales', 'retention'];
    const normalizeGoal = (g) => {
      if (g === 'retention') return 'sales';
      if (allowedGoals.includes(g)) return g;
      return '';
    };
    const selectedGoal = normalizeGoal(selectedGoalRaw);

    const bundle = await loadRecommendationBundle({ coreEntity, analytics, skipRefreshWhenStale: Boolean(selectedGoal) });

    const context = buildDashboardContext({
      req,
      baseEntity,
      coreEntity,
      analytics,
      bundle
    });

    // Attempt to load demographics for the current entity for the Create Goal widget
    let demographics = [];
    try {
      if (req.currentEntity && req.currentEntity.id) {
        demographics = await Demographic.findAll({
          attributes: ['id', 'name'],
          where: { entity_id: req.currentEntity.id },
          order: [['createdAt', 'DESC']]
        });
      }
    } catch (err) {
      console.warn('[CORE] Failed to load demographics for widget:', err && err.message);
    }
    context.demographics = Array.isArray(demographics) ? demographics : [];

    // Load goals for the current entity for the Match channels by goal widget
    let goals = [];
    try {
      if (req.currentEntity && req.currentEntity.id) {
        const goalRecords = await Goal.findAll({
          attributes: ['id', 'name', 'objective'],
          where: { entity_id: req.currentEntity.id },
          order: [['createdAt', 'DESC']]
        });
        goals = Array.isArray(goalRecords) ? goalRecords.map(r => r.get({ plain: true })) : [];
      }
    } catch (err) {
      console.warn('[CORE] Failed to load goals for widget:', err && err.message);
    }
    context.goals = Array.isArray(goals) ? goals : [];

    // If a goal is selected, recompute channel scores using the goal bias and default channels
    if (selectedGoal) {
      const entityProfile = { ...(context.entity || {}), goals: selectedGoal };
      const benchmark = context.benchmark || {};
      const platformSignals = context.platformSignals || {};
      const socialSignals = context.socialSignals || {};
      const analyticsSnapshot = context.analytics || {};
      const channels = DEFAULT_CHANNELS;

      const matchyScores = computeChannelScores({
        channels,
        entityProfile,
        benchmark,
        platformSignals,
        socialSignals,
        analytics: analyticsSnapshot
      });

      context.scores = matchyScores;
      context.selectedGoal = selectedGoal;
    } else {
      context.selectedGoal = '';
    }

    res.render(DASHBOARD_VIEW, context);
  } catch (error) {
    console.error('[CORE] renderDashboard error:', error);
    const status = error.status || 500;
    res.status(status).render('error', {
      message: 'Unable to load CORE dashboard',
      error
    });
  }
};

const getSummary = async (req, res) => {
  try {
    const baseEntity = ensureEntityContext(req);

    await ensureReady();

    const analytics = await fetchAnalyticsSnapshot(baseEntity.id);
    const coreEntity = await getOrCreateCoreEntity(baseEntity);
    const bundle = await loadRecommendationBundle({ coreEntity, analytics });

    const { recommendation, scores, allocation, outcomes, aiNarrative, refreshed, benchmark, socialSignals, platformSignals } = bundle;

    res.json({
      entityId: coreEntity.id,
      baseEntityId: coreEntity.baseEntityId,
      generatedAt: recommendation.generatedAt || recommendation.updatedAt || null,
      refreshed,
      scores: scores || recommendation.recommendedChannels || [],
      allocation: allocation || recommendation.suggestedBudgets || [],
      outcomes: outcomes || recommendation.estimatedOutcomes || {},
      aiNarrative: aiNarrative ?? recommendation.aiNarrative ?? null,
      analytics: analytics || {},
      benchmark,
      socialSignals,
      platformSignals
    });
  } catch (error) {
    console.error('[CORE] getSummary error:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: 'Failed to load CORE summary',
      code: error.code || 'CORE_SUMMARY_ERROR'
    });
  }
};

const triggerRefresh = async (req, res) => {
  try {
    const baseEntity = ensureEntityContext(req);

    await ensureReady();

    const analytics = await fetchAnalyticsSnapshot(baseEntity.id);
    const coreEntity = await getOrCreateCoreEntity(baseEntity);
    const result = await runRecommendationEngine({ coreEntity, analytics });
    const recommendation = result.recommendation || {};

    res.json({
      message: 'CORE recommendations refreshed',
      entityId: coreEntity.id,
      baseEntityId: coreEntity.baseEntityId,
      generatedAt: recommendation.generatedAt || null,
      scores: result.scores || recommendation.recommendedChannels || [],
      allocation: result.allocation || recommendation.suggestedBudgets || [],
      outcomes: result.outcomes || recommendation.estimatedOutcomes || {},
      aiNarrative: result.aiNarrative || recommendation.aiNarrative || null,
      benchmark: result.benchmark || null,
      socialSignals: result.socialSignals || null,
      platformSignals: result.platformSignals || null
    });
  } catch (error) {
    console.error('[CORE] triggerRefresh error:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: 'Failed to refresh CORE recommendations',
      code: error.code || 'CORE_REFRESH_ERROR'
    });
  }
};

module.exports = {
  renderDashboard,
  getSummary,
  triggerRefresh
};


