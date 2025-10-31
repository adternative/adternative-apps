const path = require('path');
const { listKeywords } = require('../services/keywordService');
const { listBacklinksWithVelocity } = require('../services/backlinkService');
const { getCompetitorSummary } = require('../services/competitorService');
const { listAiInsights } = require('../services/insightService');
const { getLatestAudit } = require('../services/crawlerService');
const { listInsightEvents } = require('../services/eventService');
const { resolveSite } = require('./helpers');
const { getAvailableApps } = require('../../../utils/appLoader');

const renderDashboard = async (req, res) => {
  try {
    const { site, entityId } = await resolveSite(req);

    const [audit, keywordData, backlinks, competitors, aiInsights, events] = await Promise.all([
      getLatestAudit({ entityId, siteId: site.id }),
      listKeywords({ siteId: site.id, limit: 15 }),
      listBacklinksWithVelocity({ siteId: site.id }),
      getCompetitorSummary({ siteId: site.id }),
      listAiInsights({ entityId, siteId: site.id }),
      listInsightEvents({ entityId, siteId: site.id })
    ]);

    const latestSnapshots = keywordData.rows?.map((keyword) => keyword.snapshots?.[0]) || [];
    const rankingHealth = latestSnapshots.reduce((acc, snapshot) => acc + (snapshot?.position || 0), 0) / Math.max(latestSnapshots.length, 1);

    const overview = {
      technicalHealthScore: audit?.technicalHealthScore || null,
      coreWebVitals: audit?.lighthouseSummary || null,
      keywordCount: keywordData.count || 0,
      backlinkCount: backlinks.length,
      avgRankingPosition: Number(rankingHealth.toFixed(2)),
      upcomingEvents: events.slice(0, 3)
    };

    res.render(path.join(__dirname, '..', 'views', 'index.pug'), {
      title: 'REVERB • SEO Intelligence',
      user: req.user,
      currentEntity: req.currentEntity,
      appName: 'REVERB',
      availableApps: req.availableApps || getAvailableApps(),
      overview,
      site,
      audit,
      keywords: keywordData.rows || [],
      backlinks,
      competitors,
      aiInsights,
      events
    });
  } catch (error) {
    res.status(400).render(path.join(__dirname, '..', 'views', 'error.pug'), {
      title: 'REVERB • Error',
      error: error.message
    });
  }
};

module.exports = {
  renderDashboard
};


