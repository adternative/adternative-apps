const { sendSuccess, sendError } = require('../utils/responder');
const { Audience, Campaign, Subscriber } = require('../models');
const Models = { Audience };

exports.list = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.query.entity_id;
    const where = entityId ? { entity_id: entityId } : {};
    const items = await Models.Audience.findAll({ where });
    return sendSuccess(res, items);
  } catch (e) {
    return sendError(res, 'Failed to list audiences', 500, e.message);
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Models.Audience.findByPk(req.params.id);
    if (!item) return sendError(res, 'Audience not found', 404);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to get audience', 500, e.message);
  }
};

exports.create = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.body.entity_id;
    if (!entityId) return sendError(res, 'entity_id required', 400);
    const payload = { ...req.body, entity_id: entityId };
    const created = await Models.Audience.create(payload);
    return sendSuccess(res, created, null, 201);
  } catch (e) {
    return sendError(res, 'Failed to create audience', 400, e.message);
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Models.Audience.findByPk(req.params.id);
    if (!item) return sendError(res, 'Audience not found', 404);
    await item.update(req.body);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to update audience', 400, e.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Models.Audience.findByPk(req.params.id);
    if (!item) return sendError(res, 'Audience not found', 404);
    await item.destroy();
    return sendSuccess(res, { id: req.params.id });
  } catch (e) {
    return sendError(res, 'Failed to delete audience', 400, e.message);
  }
};


