const path = require('path');
const { findBrokenLinks } = require('../services/crawlerService');
const { loadLatestCrawlOrRun } = require('../services/seoAnalysisService');

const REPORT_VIEW = path.join(__dirname, '..', 'views', 'report.pug');

// Feature 1: Find Broken Links, Errors & Redirects
exports.listBrokenLinks = async (req, res, next) => {
  try {
    const { startUrl } = req.query;
    const crawl = await loadLatestCrawlOrRun({ startUrl, entity: req.currentEntity });
    const results = await findBrokenLinks(crawl);

    res.render(REPORT_VIEW, {
      title: 'REVERB • Broken Links',
      active: 'broken-links',
      report: {
        title: 'Broken Links, Errors & Redirects',
        description: 'Links discovered with HTTP errors, redirects, or unreachable resources.',
        sections: [
          {
            title: 'Summary',
            status: {
              label: results.totalBroken > 0 ? `${results.totalBroken} issues found` : 'No issues found',
              level: results.totalBroken > 0 ? 'warn' : 'ok'
            },
            table: {
              headers: ['Type', 'Count'],
              rows: [
                ['Client Errors (4xx)', results.counts.clientError],
                ['Server Errors (5xx)', results.counts.serverError],
                ['Redirects (3xx)', results.counts.redirects],
                ['Unreachable', results.counts.unreachable]
              ]
            }
          },
          {
            title: 'Problematic URLs',
            table: {
              headers: ['Source Page', 'Link URL', 'Status'],
              rows: results.items.map((i) => [i.source, i.url, i.status])
            }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};


