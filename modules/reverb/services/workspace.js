const { Op } = require('sequelize');
const { models } = require('../database');

const { Workspace } = models;

const ensureProtocol = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const toHostname = (value) => {
  try {
    const url = new URL(ensureProtocol(value));
    return url.hostname.toLowerCase();
  } catch (_) {
    return null;
  }
};

const stripWww = (hostname) => {
  if (!hostname) return null;
  return hostname.replace(/^www\./i, '');
};

const normalizeHostname = (value) => stripWww(toHostname(value));

const isSubdomainOf = (candidate, root) => {
  if (!candidate || !root) return false;
  if (candidate === root) return true;
  return candidate.endsWith(`.${root}`);
};

const ensureWorkspaceForEntity = async ({ entity }) => {
  if (!entity) {
    throw new Error('Entity is required to initialize Reverb workspace');
  }

  const primaryDomain = normalizeHostname(entity.website);
  if (!primaryDomain) {
    const error = new Error('Entity must have a valid website to use Reverb');
    error.code = 'REVERB_NO_WEBSITE';
    throw error;
  }

  const [workspace, created] = await Workspace.findOrCreate({
    where: { entityId: entity.id },
    defaults: {
      primaryDomain,
      allowedSubdomains: [primaryDomain, `www.${primaryDomain}`]
    }
  });

  if (!created) {
    const updates = {};
    if (workspace.primaryDomain !== primaryDomain) {
      updates.primaryDomain = primaryDomain;
      const defaults = [primaryDomain, `www.${primaryDomain}`];
      const set = new Set([...(workspace.allowedSubdomains || []), ...defaults]);
      updates.allowedSubdomains = Array.from(set);
    }
    if (Object.keys(updates).length > 0) {
      await workspace.update(updates);
    }
  }

  return workspace;
};

const getWorkspaceByEntityId = async (entityId) => {
  if (!entityId) return null;
  return Workspace.findOne({ where: { entityId } });
};

const assertDomainAllowed = async ({ entity, workspace, target }) => {
  const activeWorkspace = workspace || await ensureWorkspaceForEntity({ entity });
  const primaryDomain = activeWorkspace.primaryDomain;
  const candidate = target ? normalizeHostname(target) : primaryDomain;

  if (!candidate) {
    const error = new Error('Domain could not be determined from request');
    error.code = 'REVERB_DOMAIN_INVALID';
    throw error;
  }

  if (!isSubdomainOf(candidate, primaryDomain)) {
    const error = new Error('Analysis is restricted to the entity website domain and subdomains');
    error.code = 'REVERB_DOMAIN_NOT_ALLOWED';
    error.details = { candidate, primaryDomain };
    throw error;
  }

  const allowedSubdomains = new Set(activeWorkspace.allowedSubdomains || []);
  if (!allowedSubdomains.has(candidate)) {
    allowedSubdomains.add(candidate);
    await activeWorkspace.update({ allowedSubdomains: Array.from(allowedSubdomains) });
  }

  return { workspace: activeWorkspace, hostname: candidate };
};

const touchAnalysisTimestamp = async (workspaceId, date = new Date()) => {
  if (!workspaceId) return;
  await Workspace.update(
    { lastAnalysisAt: date },
    { where: { id: workspaceId } }
  );
};

const findWorkspacesStaleSince = async (thresholdDate) => {
  if (!thresholdDate) return [];
  return Workspace.findAll({
    where: {
      [Op.or]: [
        { lastAnalysisAt: { [Op.is]: null } },
        { lastAnalysisAt: { [Op.lt]: thresholdDate } }
      ]
    }
  });
};

module.exports = {
  ensureWorkspaceForEntity,
  getWorkspaceByEntityId,
  assertDomainAllowed,
  touchAnalysisTimestamp,
  findWorkspacesStaleSince,
  normalizeHostname,
  isSubdomainOf
};



