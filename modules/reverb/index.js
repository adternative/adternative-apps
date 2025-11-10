// Optional index export for the REVERB module
// Keeps everything self-contained and exportable if needed internally.
module.exports = {
  routes: require('./routes.js'),
  models: require('./models'),
  services: {
    crawlerService: require('./services/crawlerService'),
    seoAnalysisService: require('./services/seoAnalysisService'),
    analyticsService: require('./services/analyticsService'),
    aiIntegrationService: require('./services/aiIntegrationService')
  },
  controllers: {
    brokenLinksController: require('./controllers/brokenLinksController'),
    metaAnalysisController: require('./controllers/metaAnalysisController'),
    sitemapController: require('./controllers/sitemapController'),
    crawlController: require('./controllers/crawlController'),
    integrationController: require('./controllers/integrationController')
  }
};


