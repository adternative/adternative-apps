const path = require('path');

const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { getPageAudits, summarizeAudits } = require('../services/audit');

const AUDIT_VIEW = path.join(__dirname, '..', 'views', 'audit.pug');

const showAudit = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };

    if (!workspace) {
      return res.render(AUDIT_VIEW, {
        ...buildBaseContext({ req, res, entity, workspace, workspaceError }),
        title: 'On-Page SEO Audit — Reverb',
        summary: null,
        audits: []
      });
    }

    const audits = await getPageAudits({ workspaceId: workspace.id });
    const summary = await summarizeAudits({ workspaceId: workspace.id });

    res.render(AUDIT_VIEW, {
      ...buildBaseContext({ req, res, entity, workspace, workspaceError: null }),
      title: 'On-Page SEO Audit — Reverb',
      summary,
      audits: mapToPlain(audits)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  showAudit
};



