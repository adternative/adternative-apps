const path = require('path');

const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { loadOverview, FEATURE_KEYS } = require('../services/analysis');
const { getKeywordInsights } = require('../services/keyword');
const { getPageAudits } = require('../services/audit');
const { getTechnicalIssues } = require('../services/crawler');
const { getBacklinks } = require('../services/backlink');
const { summarizeRankPerformance } = require('../services/rank');

const DASHBOARD_VIEW = path.join(__dirname, '..', 'views', 'dashboard.pug');

const renderDashboard = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };

    if (!workspace) {
      return res.render(DASHBOARD_VIEW, {
        ...buildBaseContext({ req, entity, workspace, workspaceError }),
        title: 'REVERB • Search Intelligence',
        overview: { summary: {}, features: [] },
        keywordHighlights: [],
        auditHighlights: [],
        technicalIssues: [],
        backlinkHighlights: [],
        rankSummary: null,
        featureKeys: FEATURE_KEYS
      });
    }

    const overview = await loadOverview({ workspace });

    const [keywordHighlights, auditHighlights, technicalIssues, backlinkHighlights, rankSummary] = await Promise.all([
      getKeywordInsights({ workspaceId: workspace.id, limit: 6 }),
      getPageAudits({ workspaceId: workspace.id }).then((rows) => rows.slice(0, 4)),
      getTechnicalIssues({ workspaceId: workspace.id }).then((rows) => rows.slice(0, 6)),
      getBacklinks({ workspaceId: workspace.id, limit: 6 }),
      summarizeRankPerformance({ workspaceId: workspace.id })
    ]);

    res.render(DASHBOARD_VIEW, {
      ...buildBaseContext({ req, entity, workspace, workspaceError: null }),
      title: 'REVERB • Search Intelligence',
      overview,
      keywordHighlights: mapToPlain(keywordHighlights),
      auditHighlights: mapToPlain(auditHighlights),
      technicalIssues: mapToPlain(technicalIssues),
      backlinkHighlights: mapToPlain(backlinkHighlights),
      rankSummary,
      featureKeys: FEATURE_KEYS
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderDashboard
};



