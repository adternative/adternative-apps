const { sequelize, Influencer, models } = require('./models');
const { influencers } = require('./utils/mockData');
const DEFAULT_INFLUENCERS = Array.isArray(influencers) ? influencers : [];
// --- Setup Helpers ----------------------------------------------------------

const echoModels = [Influencer];


const syncModels = async () => {
  for (const model of echoModels) {
    try {
      await model.sync({ alter: true });
    } catch (error) {
      // Surface which model failed to sync to aid debugging
      console.error(`[ECHO] Failed to sync model ${model.getTableName ? model.getTableName() : model.name}:`, error);
      throw error;
    }
  }
};

  const seedDefaultInfluencers = async () => {
  for (const influencer of DEFAULT_INFLUENCERS) {
    await Influencer.findOrCreate({
      where: { name: influencer.name },
      defaults: {
        id: influencer.id,
        name: influencer.name,
        photo: influencer.photo,
        bio: influencer.bio,
        socials: influencer.socials,
        contactEmail: influencer.contactEmail,
        demographics: influencer.demographics || (
          influencer.country || influencer.language
            ? { location: influencer.country ? { country: influencer.country } : undefined, language: influencer.language }
            : null
        ),
        authenticityScore: influencer.authenticityScore,
        averageEngagementRate: influencer.averageEngagementRate,
        avgCostPerPost: influencer.avgCostPerPost
      }
    });
  }
};

let ensurePromise = null;

const ensureReady = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await syncModels();
      await seedDefaultInfluencers();
    })().catch((error) => {
      ensurePromise = null;
      console.error('[ECHO] ensureReady failed:', error);
      throw error;
    });
  }
  return ensurePromise;
};

module.exports = {
  sequelize,
  models,
  ensureReady,
  syncModels,
  seedDefaultInfluencers
};


