const cron = require('node-cron');
const { ensureReady, models } = require('../database');
const { runSiteAudit } = require('../services/crawlerService');
const { syncKeywords } = require('../services/keywordService');
const { syncBacklinks } = require('../services/backlinkService');
const { syncCompetitors } = require('../services/competitorService');

let refreshTask = null;

const runRefreshCycle = async () => {
  await ensureReady();
  const sites = await models.ReverbSite.findAll();
  if (!sites.length) {
    console.log('[REVERB] No sites registered for refresh cycle yet.');
    return;
  }

  console.log(`[REVERB] Refresh cycle triggered for ${sites.length} site(s).`);

  for (const site of sites) {
    try {
      await runSiteAudit({ entityId: site.entityId, domain: site.domain, useMock: true });
      await syncKeywords({ entityId: site.entityId, siteId: site.id, domain: site.domain, forceMock: true });
      await syncBacklinks({ entityId: site.entityId, siteId: site.id, domain: site.domain, forceMock: true });
      await syncCompetitors({ entityId: site.entityId, siteId: site.id, domain: site.domain, forceMock: true });
    } catch (error) {
      console.error('[REVERB] Refresh cycle error:', error.message);
    }
  }
};

const startRefreshJob = (schedule = '15 */6 * * *') => {
  if (refreshTask) {
    refreshTask.stop();
  }

  refreshTask = cron.schedule(schedule, runRefreshCycle, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });

  console.log(`[REVERB] Scheduled refresh job at ${schedule}`);
};

const stopRefreshJob = () => {
  if (refreshTask) {
    refreshTask.stop();
    refreshTask = null;
  }
};

module.exports = {
  startRefreshJob,
  stopRefreshJob,
  runRefreshCycle
};


