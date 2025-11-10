const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');
const { getAvailableApps } = require('../utils/appLoader');

const Demographic = require('../models/Demographic');

// Ensure all routes require auth
router.use(authenticateToken);

// GET /demographics – Render demographics page (list + create)
router.get('/', currentEntity, async (req, res) => {
  try {
    // If no entity selected, render empty state (frame handles prompting)
    if (!req.currentEntity) {
      return res.render('demographics', {
        title: 'Demographics',
        user: req.user,
        demographics: [],
        editingDemographic: null
      });
    }

    const entityId = req.currentEntity.id;
    const demographicId = req.query.id || null;

    // Load all demographics for the current entity
    const records = await Demographic.findAll({ where: { entity_id: entityId }, order: [['createdAt', 'DESC']] });
    // Ensure we render plain data (JSON fields as plain objects)
    const demographics = Array.isArray(records) ? records.map(r => r.get({ plain: true })) : [];

    // If editing, load the specific demographic
    let editingDemographic = null;
    if (demographicId) {
      const demographicRecord = await Demographic.findOne({
        where: { id: demographicId, entity_id: entityId }
      });
      if (demographicRecord) {
        editingDemographic = demographicRecord.get({ plain: true });
      }
    }

    return res.render('demographics', {
      title: 'Demographics',
      user: req.user,
      demographics,
      editingDemographic
    });
  } catch (error) {
    console.error('[Demographics] Render error:', error);
    res.status(500);
    return res.render('demographics', {
      title: 'Demographics',
      user: req.user,
      demographics: [],
      editingDemographic: null,
      error: 'Failed to load demographics'
    });
  }
});

// POST /demographics – Create or update demographics for the current entity
router.post('/', currentEntity, async (req, res) => {
  try {
    if (!req.currentEntity) {
      return res.redirect('/demographics?error=no_entity');
    }

    const entityId = req.currentEntity.id;
    const demographicId = req.body.id || null;
    const isUpdate = Boolean(demographicId);

    // Extract and sanitize fields
    const {
      name: rawName,
      demographics: demographicsJson,
      age_min,
      age_max,
      gender,
      country,
      city,
      income_min,
      income_max,
      interests,
      education,
      language: rawLanguage
    } = req.body || {};

    const coerceNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Optional demographics JSON ignored for model compatibility (no "demographics" column)
    if (typeof demographicsJson === 'string' && demographicsJson.trim()) {
      try { JSON.parse(demographicsJson); } catch (_) {
        return res.redirect('/demographics?error=invalid_demographics');
      }
    }

    const ageRange = {
      min: coerceNum(age_min),
      max: coerceNum(age_max)
    };
    const incomeRange = {
      min: coerceNum(income_min),
      max: coerceNum(income_max)
    };
    // Normalize gender to ENUM value accepted by the model
    const allowedGenders = ['male', 'female', 'non-binary', 'all'];
    const selectedGender = Array.isArray(gender) ? gender[0] : gender;
    const genderVal = (typeof selectedGender === 'string' && allowedGenders.includes(selectedGender)) ? selectedGender : 'all';
    const interestsArr = typeof interests === 'string' ? interests.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(interests) ? interests : []);
    const normalizeLanguageCode = (v) => {
      if (typeof v !== 'string') return null;
      const t = v.trim();
      if (!t) return null;
      const parts = t.split('-');
      if (parts.length === 1) return parts[0].toLowerCase();
      if (parts.length === 2) return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      return t;
    };
    const language = normalizeLanguageCode(rawLanguage);

    // Build record fields to satisfy Demographic model (requires name)
    const derivedName = typeof rawName === 'string' && rawName.trim()
      ? rawName.trim()
      : `Audience for ${req.currentEntity.name || 'entity'}`;
    const record = {
      entity_id: entityId,
      name: derivedName,
      age_range: ageRange,
      gender: genderVal,
      location: { country: country || null, city: city || null },
      income: incomeRange,
      interests: interestsArr,
      ...(language ? { language } : {}),
      ...(education ? { education } : {})
    };

    if (isUpdate) {
      // Update existing demographic
      const existingDemographic = await Demographic.findOne({ where: { id: demographicId, entity_id: entityId } });
      if (!existingDemographic) {
        return res.redirect('/demographics?error=demographic_not_found');
      }
      await existingDemographic.update(record);
      return res.redirect(`/demographics?id=${demographicId}&updated=1`);
    } else {
      // Create a new demographic record (multiple per entity supported)
      await Demographic.create(record);
      return res.redirect('/demographics?saved=1');
    }
  } catch (error) {
    console.error('[Demographics] Save error:', error);
    return res.redirect('/demographics?error=server_error');
  }
});

module.exports = router;


