const {
  sequelize,
  models,
  ReverbSite,
  SiteAudit,
  PageInsight,
  Keyword,
  KeywordSnapshot,
  SerpSnapshot,
  SerpResult,
  Backlink,
  BacklinkSnapshot,
  Competitor,
  CompetitorGap,
  RankRecord,
  InsightEvent,
  AiInsight
} = require('./models');

// --- Utility Helpers ------------------------------------------------------

const reverbModelList = Object.values(models);

let ensurePromise = null;

const syncReverbModels = async ({ alter = true } = {}) => {
  const options = alter ? { alter: true } : {};
  for (const model of reverbModelList) {
    await model.sync(options);
  }
};

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

const getOrCreateSite = async ({ entityId, domain, name, defaults = {} }) => {
  if (!entityId || !domain) throw new Error('entityId and domain are required to manage sites');
  const [site] = await ReverbSite.findOrCreate({
    where: { entityId, domain },
    defaults: {
      name: name || domain,
      defaultLocation: defaults.location || 'United States',
      defaultDevice: defaults.device || 'desktop',
      metadata: defaults.metadata || {}
    }
  });
  return site;
};

module.exports = {
  sequelize,
  models: {
    ReverbSite,
    SiteAudit,
    PageInsight,
    Keyword,
    KeywordSnapshot,
    SerpSnapshot,
    SerpResult,
    Backlink,
    BacklinkSnapshot,
    Competitor,
    CompetitorGap,
    RankRecord,
    InsightEvent,
    AiInsight
  },
  ensureReady,
  syncReverbModels,
  getOrCreateSite
};


