const path = require('path');

const { getAvailableApps } = require('../../../utils/appLoader');
const { ensureReady } = require('../database');
const { discoverInfluencersForEntity, buildFiltersFromRequest } = require('./discovery');
const { normalizeScore } = require('../utils/scoring');
const { Goal, Demographic } = require('../../../models');

const DASHBOARD_VIEW = path.join(__dirname, '..', 'views', 'index.pug');

const toPlain = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
};

const ensureEntity = (req) => {
  if (req.currentEntity) return req.currentEntity;
  const error = new Error('No entity selected');
  error.status = 400;
  throw error;
};

const renderDashboard = async (req, res, next) => {
  try {
    const entity = ensureEntity(req);
    await ensureReady();

    const baseFilters = buildFiltersFromRequest(req);

    // Load available goals and demographics for selection
    const [goalsRaw, demographicsRaw] = await Promise.all([
      Goal.findAll({ where: { entity_id: entity.id } }),
      Demographic.findAll({ where: { entity_id: entity.id } })
    ]);
    const goals = goalsRaw.map(toPlain);
    const demographics = demographicsRaw.map(toPlain);

    // Resolve selected goal/demographic by id (if provided)
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const goalId = params.goalId || params.goal_id || null;
    const demographicId = params.demographicId || params.demographic_id || null;

    const [selectedGoal, selectedDemographic] = await Promise.all([
      goalId ? Goal.findOne({ where: { id: goalId, entity_id: entity.id } }) : null,
      demographicId
        ? Demographic.findOne({ where: { id: demographicId, entity_id: entity.id } })
        : null
    ]);

    // Attach selection into filters for view echoing
    const filters = {
      ...baseFilters,
      goalId: goalId || null,
      demographicId: demographicId || null
    };

    const discovery = await discoverInfluencersForEntity({
      entity,
      filters,
      selectedGoal: toPlain(selectedGoal),
      selectedDemographic: toPlain(selectedDemographic),
      persist: true
    });

    // If a goal is selected, compute a goal-biased matchness coefficient and re-rank
    let rankedInfluencers = discovery.influencers || [];
    let selectedGoalKpi = null;
    if (selectedGoal && selectedGoal.objective) {
      selectedGoalKpi = String(selectedGoal.objective.kpi || '').toLowerCase();

      const weightMap = {
        awareness: { topic: 0.25, overlap: 0.15, engagement: 0.15, platform: 0.25, cost: 0.05, reach: 0.15 },
        leads: { topic: 0.25, overlap: 0.2, engagement: 0.35, platform: 0.1, cost: 0.1, reach: 0 },
        sales: { topic: 0.15, overlap: 0.25, engagement: 0.25, platform: 0.1, cost: 0.25, reach: 0 },
        retention: { topic: 0.3, overlap: 0.35, engagement: 0.2, platform: 0.1, cost: 0.05, reach: 0 }
      };

      const weights = weightMap[selectedGoalKpi] || weightMap.leads;

      rankedInfluencers = rankedInfluencers.map((inf) => {
        const br = inf.scoreBreakdown || {};
        const reachNorm = normalizeScore(inf.estimatedReach || inf.followersTotal || 0, 10000, 1000000);
        const score = (
          (br.topicSimilarity || 0) * weights.topic +
          (br.audienceOverlap || 0) * weights.overlap +
          (br.engagementAuthenticity || 0) * weights.engagement +
          (br.platformPerformance || 0) * weights.platform +
          (br.costEfficiency || 0) * weights.cost +
          reachNorm * weights.reach
        );
        return { ...inf, matchness: Math.round(score * 100) };
      }).sort((a, b) => (b.matchness || 0) - (a.matchness || 0));
    }

    // Matches/favorites storage may be unavailable in the current setup
    const matches = [];
    const favorites = [];

    const section = (req.query?.section || req.body?.section || req.path.replace('/','') || '').toLowerCase();
    const activeSection = ['matches', 'favorites'].includes(section) ? section : 'discovery';
    const feedback = {
      status: req.query?.status || null,
      message: req.query?.message || null
    };

    res.render(DASHBOARD_VIEW, {
      title: 'ECHO • Influencer Matching',
      user: req.user,
      currentEntity: toPlain(entity),
      appName: 'ECHO',
      availableApps: req.availableApps || getAvailableApps(),
      discovery: { ...discovery, influencers: rankedInfluencers },
      matches: matches.map(toPlain),
      favorites,
      filters: discovery.filters,
      goals,
      demographics,
      ai: discovery.ai,
      section: activeSection,
      feedback,
      selectedGoal: selectedGoal ? toPlain(selectedGoal) : null,
      selectedGoalKpi
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderDashboard
};


