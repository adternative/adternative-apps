const path = require('path');

const { getAvailableApps } = require('../../../utils/appLoader');
const { ensureReady } = require('../database');
const { getOrCreateCoreEntity, fetchAnalyticsSnapshot } = require('./entity');
const { runRecommendationEngine, getLatestRecommendation } = require('./recommendation');

const DASHBOARD_VIEW = path.join(__dirname, '..', 'views', 'core_dashboard.pug');
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

const loadRecommendationBundle = async ({ coreEntity, analytics }) => {
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
    availableApps: req.availableApps || getAvailableApps(),
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
    const bundle = await loadRecommendationBundle({ coreEntity, analytics });

    const context = buildDashboardContext({
      req,
      baseEntity,
      coreEntity,
      analytics,
      bundle
    });

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


