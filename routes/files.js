const express = require('express');
const router = express.Router();

const { getSignedUrl, bucket, endpoint } = require('../config/storage');

const getHost = (urlString) => {
  try { return new URL(urlString).host; } catch (_) { return ''; }
};

const getPathname = (urlString) => {
  try { return new URL(urlString).pathname || ''; } catch (_) { return ''; }
};

const WASABI_HOST = getHost(endpoint);

const deriveKeyFromUrl = (urlString) => {
  try {
    const u = new URL(urlString);
    const host = u.host;
    const pathname = (u.pathname || '/').replace(/^\/+/, '');
    // Virtual-hosted-style: <bucket>.<endpoint>/key
    if (host.startsWith(`${bucket}.`)) {
      return pathname;
    }
    // Path-style: <endpoint>/<bucket>/key
    if (host === WASABI_HOST && pathname.startsWith(`${bucket}/`)) {
      return pathname.substring(bucket.length + 1);
    }
    // Fallback: if URL contains bucket in path, extract after first occurrence
    const idx = pathname.indexOf(`${bucket}/`);
    if (idx >= 0) {
      return pathname.substring(idx + bucket.length + 1);
    }
  } catch (_) {}
  return null;
};

// GET /files?key=... or /files?url=...
router.get('/', async (req, res, next) => {
  try {
    const keyParam = (req.query.key || '').toString().replace(/^\/+/, '');
    const urlParam = (req.query.url || '').toString();

    let key = keyParam;
    if (!key && urlParam) {
      key = deriveKeyFromUrl(urlParam);
    }

    if (!key) {
      return res.status(400).send('Missing or invalid file key');
    }

    const signedUrl = await getSignedUrl(key, 300);
    return res.redirect(302, signedUrl);
  } catch (error) {
    next(error);
  }
});

module.exports = router;


