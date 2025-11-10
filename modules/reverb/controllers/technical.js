const path = require('path');

const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { getTechnicalIssues, summarizeTechnicalHealth } = require('../services/crawler');

const TECHNICAL_VIEW = path.join(__dirname, '..', 'views', 'technical.pug');

const listTechnicalIssues = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };

    const severityFilter = (req.query.severity || '').toLowerCase();

    if (!workspace) {
      return res.render(TECHNICAL_VIEW, {
        ...buildBaseContext({ req, res, entity, workspace, workspaceError }),
        title: 'Technical Crawler — Reverb',
        summary: null,
        severityFilter,
        issues: []
      });
    }

    const [issues, summary] = await Promise.all([
      getTechnicalIssues({ workspaceId: workspace.id }),
      summarizeTechnicalHealth({ workspaceId: workspace.id })
    ]);

    const filteredIssues = severityFilter
      ? issues.filter((issue) => issue.severity === severityFilter)
      : issues;

    res.render(TECHNICAL_VIEW, {
      ...buildBaseContext({ req, res, entity, workspace, workspaceError: null }),
      title: 'Technical Crawler — Reverb',
      summary,
      severityFilter,
      issues: mapToPlain(filteredIssues)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTechnicalIssues
};



