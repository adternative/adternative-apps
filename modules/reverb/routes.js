const express = require('express');

const { authenticateToken } = require('../../middleware/auth');
const { currentEntity } = require('../../middleware/entity');
const { requireAppAccess } = require('../../middleware/paywall');

const { ensureReady } = require('./database');
const { renderDashboard } = require('./controllers/dashboard');
const { listKeywords } = require('./controllers/keyword');
const { showAudit } = require('./controllers/audit');
const { listTechnicalIssues } = require('./controllers/technical');
const { listBacklinks } = require('./controllers/backlink');
const { listRankTracking } = require('./controllers/rank');
const { triggerAnalysis } = require('./controllers/analysis');
const brokenLinksController = require('./controllers/brokenLinksController');
const metaAnalysisController = require('./controllers/metaAnalysisController');
const sitemapController = require('./controllers/sitemapController');
const crawlController = require('./controllers/crawlController');
const integrationController = require('./controllers/integrationController');

const router = express.Router();

router.use(authenticateToken);
router.use(currentEntity);
router.use(requireAppAccess('reverb'));

router.use(async (req, res, next) => {
  try {
    await ensureReady();
  } catch (error) {
    console.error('[REVERB] ensureReady error:', error.message);
  }
  next();
});

router.use((req, res, next) => {
  res.locals.appName = 'REVERB';
  next();
});

// Forms-Based Authentication guard (restricted actions)
const restrictedGuard = async (req, res, next) => {
  try {
    const { getSettingValue } = require('./services/seoAnalysisService');
    const requiredSecret = await getSettingValue('formsAuthSecret');
    if (!requiredSecret) {
      return next();
    }
    const provided = req.headers['x-reverb-secret'] || req.query.secret || (req.body && req.body.secret);
    if (String(provided || '').trim() === String(requiredSecret).trim()) {
      return next();
    }
    return res.status(403).json({ error: 'Restricted action. Provide correct secret.' });
  } catch (e) {
    return res.status(500).json({ error: 'Guard error' });
  }
};

router.get('/', renderDashboard);
router.get('/keywords', listKeywords);
router.get('/audit', showAudit);
router.get('/technical', listTechnicalIssues);
router.get('/backlinks', listBacklinks);
router.get('/ranks', listRankTracking);

router.post('/analysis', triggerAnalysis);
router.post('/analyze', triggerAnalysis);

// Extended feature routes (merged here)
// Crawl management
router.get('/crawl', crawlController.renderCrawlDashboard);
router.post('/crawl/start', restrictedGuard, crawlController.startCrawl);
router.get('/crawls', crawlController.listCrawls);
router.get('/crawls/:id', crawlController.viewCrawl);
router.post('/crawls/:id/compare', crawlController.compareCrawls);

// Core SEO analyses
router.get('/broken-links', brokenLinksController.listBrokenLinks);
router.get('/meta', metaAnalysisController.analyseMeta);
router.get('/robots', metaAnalysisController.reviewRobots);
router.get('/hreflang', metaAnalysisController.auditHreflang);
router.get('/duplicates', metaAnalysisController.discoverExactDuplicates);
router.get('/near-duplicates', metaAnalysisController.discoverNearDuplicates);

// Sitemaps
router.get('/sitemap.xml', sitemapController.generateXmlSitemap);

// Visualisations
router.get('/visualisations', metaAnalysisController.siteVisualisations);

// Settings (Crawl configuration, limits, scheduling, robots.txt editor)
router.get('/settings', crawlController.renderSettings);
router.post('/settings', restrictedGuard, crawlController.saveSettings);

// AI Insights and Integrations
router.get('/ai', integrationController.renderAiInsights);
router.get('/integrations', integrationController.renderIntegrationsDashboard);
router.get('/integrations/analytics', integrationController.getAnalyticsOverview);
router.get('/integrations/search-console', integrationController.getSearchConsoleOverview);
router.get('/integrations/pagespeed', integrationController.getPageSpeedOverview);

// Accessibility, AMP, Structured Data, Spelling
router.get('/accessibility', metaAnalysisController.accessibilityAudit);
router.get('/amp', metaAnalysisController.ampValidation);
router.get('/structured-data', metaAnalysisController.structuredDataValidation);
router.get('/spelling', metaAnalysisController.spellingAndGrammar);

// Custom search/extraction/JS
router.get('/source-search', metaAnalysisController.customSourceSearch);
router.post('/custom-extraction', restrictedGuard, metaAnalysisController.customExtraction);
router.post('/custom-js', restrictedGuard, metaAnalysisController.customJavaScriptExecution);

// Segmentation
router.get('/segments', metaAnalysisController.listSegments);
router.post('/segments', restrictedGuard, metaAnalysisController.saveSegment);

// Exports
router.get('/export/looker', crawlController.exportForLookerStudio);

// Support (static page using generic report view)
router.get('/support', (req, res) => {
  res.render(require('path').join(__dirname, 'views', 'report.pug'), {
    title: 'REVERB • Technical Support',
    active: 'support',
    report: {
      title: 'Free Technical Support',
      description: 'Find guidance on using the REVERB SEO suite.',
      sections: [
        {
          title: 'Support Information',
          status: { label: 'Available', level: 'ok' },
          table: {
            headers: ['Topic', 'Details'],
            rows: [
              ['Getting Started', 'Use Settings to configure crawl limits, scheduling, and robots.txt.'],
              ['Crawls', 'Start, save, open and compare crawls from the Crawl dashboard.'],
              ['Analyses', 'Run Meta, Robots, hreflang, Duplicates, Accessibility and more.'],
              ['AI Insights', 'Provide OpenAI/Gemini API keys in Settings to enable AI summaries.'],
              ['Integrations', 'Connect GA, Search Console and PageSpeed for deeper insights.']
            ]
          }
        }
      ]
    }
  });
});

module.exports = (app) => {
  app.use('/reverb', router);
  console.log('[REVERB] Routes loaded at /reverb');
};



