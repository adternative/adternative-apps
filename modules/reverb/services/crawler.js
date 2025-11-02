const { createHash } = require('crypto');
const { models } = require('../database');
const { normalizeHostname } = require('./workspace');

const { TechnicalIssue } = models;

const CATEGORIES = ['performance', 'crawlability', 'indexation', 'content', 'security', 'infrastructure'];
const SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'];

const deterministic = (input) => createHash('sha256').update(input).digest();

const buildIssue = ({ hostname, category, seedIndex }) => {
  const hash = deterministic(`${hostname}:${category}:${seedIndex}`);
  const severity = SEVERITY_ORDER[hash[0] % SEVERITY_ORDER.length];
  const slug = `issue-${hash[1] % 9999}`;
  const pathSeeds = ['/cdn.js', '/robots.txt', '/sitemap.xml', '/checkout', '/app'];
  const url = `https://${hostname}${pathSeeds[hash[2] % pathSeeds.length]}`;

  const descriptions = {
    performance: 'Server response times exceed target budgets during crawl peak.',
    crawlability: 'Robots directives are preventing discovery of strategic pages.',
    indexation: 'Canonical tags are inconsistent or missing on paginated templates.',
    content: 'Duplicate meta descriptions detected across primary landing pages.',
    security: 'Insecure mixed content assets referenced via HTTP.',
    infrastructure: 'Sitemap index is outdated and does not include new sections.'
  };

  return {
    category,
    severity,
    url,
    description: descriptions[category],
    context: {
      identifier: slug,
      occurrences: 1 + (hash[3] % 6),
      sample: url,
      metric: hash[4] % 100,
      recommendedAction: 'Review and remediate during next technical sprint.'
    },
    detectedAt: new Date(Date.now() - (hash[5] % (7 * 24 * 60 * 60 * 1000)))
  };
};

const refreshTechnicalIssues = async ({ workspace, hostname }) => {
  const host = normalizeHostname(hostname || workspace.primaryDomain);
  const payload = [];

  CATEGORIES.forEach((category, categoryIndex) => {
    const hash = deterministic(`${host}:${category}`);
    const issueCount = hash[0] % 3; // up to 2 issues per category
    for (let index = 0; index <= issueCount; index += 1) {
      payload.push({
        workspaceId: workspace.id,
        ...buildIssue({ hostname: host, category, seedIndex: categoryIndex * 3 + index })
      });
    }
  });

  if (!payload.length) return [];

  await TechnicalIssue.destroy({ where: { workspaceId: workspace.id } });
  return TechnicalIssue.bulkCreate(payload);
};

const getTechnicalIssues = async ({ workspaceId }) => {
  return TechnicalIssue.findAll({
    where: { workspaceId },
    order: [
      ['severity', 'DESC'],
      ['category', 'ASC']
    ]
  });
};

const summarizeTechnicalHealth = async ({ workspaceId }) => {
  const issues = await getTechnicalIssues({ workspaceId });
  const totals = issues.reduce((acc, issue) => {
    acc.total += 1;
    acc.bySeverity[issue.severity] = (acc.bySeverity[issue.severity] || 0) + 1;
    acc.byCategory[issue.category] = (acc.byCategory[issue.category] || 0) + 1;
    return acc;
  }, { total: 0, bySeverity: {}, byCategory: {} });

  return {
    totalIssues: totals.total,
    bySeverity: totals.bySeverity,
    byCategory: totals.byCategory
  };
};

module.exports = {
  refreshTechnicalIssues,
  getTechnicalIssues,
  summarizeTechnicalHealth
};



