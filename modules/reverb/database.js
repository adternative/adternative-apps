const {
  sequelize,
  models: {
    Workspace,
    KeywordInsight,
    PageAudit,
    TechnicalIssue,
    Backlink,
    RankSnapshot,
    Crawl,
    Report,
    Setting,
    Segment
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
  RankSnapshot,
  Crawl,
  Report,
  Setting,
  Segment
];

const syncReverbModels = async ({ alter = false } = {}) => {
  const options = alter ? { alter: true } : {};
  for (const model of reverbModels) {
    await model.sync(options);
  }
};

let ensurePromise;

const ensureReady = async () => {
  if (!ensurePromise) {
    // Avoid altering existing tables; only create missing REVERB tables
    ensurePromise = syncReverbModels({ alter: false }).catch((error) => {
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
    RankSnapshot,
    Crawl,
    Report,
    Setting,
    Segment
  },
  ensureReady,
  syncDatabase: syncReverbModels,
  syncReverbModels
};



