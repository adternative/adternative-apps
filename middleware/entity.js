const { Entity } = require('../models');

// Middleware to handle currently selected entity
const currentEntity = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get entity ID from query params, body, or session
    let entityId = req.query.entityId || req.body.entityId || req.session?.currentEntityId;

    // If no entity ID provided, get the user's first active entity
    if (!entityId) {
      const firstEntity = await Entity.findOne({
        where: {
          userId: req.user.id,
          isActive: true
        },
        order: [['createdAt', 'ASC']]
      });

      if (firstEntity) {
        entityId = firstEntity.id;
        req.session.currentEntityId = entityId;
      }
    }

    if (entityId) {
      // Verify the entity belongs to the user
      const entity = await Entity.findOne({
        where: {
          id: entityId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (entity) {
        req.currentEntity = entity;
        req.session.currentEntityId = entityId;
      } else {
        return res.status(403).json({ 
          error: 'Entity not found or access denied',
          code: 'ENTITY_ACCESS_DENIED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Current entity middleware error:', error);
    return res.status(500).json({ 
      error: 'Entity selection error',
      code: 'ENTITY_SELECTION_ERROR'
    });
  }
};

// Middleware to require a current entity
const requireCurrentEntity = async (req, res, next) => {
  try {
    await currentEntity(req, res, () => {
      if (!req.currentEntity) {
        return res.status(400).json({ 
          error: 'No entity selected. Please select an entity first.',
          code: 'NO_ENTITY_SELECTED'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Require current entity middleware error:', error);
    return res.status(500).json({ 
      error: 'Entity requirement error',
      code: 'ENTITY_REQUIREMENT_ERROR'
    });
  }
};

// Middleware to get user's entities
const getUserEntities = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const entities = await Entity.findAll({
      where: {
        userId: req.user.id,
        isActive: true
      },
      order: [['name', 'ASC']]
    });

    req.userEntities = entities;
    next();
  } catch (error) {
    console.error('Get user entities middleware error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user entities',
      code: 'FETCH_ENTITIES_ERROR'
    });
  }
};

// Helper function to switch current entity
const switchEntity = async (req, res, next) => {
  try {
    const { entityId } = req.body;

    if (!entityId) {
      return res.status(400).json({ 
        error: 'Entity ID required',
        code: 'ENTITY_ID_REQUIRED'
      });
    }

    // Verify the entity belongs to the user
    const entity = await Entity.findOne({
      where: {
        id: entityId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!entity) {
      return res.status(403).json({ 
        error: 'Entity not found or access denied',
        code: 'ENTITY_ACCESS_DENIED'
      });
    }

    req.session.currentEntityId = entityId;
    req.currentEntity = entity;

    res.json({
      success: true,
      message: 'Entity switched successfully',
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry
      }
    });
  } catch (error) {
    console.error('Switch entity error:', error);
    return res.status(500).json({ 
      error: 'Failed to switch entity',
      code: 'SWITCH_ENTITY_ERROR'
    });
  }
};

module.exports = {
  currentEntity,
  requireCurrentEntity,
  getUserEntities,
  switchEntity
};
