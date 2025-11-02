const { createHash } = require('crypto');
const { models } = require('../database');
const { normalizeHostname } = require('./workspace');

const { PageAudit } = models;

const defaultPaths = ['/', '/about', '/pricing', '/blog', '/contact'];

const hashNumber = (value, mod, offset = 0) => {
  const hash = createHash('sha1').update(value).digest();
  return (hash[0] % mod) + offset;
};

const buildIssues = (url, auditScore) => {
  const issues = [];
  if (auditScore < 85) {
    issues.push({
      code: 'content_internal_links',
      title: 'Insufficient internal linking',
      severity: auditScore < 70 ? 'high' : 'medium',
      recommendation: 'Add contextual internal links using descriptive anchor text',
      url
    });
  }
  if (auditScore < 78) {
    issues.push({
      code: 'performance_lcp',
      title: 'Largest Contentful Paint above 2.5s',
      severity: 'high',
      recommendation: 'Optimize hero images and enable HTTP caching headers',
      url
    });
  }
  if (auditScore < 92) {
    issues.push({
      code: 'seo_title_length',
      title: 'Title length could be improved',
      severity: 'low',
      recommendation: 'Keep title between 50-60 characters and include primary keyword',
      url
    });
  }
  return issues;
};

const evaluatePage = ({ hostname, path }) => {
  const url = `https://${hostname}${path === '/' ? '' : path}`;
  const perf = 55 + hashNumber(url, 40);
  const seo = 60 + hashNumber(`${url}:seo`, 35);
  const accessibility = 65 + hashNumber(`${url}:a11y`, 30);
  const bestPractices = 50 + hashNumber(`${url}:bp`, 45);
  const auditScore = Math.round(perf * 0.35 + seo * 0.4 + accessibility * 0.15 + bestPractices * 0.1);

  const hash = createHash('md5').update(url).digest();
  const wordCount = 500 + (hash[1] % 9) * 120;
  const titleLength = 45 + (hash[2] % 25);

  return {
    url,
    statusCode: 200,
    auditScore: Math.min(100, auditScore),
    lighthouseScore: {
      performance: Math.min(100, perf),
      seo: Math.min(100, seo),
      accessibility: Math.min(100, accessibility),
      bestPractices: Math.min(100, bestPractices)
    },
    issues: buildIssues(url, auditScore),
    metadata: {
      wordCount,
      titleLength,
      headings: {
        h1: 1,
        h2: 3 + (hash[3] % 3),
        h3: 4 + (hash[4] % 4)
      },
      schema: hash[5] % 2 === 0
    },
    lastCrawledAt: new Date()
  };
};

const refreshPageAudits = async ({ workspace, hostname, paths }) => {
  const host = normalizeHostname(hostname || workspace.primaryDomain);
  const pathList = paths && paths.length ? paths : defaultPaths;
  const evaluations = pathList.map((path) => evaluatePage({ hostname: host, path }));

  const payload = evaluations.map((evaluation) => ({
    workspaceId: workspace.id,
    ...evaluation
  }));

  await PageAudit.bulkCreate(payload, {
    updateOnDuplicate: [
      'status_code',
      'audit_score',
      'lighthouse_score',
      'issues',
      'metadata',
      'last_crawled_at',
      'updated_at'
    ]
  });

  return PageAudit.findAll({
    where: { workspaceId: workspace.id },
    order: [['auditScore', 'DESC']]
  });
};

const getPageAudits = async ({ workspaceId }) => {
  return PageAudit.findAll({
    where: { workspaceId },
    order: [['auditScore', 'DESC']]
  });
};

const summarizeAudits = async ({ workspaceId }) => {
  const audits = await getPageAudits({ workspaceId });
  if (!audits.length) {
    return {
      totalPages: 0,
      averageScore: 0,
      bestPage: null,
      issueTally: {}
    };
  }

  const result = audits.reduce((acc, audit) => {
    acc.totalPages += 1;
    acc.score += audit.auditScore;
    if (!acc.bestPage || audit.auditScore > acc.bestPage.auditScore) {
      acc.bestPage = audit;
    }
    (Array.isArray(audit.issues) ? audit.issues : []).forEach((issue) => {
      acc.issueTally[issue.code] = (acc.issueTally[issue.code] || 0) + 1;
    });
    return acc;
  }, { totalPages: 0, score: 0, bestPage: null, issueTally: {} });

  return {
    totalPages: result.totalPages,
    averageScore: Math.round(result.score / result.totalPages),
    bestPage: result.bestPage,
    issueTally: result.issueTally
  };
};

module.exports = {
  refreshPageAudits,
  getPageAudits,
  summarizeAudits
};



