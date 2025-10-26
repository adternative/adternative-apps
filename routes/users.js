var express = require('express');
var router = express.Router();
const { User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/* GET users listing - Admin only */
router.get('/', requireRole(['admin']), async function(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        fullName: user.getFullName()
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      code: 'FETCH_USERS_ERROR'
    });
  }
});

/* GET specific user - Admin only */
router.get('/:userId', requireRole(['admin']), async function(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        association: 'entities',
        where: { isActive: true },
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        fullName: user.getFullName(),
        entities: user.entities || []
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      code: 'FETCH_USER_ERROR'
    });
  }
});

/* Update user role - Admin only */
router.put('/:userId/role', requireRole(['admin']), async function(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user', 'manager'].includes(role)) {
      return res.status(400).json({
        error: 'Valid role is required',
        code: 'INVALID_ROLE'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.getFullName()
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      code: 'UPDATE_USER_ROLE_ERROR'
    });
  }
});

/* Toggle user active status - Admin only */
router.put('/:userId/toggle-status', requireRole(['admin']), async function(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        fullName: user.getFullName()
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      error: 'Failed to toggle user status',
      code: 'TOGGLE_USER_STATUS_ERROR'
    });
  }
});

module.exports = router;
