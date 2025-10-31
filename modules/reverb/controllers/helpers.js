const { ensureReady, getOrCreateSite } = require('../database');
const { normalizeHost, isAllowedDomain } = require('../utils/domain');

const resolveSite = async (req) => {
  const entityId = req.currentEntity?.id || req.user?.entity_id;
  if (!entityId) {
    throw new Error('An entity must be selected to access REVERB data.');
  }

  const website = req.currentEntity?.website;
  const baseHost = normalizeHost(website);
  if (!baseHost) {
    throw new Error('The selected entity does not have a valid website configured. Please update the entity profile first.');
  }

  const requestedDomainRaw = req.query.domain || req.body?.domain || baseHost;
  const requestedHost = normalizeHost(requestedDomainRaw) || baseHost;
  const allowedHost = isAllowedDomain(requestedHost, baseHost) ? requestedHost : baseHost;

  if (requestedHost !== allowedHost) {
    console.warn('[REVERB] Domain request rejected for entity', entityId, 'requested:', requestedHost, 'allowed:', baseHost);
  }

  await ensureReady();
  const site = await getOrCreateSite({
    entityId,
    domain: allowedHost,
    name: req.currentEntity?.name || allowedHost,
    defaults: {
      location: req.currentEntity?.default_location || 'United States',
      metadata: {
        baseDomain: baseHost
      }
    }
  });

  if (site.metadata && site.metadata.baseDomain !== baseHost) {
    await site.update({
      metadata: {
        ...(site.metadata || {}),
        baseDomain: baseHost
      }
    });
  }

  return { site, entityId, domain: allowedHost, baseDomain: baseHost };
};

module.exports = {
  resolveSite
};


