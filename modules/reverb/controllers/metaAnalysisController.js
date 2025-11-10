const path = require('path');
const {
  analyseMetaForCrawl,
  reviewRobotsForCrawl,
  auditHreflangForCrawl,
  discoverDuplicatesForCrawl,
  discoverNearDuplicatesForCrawl,
  siteGraphForCrawl,
  customSearch,
  customExtract,
  executeCustomJavaScript,
  accessibilityAuditForCrawl,
  ampValidationForCrawl,
  structuredDataValidationForCrawl,
  spellingAndGrammarForCrawl,
  listAllSegments,
  saveSegmentDefinition,
  loadLatestCrawlOrRun
} = require('../services/seoAnalysisService');

const REPORT_VIEW = path.join(__dirname, '..', 'views', 'report.pug');

// Feature 2: Analyse Page Titles & Meta Data
exports.analyseMeta = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { summary, rows } = await analyseMetaForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Meta Analysis',
      active: 'meta',
      report: {
        title: 'Page Titles & Meta Data',
        description: 'Review title length, missing descriptions, duplicate titles and more.',
        sections: [
          {
            title: 'Summary',
            status: { label: summary.label, level: summary.level },
            table: { headers: ['Metric', 'Value'], rows: summary.rows }
          },
          {
            title: 'Pages',
            table: { headers: ['URL', 'Title', 'Title Length', 'Description'], rows }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 3: Review Meta Robots & Directives
exports.reviewRobots = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { rows, blockedCount } = await reviewRobotsForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Robots & Directives',
      active: 'robots',
      report: {
        title: 'Meta Robots & Directives',
        description: 'Inspect robots meta tags and X-Robots-Tag headers across pages.',
        sections: [
          {
            title: 'Summary',
            status: { label: blockedCount > 0 ? `${blockedCount} blocked` : 'No blocks found', level: blockedCount > 0 ? 'warn' : 'ok' }
          },
          {
            title: 'Pages',
            table: { headers: ['URL', 'Robots', 'Canonical'], rows }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 4: Audit hreflang Attributes
exports.auditHreflang = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { issues, rows } = await auditHreflangForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • hreflang Audit',
      active: 'hreflang',
      report: {
        title: 'hreflang Attributes',
        description: 'Validate hreflang values, self-references, and reciprocals.',
        sections: [
          {
            title: 'Summary',
            status: { label: issues > 0 ? `${issues} issues` : 'No issues found', level: issues > 0 ? 'warn' : 'ok' }
          },
          {
            title: 'Pages',
            table: { headers: ['URL', 'hreflang', 'href'], rows }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 5: Discover Exact Duplicate Pages
exports.discoverExactDuplicates = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { groups } = await discoverDuplicatesForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Exact Duplicates',
      active: 'duplicates',
      report: {
        title: 'Exact Duplicate Pages',
        description: 'Pages with identical normalized content.',
        sections: groups.map((g, i) => ({
          title: `Group #${i + 1} (${g.urls.length} pages)`,
          table: { headers: ['URL'], rows: g.urls.map(u => [u]) }
        }))
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 13: Near Duplicate Content
exports.discoverNearDuplicates = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { pairs } = await discoverNearDuplicatesForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Near Duplicates',
      active: 'near-duplicates',
      report: {
        title: 'Near Duplicate Content',
        description: 'Content pairs with high similarity based on shingling.',
        sections: [
          {
            title: 'Similar Pairs',
            table: { headers: ['URL A', 'URL B', 'Similarity'], rows: pairs.map(p => [p.a, p.b, `${Math.round(p.similarity * 100)}%`]) }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 7: Site Visualisations
exports.siteVisualisations = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const graph = await siteGraphForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Site Visualisations',
      active: 'visualisations',
      report: {
        title: 'Site Visualisations',
        description: 'Basic link graph derived from the last crawl.',
        sections: [
          {
            title: 'Graph',
            chart: { type: 'force', data: graph }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 19: Custom Source Code Search
exports.customSourceSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const { rows } = await customSearch({ query: q });
    res.render(REPORT_VIEW, {
      title: 'REVERB • Source Search',
      active: 'source-search',
      report: {
        title: 'Custom Source Code Search',
        description: 'Search HTML source captured in the latest crawl.',
        sections: [
          {
            title: 'Matches',
            table: { headers: ['URL', 'Match Count'], rows: rows.map(r => [r.url, r.count]) }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 20: Custom Extraction
exports.customExtraction = async (req, res, next) => {
  try {
    const { selector } = req.body || {};
    const { rows } = await customExtract({ selector });
    res.json({ ok: true, rows });
  } catch (e) {
    next(e);
  }
};

// Feature 21: Custom JavaScript Execution
exports.customJavaScriptExecution = async (req, res, next) => {
  try {
    const { script } = req.body || {};
    const { results } = await executeCustomJavaScript({ script });
    res.json({ ok: true, results });
  } catch (e) {
    next(e);
  }
};

// Feature 26: Accessibility Auditing
exports.accessibilityAudit = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { issues, rows } = await accessibilityAuditForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Accessibility',
      active: 'accessibility',
      report: {
        title: 'Accessibility Auditing',
        sections: [
          { title: 'Summary', status: { label: `${issues} potential issues`, level: issues > 0 ? 'warn' : 'ok' } },
          { title: 'Findings', table: { headers: ['URL', 'Issue', 'Count'], rows } }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 16: AMP Crawling & Validation
exports.ampValidation = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { rows } = await ampValidationForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • AMP',
      active: 'amp',
      report: {
        title: 'AMP Validation',
        sections: [
          { title: 'Results', table: { headers: ['URL', 'AMP', 'Valid'], rows } }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 17: Structured Data & Validation
exports.structuredDataValidation = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { rows } = await structuredDataValidationForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Structured Data',
      active: 'structured-data',
      report: {
        title: 'Structured Data & Validation',
        sections: [
          { title: 'Detected', table: { headers: ['URL', 'Type', 'Valid'], rows } }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 18: Spelling & Grammar Checks
exports.spellingAndGrammar = async (req, res, next) => {
  try {
    const crawl = await loadLatestCrawlOrRun({ startUrl: req.query.startUrl, entity: req.currentEntity });
    const { rows } = await spellingAndGrammarForCrawl(crawl);
    res.render(REPORT_VIEW, {
      title: 'REVERB • Spelling & Grammar',
      active: 'spelling',
      report: {
        title: 'Spelling & Grammar Checks',
        sections: [{ title: 'Findings', table: { headers: ['URL', 'Issue', 'Count'], rows } }]
      }
    });
  } catch (e) {
    next(e);
  }
};

// Feature 29: Segmentation
exports.listSegments = async (req, res, next) => {
  try {
    const { segments } = await listAllSegments();
    res.render(REPORT_VIEW, {
      title: 'REVERB • Segments',
      active: 'segments',
      report: {
        title: 'Segmentation',
        sections: [
          {
            title: 'Segments',
            table: { headers: ['ID', 'Name'], rows: segments.map(s => [s.id, s.name]) }
          }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
};

exports.saveSegment = async (req, res, next) => {
  try {
    const { name, rules } = req.body || {};
    const saved = await saveSegmentDefinition({ name, rules });
    res.json({ ok: true, id: saved.id });
  } catch (e) {
    next(e);
  }
};


