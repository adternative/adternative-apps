const { ensureReady, models } = require('../database');
const { generateEventMocks } = require('../utils/mockData');

const ensureMockEvents = async ({ entityId, siteId }) => {
  const count = await models.InsightEvent.count({ where: { entityId, siteId } });
  if (count) return;
  const mocks = generateEventMocks({ entityId, siteId });
  await models.InsightEvent.bulkCreate(mocks, { ignoreDuplicates: true });
};

const listInsightEvents = async ({ entityId, siteId, limit = 20 }) => {
  await ensureReady();
  await ensureMockEvents({ entityId, siteId });

  return models.InsightEvent.findAll({
    where: { entityId, siteId },
    order: [['occurred_at', 'DESC']],
    limit
  });
};

module.exports = {
  listInsightEvents
};


