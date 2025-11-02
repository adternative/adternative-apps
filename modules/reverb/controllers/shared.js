const { ensureWorkspaceForEntity } = require('../services/workspace');

const toPlain = (instance) => {
  if (!instance) return null;
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
};

const mapToPlain = (items = []) => items.map((item) => toPlain(item)).filter((item) => item !== null);

const ensureEntity = (req) => {
  if (req.currentEntity) return req.currentEntity;
  const error = new Error('No entity selected');
  error.status = 400;
  throw error;
};

const resolveWorkspace = async ({ entity }) => {
  try {
    const workspace = await ensureWorkspaceForEntity({ entity });
    return { workspace, workspaceError: null };
  } catch (error) {
    if (error && error.code === 'REVERB_NO_WEBSITE') {
      return { workspace: null, workspaceError: error };
    }
    throw error;
  }
};

const buildBaseContext = ({ req, entity, workspace, workspaceError }) => ({
  user: req.user,
  currentEntity: toPlain(entity),
  appName: 'REVERB',
  availableApps: req.availableApps,
  workspace: workspace ? toPlain(workspace) : null,
  noEntity: !entity,
  missingWebsite: Boolean(workspaceError && workspaceError.code === 'REVERB_NO_WEBSITE'),
  workspaceError: workspaceError
    ? {
        code: workspaceError.code,
        message: workspaceError.message
      }
    : null
});

module.exports = {
  toPlain,
  mapToPlain,
  ensureEntity,
  resolveWorkspace,
  buildBaseContext
};


