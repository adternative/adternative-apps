const { sendSuccess, sendError } = require('../utils/responder');
const { Template } = require('../models');
const Models = { Template };

exports.list = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.query.entity_id;
    const where = entityId ? { entity_id: entityId } : {};
    const items = await Models.Template.findAll({ where });
    return sendSuccess(res, items);
  } catch (e) {
    return sendError(res, 'Failed to list templates', 500, e.message);
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Models.Template.findByPk(req.params.id);
    if (!item) return sendError(res, 'Template not found', 404);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to get template', 500, e.message);
  }
};

exports.create = async (req, res) => {
  try {
    const entityId = req.currentEntity?.id || req.body.entity_id;
    if (!entityId) return sendError(res, 'entity_id required', 400);
    const payload = { ...req.body, entity_id: entityId };
    const created = await Models.Template.create(payload);
    return sendSuccess(res, created, null, 201);
  } catch (e) {
    return sendError(res, 'Failed to create template', 400, e.message);
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Models.Template.findByPk(req.params.id);
    if (!item) return sendError(res, 'Template not found', 404);
    await item.update(req.body);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to update template', 400, e.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Models.Template.findByPk(req.params.id);
    if (!item) return sendError(res, 'Template not found', 404);
    await item.destroy();
    return sendSuccess(res, { id: req.params.id });
  } catch (e) {
    return sendError(res, 'Failed to delete template', 400, e.message);
  }
};


