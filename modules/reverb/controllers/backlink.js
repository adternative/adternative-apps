const path = require('path');

const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { getBacklinks, summarizeBacklinks } = require('../services/backlink');

const BACKLINK_VIEW = path.join(__dirname, '..', 'views', 'backlinks.pug');

const listBacklinks = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };
    const typeFilter = (req.query.type || '').toLowerCase();

    if (!workspace) {
      return res.render(BACKLINK_VIEW, {
        ...buildBaseContext({ req, res, entity, workspace, workspaceError }),
        title: 'Backlink Analysis — Reverb',
        summary: null,
        typeFilter,
        backlinks: []
      });
    }

    const [backlinks, summary] = await Promise.all([
      getBacklinks({ workspaceId: workspace.id, limit: 200 }),
      summarizeBacklinks({ workspaceId: workspace.id })
    ]);

    const filteredBacklinks = typeFilter
      ? backlinks.filter((row) => row.type === typeFilter)
      : backlinks;

    res.render(BACKLINK_VIEW, {
      ...buildBaseContext({ req, res, entity, workspace, workspaceError: null }),
      title: 'Backlink Analysis — Reverb',
      summary,
      typeFilter,
      backlinks: mapToPlain(filteredBacklinks)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBacklinks
};



