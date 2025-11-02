const { runAnalysis, FEATURE_KEYS } = require('../services/analysis');
const { ensureEntity } = require('./shared');

const parseFeatures = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return input.split(',').map((value) => value.trim()).filter(Boolean);
  }
  return [];
};

const parseKeywords = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((value) => String(value).trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input.split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
  }
  return [];
};

const wantsJson = (req) => {
  const accepts = req.get('accept') || '';
  const contentType = req.get('content-type') || '';
  const requestedWith = req.get('x-requested-with') || '';
  return contentType.includes('application/json')
    || accepts.includes('application/json')
    || requestedWith.toLowerCase() === 'xmlhttprequest';
};

const triggerAnalysis = async (req, res, next) => {
  try {
    const entity = ensureEntity(req);
    const domain = req.body?.domain || req.query?.domain || null;
    const features = parseFeatures(req.body?.features || req.query?.features);
    const keywords = parseKeywords(req.body?.keywords || req.query?.keywords);

    const result = await runAnalysis({ entity, domain, features, keywords });

    if (wantsJson(req)) {
      return res.json({
        success: true,
        features: result.features,
        summary: result.summary,
        hostname: result.hostname,
        workspace: result.workspace
      });
    }

    const params = new URLSearchParams({
      status: 'success',
      message: 'Analysis updated successfully'
    });

    return res.redirect(303, `/reverb?${params.toString()}`);
  } catch (error) {
    if (wantsJson(req)) {
      const status = error.code === 'REVERB_DOMAIN_NOT_ALLOWED' ? 403 : error.status || 400;
      return res.status(status).json({
        success: false,
        error: error.message,
        code: error.code || 'REVERB_ANALYSIS_ERROR',
        details: error.details || null
      });
    }

    const params = new URLSearchParams({
      status: 'error',
      message: error.message || 'Failed to refresh analysis'
    });
    return res.redirect(303, `/reverb?${params.toString()}`);
  }
};

module.exports = {
  triggerAnalysis,
  FEATURE_KEYS
};



