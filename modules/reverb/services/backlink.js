const { createHash } = require('crypto');
const { models } = require('../database');
const { normalizeHostname } = require('./workspace');

const { Backlink } = models;

const SOURCE_DOMAINS = [
  'medium.com',
  'newsroom.com',
  'techradar.com',
  'industryjournal.com',
  'partnernetwork.com',
  'trustedreviewers.org',
  'communityhub.io'
];

const LINK_TYPES = ['follow', 'nofollow', 'ugc', 'sponsored'];

const deterministic = (input) => createHash('sha1').update(input).digest();

const buildBacklink = ({ hostname, index }) => {
  const sourceDomain = SOURCE_DOMAINS[index % SOURCE_DOMAINS.length];
  const hash = deterministic(`${hostname}:${sourceDomain}:${index}`);
  const authorityScore = 35 + (hash[0] % 60);
  const spamScore = hash[1] % 20;
  const type = LINK_TYPES[hash[2] % LINK_TYPES.length];
  const slug = `insights-${hash[3] % 9000}`;

  const now = Date.now();
  const firstSeenOffset = (hash[4] % (120 * 24 * 60 * 60 * 1000));
  const lastSeenOffset = hash[5] % (firstSeenOffset + 1);

  return {
    sourceUrl: `https://${sourceDomain}/articles/${slug}`,
    sourceDomain,
    targetUrl: `https://${hostname}/blog/${slug}`,
    anchorText: `${hostname} ${hash[6] % 2 === 0 ? 'case study' : 'review'}`,
    authorityScore,
    spamScore,
    type,
    firstSeenAt: new Date(now - firstSeenOffset),
    lastSeenAt: new Date(now - lastSeenOffset)
  };
};

const refreshBacklinks = async ({ workspace, hostname, size = 12 }) => {
  const host = normalizeHostname(hostname || workspace.primaryDomain);
  const rows = Array.from({ length: size }, (_, index) => ({
    workspaceId: workspace.id,
    ...buildBacklink({ hostname: host, index })
  }));

  await Backlink.bulkCreate(rows, {
    updateOnDuplicate: [
      'anchor_text',
      'authority_score',
      'spam_score',
      'type',
      'first_seen_at',
      'last_seen_at',
      'updated_at'
    ]
  });

  return Backlink.findAll({
    where: { workspaceId: workspace.id },
    order: [['authorityScore', 'DESC']]
  });
};

const getBacklinks = async ({ workspaceId, limit = 50 }) => {
  return Backlink.findAll({
    where: { workspaceId },
    order: [['authorityScore', 'DESC']],
    limit
  });
};

const summarizeBacklinks = async ({ workspaceId }) => {
  const backlinks = await getBacklinks({ workspaceId, limit: 1000 });
  if (!backlinks.length) {
    return {
      totalReferringDomains: 0,
      averageAuthority: 0,
      linkTypeBreakdown: {}
    };
  }

  const aggregates = backlinks.reduce((acc, backlink) => {
    acc.domains.add(backlink.sourceDomain);
    acc.authority += backlink.authorityScore;
    acc.total += 1;
    acc.linkTypeBreakdown[backlink.type] = (acc.linkTypeBreakdown[backlink.type] || 0) + 1;
    return acc;
  }, { domains: new Set(), authority: 0, total: 0, linkTypeBreakdown: {} });

  return {
    totalReferringDomains: aggregates.domains.size,
    averageAuthority: Math.round(aggregates.authority / aggregates.total),
    linkTypeBreakdown: aggregates.linkTypeBreakdown
  };
};

module.exports = {
  refreshBacklinks,
  getBacklinks,
  summarizeBacklinks
};



