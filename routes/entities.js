const express = require('express');
const { Entity } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { currentEntity, requireCurrentEntity, getUserEntities, switchEntity } = require('../middleware/entity');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's entities
router.get('/', getUserEntities, async (req, res) => {
  try {
    res.json({
      success: true,
      entities: req.userEntities.map(entity => ({
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        description: entity.description,
        website: entity.website,
        socialMediaPlatforms: entity.socialMediaPlatforms,
        googleSearchConsole: entity.googleSearchConsole,
        integrations: entity.integrations,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({
      error: 'Failed to fetch entities',
      code: 'FETCH_ENTITIES_ERROR'
    });
  }
});

// Get current entity
router.get('/current', currentEntity, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.status(404).json({
        error: 'No entity selected',
        code: 'NO_ENTITY_SELECTED'
      });
    }

    res.json({
      success: true,
      entity: {
        id: req.currentEntity.id,
        name: req.currentEntity.name,
        industry: req.currentEntity.industry,
        description: req.currentEntity.description,
        website: req.currentEntity.website,
        socialMediaPlatforms: req.currentEntity.socialMediaPlatforms,
        googleSearchConsole: req.currentEntity.googleSearchConsole,
        integrations: req.currentEntity.integrations,
        createdAt: req.currentEntity.createdAt,
        updatedAt: req.currentEntity.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current entity error:', error);
    res.status(500).json({
      error: 'Failed to fetch current entity',
      code: 'FETCH_CURRENT_ENTITY_ERROR'
    });
  }
});

// Create new entity
router.post('/', async (req, res) => {
  try {
    const { name, industry, description, website } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        error: 'Name and industry are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const entity = await Entity.create({
      name,
      industry,
      description,
      website,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Entity created successfully',
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        description: entity.description,
        website: entity.website,
        socialMediaPlatforms: entity.socialMediaPlatforms,
        googleSearchConsole: entity.googleSearchConsole,
        integrations: entity.integrations,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({
      error: 'Failed to create entity',
      code: 'CREATE_ENTITY_ERROR'
    });
  }
});

// Get specific entity
router.get('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        description: entity.description,
        website: entity.website,
        socialMediaPlatforms: entity.socialMediaPlatforms,
        googleSearchConsole: entity.googleSearchConsole,
        integrations: entity.integrations,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Get entity error:', error);
    res.status(500).json({
      error: 'Failed to fetch entity',
      code: 'FETCH_ENTITY_ERROR'
    });
  }
});

// Update entity
router.put('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { name, industry, description, website, socialMediaPlatforms, googleSearchConsole, integrations } = req.body;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    await entity.update({
      name: name || entity.name,
      industry: industry || entity.industry,
      description: description !== undefined ? description : entity.description,
      website: website !== undefined ? website : entity.website,
      socialMediaPlatforms: socialMediaPlatforms || entity.socialMediaPlatforms,
      googleSearchConsole: googleSearchConsole || entity.googleSearchConsole,
      integrations: integrations || entity.integrations
    });

    res.json({
      success: true,
      message: 'Entity updated successfully',
      entity: {
        id: entity.id,
        name: entity.name,
        industry: entity.industry,
        description: entity.description,
        website: entity.website,
        socialMediaPlatforms: entity.socialMediaPlatforms,
        googleSearchConsole: entity.googleSearchConsole,
        integrations: entity.integrations,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    });
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({
      error: 'Failed to update entity',
      code: 'UPDATE_ENTITY_ERROR'
    });
  }
});

// Delete entity (soft delete)
router.delete('/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;

    const entity = await Entity.findOne({
      where: {
        id: entityId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        code: 'ENTITY_NOT_FOUND'
      });
    }

    await entity.update({ isActive: false });

    res.json({
      success: true,
      message: 'Entity deleted successfully'
    });
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({
      error: 'Failed to delete entity',
      code: 'DELETE_ENTITY_ERROR'
    });
  }
});

// Switch current entity
router.post('/switch', switchEntity);

module.exports = router;
