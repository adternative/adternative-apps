const {
  sequelize,
  models: {
    Workspace,
    KeywordInsight,
    PageAudit,
    TechnicalIssue,
    Backlink,
    RankSnapshot
  },
  applyAssociations
} = require('./models');

applyAssociations();

const reverbModels = [
  Workspace,
  KeywordInsight,
  PageAudit,
  TechnicalIssue,
  Backlink,
  RankSnapshot
];

const syncReverbModels = async ({ alter = true } = {}) => {
  const options = alter ? { alter: true } : {};
  for (const model of reverbModels) {
    await model.sync(options);
  }
};

let ensurePromise;

const ensureReady = async () => {
  if (!ensurePromise) {
    ensurePromise = syncReverbModels({ alter: true }).catch((error) => {
      ensurePromise = null;
      console.error('[REVERB] ensureReady failed:', error.message);
      throw error;
    });
  }
  return ensurePromise;
};

module.exports = {
  sequelize,
  models: {
    Workspace,
    KeywordInsight,
    PageAudit,
    TechnicalIssue,
    Backlink,
    RankSnapshot
  },
  ensureReady,
  syncDatabase: syncReverbModels,
  syncReverbModels
};



