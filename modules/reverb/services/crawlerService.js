const crypto = require('crypto');
const { URL } = require('url');
const { Crawl } = require('../models').models;

// Helper: naive HTTP fetch using global fetch if available; otherwise skip network
async function fetchHtml(url) {
  if (typeof fetch !== 'function') {
    return { url, status: 0, html: '', headers: {} };
  }
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { url, status: res.status, html, headers };
  } catch (_e) {
    return { url, status: 0, html: '', headers: {} };
  }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const pattern = /href\s*=\s*"(.*?)"/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1];
    try {
      const absolute = new URL(href, baseUrl).toString();
      links.push(absolute);
    } catch (_e) {}
  }
  return Array.from(new Set(links));
}

function normalizeHost(url) {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return '';
  }
}

// Persist a crawl
async function saveCrawl({ startUrl, pages }) {
  const pageCount = pages.length;
  const digest = crypto.createHash('sha1').update(JSON.stringify(pages)).digest('hex');
  const record = await Crawl.create({
    startUrl,
    status: 'completed',
    pageCount,
    digest,
    result: pages
  });
  return record;
}

// Feature 10/11: Save & Open Crawls + JS Rendering (flag simulated by settings elsewhere)
exports.ensureCrawl = async ({ startUrl }) => {
  const limitedUrl = String(startUrl || '').trim();
  if (!limitedUrl) {
    throw new Error('startUrl required');
  }
  const pages = [];
  const queue = [limitedUrl];
  const seen = new Set();
  const host = normalizeHost(limitedUrl);
  const maxPages = 50; // basic cap; refined by settings in analysis service

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift();
    if (seen.has(next)) continue;
    seen.add(next);

    const { status, html, headers } = await fetchHtml(next);
    pages.push({ url: next, status, html, headers });
    if (status >= 200 && status < 400 && html) {
      const links = extractLinks(html, next).filter(u => normalizeHost(u) === host);
      for (const l of links) {
        if (!seen.has(l)) queue.push(l);
      }
    }
  }
  return saveCrawl({ startUrl: limitedUrl, pages });
};

exports.listSavedCrawls = async () => {
  const rows = await Crawl.findAll({ order: [['created_at', 'DESC']], limit: 50 });
  return rows.map(r => ({
    id: r.id,
    startUrl: r.startUrl,
    pageCount: r.pageCount,
    status: r.status,
    createdAt: r.created_at || r.createdAt
  }));
};

exports.getCrawlById = async (id) => {
  const row = await Crawl.findByPk(id);
  if (!row) throw new Error('Not found');
  return {
    id: row.id,
    startUrl: row.startUrl,
    pageCount: row.pageCount,
    status: row.status,
    pages: Array.isArray(row.result) ? row.result : []
  };
};

// Feature 1: Broken links, errors & redirects
exports.findBrokenLinks = async (crawl) => {
  const pages = Array.isArray(crawl.result) ? crawl.result : crawl.pages || [];
  const items = [];
  let clientError = 0;
  let serverError = 0;
  let redirects = 0;
  let unreachable = 0;

  for (const p of pages) {
    const status = Number(p.status || 0);
    if (status >= 400 && status < 500) {
      clientError++;
      items.push({ source: p.url, url: p.url, status });
    } else if (status >= 500) {
      serverError++;
      items.push({ source: p.url, url: p.url, status });
    } else if (status >= 300 && status < 400) {
      redirects++;
      items.push({ source: p.url, url: p.url, status });
    } else if (!status) {
      unreachable++;
      items.push({ source: p.url, url: p.url, status: 0 });
    }
  }

  return {
    totalBroken: clientError + serverError + unreachable,
    counts: { clientError, serverError, redirects, unreachable },
    items
  };
};

// Feature 12: Crawl comparison
exports.compareTwoCrawls = async (aId, bId) => {
  const a = await this.getCrawlById(aId);
  const b = await this.getCrawlById(bId);
  const rows = [
    ['Pages', a.pageCount, b.pageCount, (b.pageCount - a.pageCount)],
  ];
  return { rows };
};

// Feature 31: Looker Studio export
exports.exportLookerReport = async () => {
  const crawls = await this.listSavedCrawls();
  const json = crawls;
  const csvLines = [['id', 'startUrl', 'pageCount', 'status', 'createdAt']].concat(
    crawls.map(c => [c.id, c.startUrl, c.pageCount, c.status, c.createdAt].join(','))
  );
  return { json, csv: csvLines.join('\n') };
};


