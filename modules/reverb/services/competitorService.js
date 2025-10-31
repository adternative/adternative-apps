const { ensureReady, models } = require('../database');
const { generateCompetitorMocks } = require('../utils/mockData');

const syncCompetitors = async ({ entityId, siteId, domain, forceMock = false }) => {
  await ensureReady();
  const useMock = forceMock || !process.env.AHREFS_API_KEY;
  const payloads = useMock ? generateCompetitorMocks({ siteId }) : [];

  for (const payload of payloads) {
    const [competitor] = await models.Competitor.findOrCreate({
      where: { siteId, domain: payload.domain },
      defaults: {
        entityId,
        siteId,
        domain: payload.domain,
        metadata: {
          keywordOverlap: payload.keywordOverlap,
          backlinkOverlap: payload.backlinkOverlap
        }
      }
    });

    if (Array.isArray(payload.contentGap)) {
      for (const gap of payload.contentGap) {
        await models.CompetitorGap.findOrCreate({
          where: { competitorId: competitor.id, keyword: gap.topic },
          defaults: {
            keyword: gap.topic,
            overlapScore: gap.opportunityScore,
            opportunityScore: gap.opportunityScore,
            notes: `Estimated difficulty ${gap.difficulty}`
          }
        });
      }
    }
  }

  return models.Competitor.findAll({
    where: { siteId },
    include: [{ model: models.CompetitorGap, as: 'gaps' }]
  });
};

const getCompetitorSummary = async ({ siteId }) => {
  const competitors = await models.Competitor.findAll({
    where: { siteId },
    include: [{ model: models.CompetitorGap, as: 'gaps' }]
  });

  const summary = competitors.map((competitor) => {
    const { metadata = {} } = competitor;
    const opportunities = (competitor.gaps || []).map((gap) => ({
      keyword: gap.keyword,
      opportunityScore: gap.opportunityScore,
      notes: gap.notes
    }));
    return {
      domain: competitor.domain,
      keywordOverlap: metadata.keywordOverlap,
      backlinkOverlap: metadata.backlinkOverlap,
      opportunities
    };
  });

  return summary;
};

module.exports = {
  syncCompetitors,
  getCompetitorSummary
};


