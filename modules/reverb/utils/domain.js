const ensureProtocol = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;
  return `https://${str}`;
};

const normalizeHost = (value) => {
  const withProtocol = ensureProtocol(value);
  if (!withProtocol) return null;
  try {
    const url = new URL(withProtocol);
    const host = url.hostname ? url.hostname.toLowerCase() : null;
    if (!host) return null;
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch (error) {
    return null;
  }
};

const isAllowedDomain = (candidate, base) => {
  if (!candidate || !base) return false;
  if (candidate === base) return true;
  return candidate.length > base.length + 1 && candidate.endsWith(`.${base}`);
};

module.exports = {
  normalizeHost,
  isAllowedDomain
};


