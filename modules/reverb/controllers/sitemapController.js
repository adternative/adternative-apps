const { buildSitemapXml } = require('../services/seoAnalysisService');

// Feature 6: Generate XML Sitemaps
exports.generateXmlSitemap = async (req, res, next) => {
  try {
    const xml = await buildSitemapXml({ entity: req.currentEntity });
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) {
    next(e);
  }
};


