const { ensureReady, getOrCreateSite, models } = require('../database');
const { generateSiteAuditMock } = require('../utils/mockData');
const { calculateTechnicalHealthScore } = require('../utils/score');

const runSiteAudit = async ({ entityId, domain, maxPages = 250, useMock = false }) => {
  if (!entityId || !domain) throw new Error('entityId and domain are required for site audits');

  await ensureReady();
  const site = await getOrCreateSite({ entityId, domain });

  const startedAt = new Date();

  const audit = await models.SiteAudit.create({
    entityId,
    siteId: site.id,
    status: 'running',
    startedAt
  });

  try {
    let crawlerOutput;

    if (useMock || process.env.REVERB_USE_MOCK === 'true' || !process.env.PAGESPEED_API_KEY) {
      crawlerOutput = generateSiteAuditMock({ domain });
    } else {
      // Placeholder for real crawler integration — to be extended with queue + worker
      crawlerOutput = generateSiteAuditMock({ domain });
    }

    const technicalHealthScore = calculateTechnicalHealthScore({
      totals: crawlerOutput.summary,
      lighthouse: crawlerOutput.lighthouse
    });

    await audit.update({
      status: 'completed',
      crawlerSummary: crawlerOutput.summary,
      lighthouseSummary: crawlerOutput.lighthouse,
      technicalHealthScore,
      performanceScore: crawlerOutput.lighthouse?.performance ? crawlerOutput.lighthouse.performance * 100 : null,
      accessibilityScore: crawlerOutput.lighthouse?.accessibility ? crawlerOutput.lighthouse.accessibility * 100 : null,
      seoScore: crawlerOutput.lighthouse?.seo ? crawlerOutput.lighthouse.seo * 100 : null,
      issues: crawlerOutput.issues,
      completedAt: new Date()
    });

    if (Array.isArray(crawlerOutput.pages)) {
      await Promise.all(crawlerOutput.pages.map((page) => models.PageInsight.create({
        auditId: audit.id,
        url: page.url,
        statusCode: page.statusCode || null,
        isBroken: page.statusCode >= 400,
        redirectTarget: page.redirectTarget || null,
        meta: page.meta || null,
        headings: page.headings || null,
        schema: page.schema || null,
        lighthouseMetrics: page.lighthouseMetrics || null,
        notes: page.issues ? JSON.stringify(page.issues) : null
      })));
    }

    await site.update({ lastAuditAt: new Date() });

    return { audit, site };
  } catch (error) {
    await audit.update({
      status: 'failed',
      completedAt: new Date(),
      issues: { error: error.message }
    });
    throw error;
  }
};

const getLatestAudit = async ({ entityId, siteId }) => {
  await ensureReady();
  return models.SiteAudit.findOne({
    where: { entityId, siteId },
    order: [['created_at', 'DESC']],
    include: [{ model: models.PageInsight, as: 'pages', limit: 25, order: [['is_broken', 'DESC']] }]
  });
};

const listPageInsights = async ({ auditId, limit = 50, offset = 0 }) => {
  return models.PageInsight.findAndCountAll({
    where: { auditId },
    limit,
    offset,
    order: [['is_broken', 'DESC'], ['status_code', 'ASC']]
  });
};

module.exports = {
  runSiteAudit,
  getLatestAudit,
  listPageInsights
};


