const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { currentEntity } = require('../middleware/entity');
const { withAvailableApps } = require('../middleware/paywall');
const { getAvailableApps } = require('../utils/appLoader');

const Demographic = require('../models/Demographic');

// Ensure all routes require auth and load available apps for sidebar
router.use(authenticateToken, withAvailableApps);

// GET /demographics – Render demographics page (list + create)
router.get('/', currentEntity, async (req, res) => {
  try {
    // If no entity selected, render empty state (frame handles prompting)
    if (!req.currentEntity) {
      return res.render('demographics', {
        title: 'Demographics',
        user: req.user,
        availableApps: req.availableApps || getAvailableApps(),
        demographics: []
      });
    }

    const entityId = req.currentEntity.id;

    // The model enforces one record per entity, but present it as a list for UI consistency
    const record = await Demographic.findOne({ where: { entity_id: entityId } });
    const demographics = record ? [record] : [];

    return res.render('demographics', {
      title: 'Demographics',
      user: req.user,
      availableApps: req.availableApps || getAvailableApps(),
      demographics
    });
  } catch (error) {
    console.error('[Demographics] Render error:', error);
    res.status(500);
    return res.render('demographics', {
      title: 'Demographics',
      user: req.user,
      availableApps: req.availableApps || getAvailableApps(),
      demographics: [],
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
    const genderVal = Array.isArray(gender) ? gender : (gender ? [gender] : null);
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

    // Upsert by primary key (entity_id)
    const existing = await Demographic.findOne({ where: { entity_id: entityId } });
    if (existing) {
      await existing.update(record);
    } else {
      await Demographic.create(record);
    }

    return res.redirect('/demographics?saved=1');
  } catch (error) {
    console.error('[Demographics] Save error:', error);
    return res.redirect('/demographics?error=server_error');
  }
});

module.exports = router;


