const { sendSuccess, sendError } = require('../utils/responder');
const { Campaign, Audience, Template } = require('../models');
const Models = { Campaign };

exports.list = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.query.entity_id;
    const where = entityId ? { entity_id: entityId } : {};
    const items = await Models.Campaign.findAll({ where, include: ['audience', 'template'] });
    return sendSuccess(res, items);
  } catch (e) {
    return sendError(res, 'Failed to list campaigns', 500, e.message);
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Models.Campaign.findByPk(req.params.id, { include: ['audience', 'template'] });
    if (!item) return sendError(res, 'Campaign not found', 404);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to get campaign', 500, e.message);
  }
};

exports.create = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.body.entity_id;
    if (!entityId) return sendError(res, 'entity_id required', 400);
    const payload = { ...req.body, entity_id: entityId };
    const created = await Models.Campaign.create(payload);
    return sendSuccess(res, created, null, 201);
  } catch (e) {
    return sendError(res, 'Failed to create campaign', 400, e.message);
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Models.Campaign.findByPk(req.params.id);
    if (!item) return sendError(res, 'Campaign not found', 404);
    await item.update(req.body);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to update campaign', 400, e.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Models.Campaign.findByPk(req.params.id);
    if (!item) return sendError(res, 'Campaign not found', 404);
    await item.destroy();
    return sendSuccess(res, { id: req.params.id });
  } catch (e) {
    return sendError(res, 'Failed to delete campaign', 400, e.message);
  }
};

exports.schedule = async (req, res) => {
  try {
    const item = await Models.Campaign.findByPk(req.params.id);
    if (!item) return sendError(res, 'Campaign not found', 404);
    await item.update({ status: 'scheduled', scheduled_for: new Date(req.body.scheduled_for) });
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to schedule campaign', 400, e.message);
  }
};


