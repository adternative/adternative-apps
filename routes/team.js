const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');
const { getAvailableApps } = require('../utils/appLoader');

const { User, Entity, EntityUsers } = require('../models');

// Require auth
router.use(authenticateToken);

async function getMembership(entityId, userId) {
  return EntityUsers.findOne({ where: { entity_id: entityId, user_id: userId } });
}

function canManageMembers(entity, membership, currentUserId) {
  const role = membership ? membership.role : null;
  // Allow managers/owners via pivot, or the primary entity owner by direct ownership
  return Boolean(role === 'owner' || role === 'manager' || (entity && entity.user_id === currentUserId));
}

// GET /team – Manage current entity members
router.get('/', currentEntity, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.render('team', {
        title: 'Team',
        user: req.user,
        members: [],
        canManage: false
      });
    }

    const entity = await Entity.findByPk(req.currentEntity.id, {
      include: [{ association: 'members' }]
    });

    // Map members from pivot
    const members = (entity.members || []).map((m) => ({
      id: m.id,
      email: m.email,
      first_name: m.first_name,
      last_name: m.last_name,
      role: (m.EntityUsers && m.EntityUsers.role) || 'editor'
    }));

    // Ensure primary owner is included
    if (entity.user_id) {
      const ownerExists = members.some((m) => m.id === entity.user_id);
      if (!ownerExists) {
        const ownerUser = await User.findByPk(entity.user_id);
        if (ownerUser) {
          members.unshift({
            id: ownerUser.id,
            email: ownerUser.email,
            first_name: ownerUser.first_name,
            last_name: ownerUser.last_name,
            role: 'owner'
          });
        }
      }
    }

    const membership = await getMembership(entity.id, req.user.id);
    const canManage = canManageMembers(entity, membership, req.user.id);

    return res.render('team', {
      title: 'Team',
      user: req.user,
      members,
      canManage
    });
  } catch (error) {
    console.error('[Team] Render error:', error);
    res.status(500);
    return res.render('team', {
      title: 'Team',
      user: req.user,
      members: [],
      canManage: false,
      error: 'Failed to load team'
    });
  }
});

// POST /team/add – Add or update a member's role (HTML or JSON)
router.post('/add', currentEntity, async (req, res) => {
  try {
    const prefersJson = (req.accepts(['html', 'json']) === 'json') || req.is('application/json');
    if (!req.currentEntity) {
      if (prefersJson) return res.status(400).json({ success: false, error: 'No entity selected', code: 'NO_ENTITY_SELECTED' });
      return res.redirect('/team?error=no_entity');
    }

    const entity = await Entity.findByPk(req.currentEntity.id);
    const membership = await getMembership(entity.id, req.user.id);
    const canManage = canManageMembers(entity, membership, req.user.id);
    if (!canManage) {
      if (prefersJson) return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
      return res.redirect('/team?error=forbidden');
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const roleRaw = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : 'editor';
    const allowedRoles = ['manager', 'editor'];
    const isOwner = membership && membership.role === 'owner' || (entity.user_id === req.user.id);
    const finalRole = (allowedRoles.includes(roleRaw) || (isOwner && roleRaw === 'owner')) ? roleRaw : 'editor';

    if (!email) {
      if (prefersJson) return res.status(400).json({ success: false, error: 'Email is required', code: 'MISSING_EMAIL' });
      return res.redirect('/team?error=missing_email');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Send invite email to non-existing user
      try {
        const inviterName = `${req.user.first_name} ${req.user.last_name}`.trim();
        const entityName = entity && entity.name ? entity.name : 'your entity';
        const { sendTeamInviteEmail } = require('../utils/mailer');
        await sendTeamInviteEmail({
          toEmail: email,
          role: finalRole,
          entityName,
          inviterName,
          inviterEmail: req.user.email
        });
      } catch (e) {
        console.error('[Team] Invite email send error:', e);
      }
      if (prefersJson) return res.json({ success: true, invited: true });
      return res.redirect('/team?invited=1');
    }

    if (user.id === entity.user_id && finalRole !== 'owner') {
      // Primary owner must remain owner
      return res.redirect('/team?error=cannot_downgrade_owner');
    }

    const existing = await EntityUsers.findOne({ where: { entity_id: entity.id, user_id: user.id } });
    if (existing) {
      await existing.update({ role: finalRole });
    } else {
      await EntityUsers.create({ entity_id: entity.id, user_id: user.id, role: finalRole });
    }

    if (prefersJson) {
      return res.status(201).json({ success: true, member: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: finalRole } });
    }
    return res.redirect('/team?added=1');
  } catch (error) {
    console.error('[Team] Add member error:', error);
    const prefersJson = (req.accepts(['html', 'json']) === 'json') || req.is('application/json');
    if (prefersJson) return res.status(500).json({ success: false, error: 'Failed to add member', code: 'ADD_MEMBER_ERROR' });
    return res.redirect('/team?error=server_error');
  }
});

// POST /team/remove – Remove a member by email
router.post('/remove', currentEntity, async (req, res) => {
  try {
    if (!req.currentEntity) return res.redirect('/team?error=no_entity');

    const entity = await Entity.findByPk(req.currentEntity.id);
    const membership = await getMembership(entity.id, req.user.id);
    const canManage = canManageMembers(entity, membership, req.user.id);
    if (!canManage) return res.redirect('/team?error=forbidden');

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.redirect('/team?error=missing_email');

    const user = await User.findOne({ where: { email } });
    if (!user) return res.redirect('/team?error=user_not_found');

    // Prevent removing the primary owner
    if (user.id === entity.user_id) {
      return res.redirect('/team?error=cannot_remove_owner');
    }

    const existing = await EntityUsers.findOne({ where: { entity_id: entity.id, user_id: user.id } });
    if (existing) {
      await existing.destroy();
    }

    return res.redirect('/team?removed=1');
  } catch (error) {
    console.error('[Team] Remove member error:', error);
    return res.redirect('/team?error=server_error');
  }
});

module.exports = router;


