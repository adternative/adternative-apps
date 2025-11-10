const path = require('path');
const { summarizeWithAI, compareWithGemini } = require('../services/aiIntegrationService');
const {
  getAnalyticsSummary,
  getSearchConsoleSummary,
  getPageSpeedSummary
} = require('../services/analyticsService');
const { loadLatestCrawlOrRun } = require('../services/seoAnalysisService');

const REPORT_VIEW = path.join(__dirname, '..', 'views', 'report.pug');

// Feature 22: Crawl with OpenAI & Gemini (AI insights)
exports.renderAiInsights = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const aiSummary = await summarizeWithAI(crawl);
    const dupCompare = await compareWithGemini({ a: crawl.startUrl, b: crawl.startUrl });
    res.render(REPORT_VIEW, {
      title: 'REVERB • AI Insights',
      active: 'ai',
      report: {
        title: 'AI Insights',
        sections: [
          { title: 'Summary', table: { headers: ['Insight'], rows: aiSummary.insights.map(i => [i]) } },
          { title: 'Gemini Compare (sample)', table: { headers: ['A', 'B', 'Similarity'], rows: [[dupCompare.a, dupCompare.b, dupCompare.similarity]] } }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 23/24/25: Integrations
exports.renderIntegrationsDashboard = async (_req, res, next) => {
  try {
    res.render(REPORT_VIEW, {
      title: 'REVERB • Integrations',
      active: 'integrations',
      report: {
        title: 'Integrations',
        sections: [
          { title: 'Google Analytics', status: { label: 'Connect in Settings', level: 'info' } },
          { title: 'Search Console', status: { label: 'Connect in Settings', level: 'info' } },
          { title: 'PageSpeed Insights', status: { label: 'Connect in Settings', level: 'info' } }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

exports.getAnalyticsOverview = async (_req, res, next) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json({ ok: true, summary });
  } catch (e) {
    next(e);
  }
};

exports.getSearchConsoleOverview = async (_req, res, next) => {
  try {
    const summary = await getSearchConsoleSummary();
    res.json({ ok: true, summary });
  } catch (e) {
    next(e);
  }
};

exports.getPageSpeedOverview = async (_req, res, next) => {
  try {
    const summary = await getPageSpeedSummary();
    res.json({ ok: true, summary });
  } catch (e) {
    next(e);
  }
};


