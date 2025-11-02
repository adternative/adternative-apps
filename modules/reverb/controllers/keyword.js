const path = require('path');

const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { getKeywordInsights, summarizeKeywordPerformance } = require('../services/keyword');

const KEYWORD_VIEW = path.join(__dirname, '..', 'views', 'keywords.pug');

const listKeywords = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };
    const orderBy = req.query.sort || 'opportunityScore';

    if (!workspace) {
      return res.render(KEYWORD_VIEW, {
        ...buildBaseContext({ req, entity, workspace, workspaceError }),
        title: 'Keyword Intelligence — Reverb',
        summary: null,
        orderBy,
        insights: []
      });
    }

    const insights = await getKeywordInsights({ workspaceId: workspace.id, orderBy, limit: 100 });
    const summary = await summarizeKeywordPerformance({ workspaceId: workspace.id });

    res.render(KEYWORD_VIEW, {
      ...buildBaseContext({ req, entity, workspace, workspaceError: null }),
      title: 'Keyword Intelligence — Reverb',
      summary,
      orderBy,
      insights: mapToPlain(insights)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listKeywords
};



