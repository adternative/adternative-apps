const { ensureReady, models } = require('../database');
const { MOCK_ANALYTICS } = require('../utils/mockData');

const { CoreEntity } = models;

const toPlain = (sequelizeInstance) => {
  if (!sequelizeInstance) return null;
  if (typeof sequelizeInstance.get === 'function') {
    return sequelizeInstance.get({ plain: true });
  }
  return sequelizeInstance;
};

const mapBaseEntity = (baseEntity) => {
  if (!baseEntity) return null;
  return {
    baseEntityId: baseEntity.id,
    userId: baseEntity.user_id,
    name: baseEntity.name,
    description: baseEntity.description || null,
    website: baseEntity.website || null,
    industry: baseEntity.industry || 'general',
    region: baseEntity.region || null,
    targetAudience: baseEntity.target_audience || null,
    goals: baseEntity.goal || baseEntity.goals || null,
    budgetRangeMin: baseEntity.budget_range_min || null,
    budgetRangeMax: baseEntity.budget_range_max || null,
    contentStrengths: baseEntity.content_strengths || [],
    socialProfiles: baseEntity.social_profiles || {},
    avgMonthlyVisitors: baseEntity.avg_monthly_visitors || null,
    conversionRate: baseEntity.conversion_rate || null,
    preferredLanguages: baseEntity.preferred_languages || ['en']
  };
};

const getOrCreateCoreEntity = async (baseEntityInstance) => {
  await ensureReady();
  const base = mapBaseEntity(toPlain(baseEntityInstance));
  if (!base) throw new Error('Base entity reference required');

  const [record] = await CoreEntity.findOrCreate({
    where: { baseEntityId: base.baseEntityId },
    defaults: base
  });
  return record;
};

const updateCoreEntity = async (entityId, payload = {}) => {
  await ensureReady();
  const record = await CoreEntity.findByPk(entityId);
  if (!record) throw new Error('CORE entity not found');
  await record.update(payload);
  return record;
};

const fetchAnalyticsSnapshot = async (entityId) => {
  await ensureReady();
  // Placeholder: integrate analytics warehouse once available.
  return {
    entityId,
    generatedAt: new Date().toISOString(),
    ...MOCK_ANALYTICS
  };
};

module.exports = {
  getOrCreateCoreEntity,
  updateCoreEntity,
  fetchAnalyticsSnapshot
};


