const { ensureReady, models } = require('../database');
const { generateBacklinkMocks } = require('../utils/mockData');
const { aggregateBacklinkVelocity } = require('../utils/score');

const syncBacklinks = async ({ entityId, siteId, domain, forceMock = false }) => {
  await ensureReady();

  const useMock = forceMock || !process.env.AHREFS_API_KEY;
  const backlinkPayloads = useMock ? generateBacklinkMocks({ siteId }) : [];

  const savedBacklinks = [];

  for (const payload of backlinkPayloads) {
    const [backlink] = await models.Backlink.findOrCreate({
      where: { siteId, sourceUrl: payload.sourceUrl },
      defaults: {
        entityId,
        siteId,
        sourceUrl: payload.sourceUrl,
        targetUrl: payload.targetUrl,
        anchorText: payload.anchorText,
        rel: payload.rel,
        firstSeenAt: payload.history?.[0]?.capturedAt,
        lastSeenAt: payload.history?.[payload.history.length - 1]?.capturedAt,
        metrics: payload.metrics
      }
    });

    if (Array.isArray(payload.history)) {
      for (const snapshot of payload.history) {
        await models.BacklinkSnapshot.findOrCreate({
          where: {
            backlinkId: backlink.id,
            capturedAt: snapshot.capturedAt
          },
          defaults: {
            status: snapshot.status,
            domainAuthority: snapshot.domainAuthority,
            pageAuthority: snapshot.pageAuthority,
            spamScore: snapshot.spamScore || null,
            metadata: snapshot.metadata || null
          }
        });
      }
    }

    savedBacklinks.push(backlink);
  }

  return models.Backlink.findAll({
    where: { siteId },
    include: [{ model: models.BacklinkSnapshot, as: 'snapshots', order: [['captured_at', 'DESC']], limit: 5 }]
  });
};

const listBacklinksWithVelocity = async ({ siteId }) => {
  const backlinks = await models.Backlink.findAll({
    where: { siteId },
    include: [{ model: models.BacklinkSnapshot, as: 'snapshots', order: [['captured_at', 'DESC']], limit: 10 }]
  });

  return backlinks.map((backlink) => {
    const velocity = aggregateBacklinkVelocity(backlink.snapshots || []);
    return {
      ...backlink.toJSON(),
      velocity
    };
  });
};

module.exports = {
  syncBacklinks,
  listBacklinksWithVelocity
};


