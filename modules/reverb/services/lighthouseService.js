const { createHttpClient } = require('../utils/http');
const { generateSiteAuditMock } = require('../utils/mockData');

const getPageSpeedClient = () => {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;
  return createHttpClient({
    baseURL: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
    params: { key: apiKey }
  });
};

const fetchLighthouseReport = async ({ url, strategy = 'desktop' }) => {
  const client = getPageSpeedClient();
  if (!client) {
    const mock = generateSiteAuditMock({ domain: new URL(url).host });
    return mock.lighthouse;
  }

  const { data } = await client.get('', {
    params: { url, strategy }
  });

  const lighthouse = data?.lighthouseResult?.categories || {};
  return {
    performance: lighthouse.performance?.score || null,
    accessibility: lighthouse.accessibility?.score || null,
    seo: lighthouse.seo?.score || null,
    bestPractices: lighthouse['best-practices']?.score || null
  };
};

module.exports = {
  fetchLighthouseReport
};


