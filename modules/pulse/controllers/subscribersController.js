const { sendSuccess, sendError } = require('../utils/responder');
const { Subscriber, Audience, Tag } = require('../models');
const Models = { Subscriber };

exports.list = async (req, res) => {
  try {
    const { audience_id } = req.query;
    const where = audience_id ? { audience_id } : {};
    const items = await Models.Subscriber.findAll({ where });
    return sendSuccess(res, items);
  } catch (e) {
    return sendError(res, 'Failed to list subscribers', 500, e.message);
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Models.Subscriber.findByPk(req.params.id, { include: [{ association: 'tags' }] });
    if (!item) return sendError(res, 'Subscriber not found', 404);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to get subscriber', 500, e.message);
  }
};

exports.create = async (req, res) => {
  try {
    const created = await Models.Subscriber.create(req.body);
    return sendSuccess(res, created, null, 201);
  } catch (e) {
    return sendError(res, 'Failed to create subscriber', 400, e.message);
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Models.Subscriber.findByPk(req.params.id);
    if (!item) return sendError(res, 'Subscriber not found', 404);
    await item.update(req.body);
    return sendSuccess(res, item);
  } catch (e) {
    return sendError(res, 'Failed to update subscriber', 400, e.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Models.Subscriber.findByPk(req.params.id);
    if (!item) return sendError(res, 'Subscriber not found', 404);
    await item.destroy();
    return sendSuccess(res, { id: req.params.id });
  } catch (e) {
    return sendError(res, 'Failed to delete subscriber', 400, e.message);
  }
};

exports.addTag = async (req, res) => {
  try {
    const item = await Models.Subscriber.findByPk(req.params.id);
    if (!item) return sendError(res, 'Subscriber not found', 404);
    const [tag] = await Models.Tag.findOrCreate({ where: { id: req.body.tag_id }, defaults: { name: req.body.name || 'untitled', entity_id: req.body.entity_id } });
    await item.addTag(tag);
    const reloaded = await Models.Subscriber.findByPk(req.params.id, { include: [{ association: 'tags' }] });
    return sendSuccess(res, reloaded);
  } catch (e) {
    return sendError(res, 'Failed to add tag to subscriber', 400, e.message);
  }
};

exports.removeTag = async (req, res) => {
  try {
    const item = await Models.Subscriber.findByPk(req.params.id);
    if (!item) return sendError(res, 'Subscriber not found', 404);
    const tag = await Models.Tag.findByPk(req.body.tag_id);
    if (!tag) return sendError(res, 'Tag not found', 404);
    await item.removeTag(tag);
    const reloaded = await Models.Subscriber.findByPk(req.params.id, { include: [{ association: 'tags' }] });
    return sendSuccess(res, reloaded);
  } catch (e) {
    return sendError(res, 'Failed to remove tag from subscriber', 400, e.message);
  }
};


