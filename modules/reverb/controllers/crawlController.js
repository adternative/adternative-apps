const path = require('path');
const { ensureCrawl, listSavedCrawls, getCrawlById, compareTwoCrawls, exportLookerReport } = require('../services/crawlerService');
const { getAllSettings, saveSettings } = require('../services/seoAnalysisService');

const REPORT_VIEW = path.join(__dirname, '..', 'views', 'report.pug');
const SETTINGS_VIEW = path.join(__dirname, '..', 'views', 'settings.pug');

// Feature 8/9: Crawl Limit & Scheduling, Crawl Configuration
exports.renderSettings = async (req, res, next) => {
  try {
    const settings = await getAllSettings();
    res.render(SETTINGS_VIEW, {
      title: 'REVERB • Settings',
      active: 'settings',
      settings
    });
  } catch (e) {
    next(e);
  }
};

exports.saveSettings = async (req, res, next) => {
  try {
    await saveSettings(req.body || {});
    res.redirect('/reverb/settings');
  } catch (e) {
    next(e);
  }
};

// Feature 10/11: Save & Open Crawls, JavaScript Rendering (flagged)
exports.renderCrawlDashboard = async (req, res, next) => {
  try {
    const crawls = await listSavedCrawls();
    res.render(REPORT_VIEW, {
      title: 'REVERB • Crawl',
      active: 'crawl',
      report: {
        title: 'Crawl Manager',
        description: 'Start, save, open and compare crawls.',
        sections: [
          {
            title: 'Saved Crawls',
            table: {
              headers: ['ID', 'Start URL', 'Pages', 'Status', 'Created'],
              rows: crawls.map(c => [c.id, c.startUrl, c.pageCount, c.status, new Date(c.createdAt).toISOString()])
            }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

exports.startCrawl = async (req, res, next) => {
  try {
    const { startUrl } = req.body || {};
    const crawl = await ensureCrawl({ startUrl });
    res.json({ ok: true, crawlId: crawl.id });
  } catch (e) {
    next(e);
  }
};

exports.listCrawls = async (_req, res, next) => {
  try {
    const crawls = await listSavedCrawls();
    res.json({ crawls });
  } catch (e) {
    next(e);
  }
};

exports.viewCrawl = async (req, res, next) => {
  try {
    const crawl = await getCrawlById(req.params.id);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Crawl Detail',
      active: 'crawl',
      report: {
        title: 'Crawl Detail',
        sections: [
          {
            title: 'Summary',
            table: {
              headers: ['Start URL', 'Pages', 'Status'],
              rows: [[crawl.startUrl, crawl.pageCount, crawl.status]]
            }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 12: Crawl Comparison
exports.compareCrawls = async (req, res, next) => {
  try {
    const { otherId } = req.body || {};
    const compare = await compareTwoCrawls(req.params.id, otherId);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Crawl Comparison',
      active: 'crawl',
      report: {
        title: 'Crawl Comparison',
        sections: [
          {
            title: 'Differences',
            table: { headers: ['Metric', 'A', 'B', 'Delta'], rows: compare.rows }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 31: Looker Studio Crawl Report Export
exports.exportForLookerStudio = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const data = await exportLookerReport();
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(data.csv);
    }
    res.json({ data: data.json });
  } catch (e) {
    next(e);
  }
};


