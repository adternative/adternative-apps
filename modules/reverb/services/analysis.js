const { KeywordInsight } = require('../database').models;
const {
  ensureWorkspaceForEntity,
  assertDomainAllowed,
  touchAnalysisTimestamp
} = require('./workspace');
const { refreshKeywordInsights, summarizeKeywordPerformance } = require('./keyword');
const { refreshPageAudits, summarizeAudits } = require('./audit');
const { refreshTechnicalIssues, summarizeTechnicalHealth } = require('./crawler');
const { refreshBacklinks, summarizeBacklinks } = require('./backlink');
const { captureRankSnapshots, summarizeRankPerformance } = require('./rank');

const FEATURE_KEYS = {
  KEYWORD: 'keyword-intelligence',
  AUDIT: 'on-page-audit',
  TECHNICAL: 'technical-crawler',
  BACKLINK: 'backlink-analysis',
  RANK: 'rank-tracking'
};

const ALL_FEATURES = Object.values(FEATURE_KEYS);

const normalizeFeatureValue = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-');

const normalizeFeatureSelection = (requested = []) => {
  if (!Array.isArray(requested) || requested.length === 0) return ALL_FEATURES;
  const normalized = requested
    .map(normalizeFeatureValue)
    .filter((value) => ALL_FEATURES.includes(value));
  return normalized.length ? Array.from(new Set(normalized)) : ALL_FEATURES;
};

const runAnalysis = async ({ entity, domain, features, keywords }) => {
  const initialWorkspace = await ensureWorkspaceForEntity({ entity });
  const { workspace, hostname } = await assertDomainAllowed({ entity, workspace: initialWorkspace, target: domain });
  const selectedFeatures = normalizeFeatureSelection(features);
  const summary = {};
  let keywordInsights = null;

  if (selectedFeatures.includes(FEATURE_KEYS.KEYWORD)) {
    keywordInsights = await refreshKeywordInsights({ entity, workspace, hostname, keywords });
    summary[FEATURE_KEYS.KEYWORD] = await summarizeKeywordPerformance({ workspaceId: workspace.id });
  }

  if (selectedFeatures.includes(FEATURE_KEYS.AUDIT)) {
    await refreshPageAudits({ workspace, hostname });
    summary[FEATURE_KEYS.AUDIT] = await summarizeAudits({ workspaceId: workspace.id });
  }

  if (selectedFeatures.includes(FEATURE_KEYS.TECHNICAL)) {
    await refreshTechnicalIssues({ workspace, hostname });
    summary[FEATURE_KEYS.TECHNICAL] = await summarizeTechnicalHealth({ workspaceId: workspace.id });
  }

  if (selectedFeatures.includes(FEATURE_KEYS.BACKLINK)) {
    await refreshBacklinks({ workspace, hostname });
    summary[FEATURE_KEYS.BACKLINK] = await summarizeBacklinks({ workspaceId: workspace.id });
  }

  if (selectedFeatures.includes(FEATURE_KEYS.RANK)) {
    if (!keywordInsights) {
      keywordInsights = await KeywordInsight.findAll({
        where: { workspaceId: workspace.id },
        order: [['opportunityScore', 'DESC']],
        limit: 12
      });
    }
    await captureRankSnapshots({ workspace, keywordInsights });
    summary[FEATURE_KEYS.RANK] = await summarizeRankPerformance({ workspaceId: workspace.id });
  }

  await touchAnalysisTimestamp(workspace.id);

  return {
    workspace: workspace.get({ plain: true }),
    hostname,
    features: selectedFeatures,
    summary
  };
};

const loadOverview = async ({ workspace }) => {
  if (!workspace) return { summary: {}, features: [] };

  const summaries = await Promise.all([
    summarizeKeywordPerformance({ workspaceId: workspace.id }),
    summarizeAudits({ workspaceId: workspace.id }),
    summarizeTechnicalHealth({ workspaceId: workspace.id }),
    summarizeBacklinks({ workspaceId: workspace.id }),
    summarizeRankPerformance({ workspaceId: workspace.id })
  ]);

  return {
    features: ALL_FEATURES,
    summary: {
      [FEATURE_KEYS.KEYWORD]: summaries[0],
      [FEATURE_KEYS.AUDIT]: summaries[1],
      [FEATURE_KEYS.TECHNICAL]: summaries[2],
      [FEATURE_KEYS.BACKLINK]: summaries[3],
      [FEATURE_KEYS.RANK]: summaries[4]
    }
  };
};

module.exports = {
  runAnalysis,
  loadOverview,
  FEATURE_KEYS,
  ALL_FEATURES
};



