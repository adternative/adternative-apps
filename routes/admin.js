const express = require('express');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Build maps for models by table name and by model name, resilient to missing/broken index.js
const buildModelMaps = () => {
  const modulesDir = path.join(__dirname, '../modules');
  const tableToModel = new Map();
  const nameToModel = new Map();

  if (fs.existsSync(modulesDir)) {
    const moduleNames = fs.readdirSync(modulesDir).filter((name) => {
      const full = path.join(modulesDir, name);
      return fs.statSync(full).isDirectory();
    });

    for (const moduleName of moduleNames) {
      let exportedModels = null;
      // First try the module models/index.js
      try {
        const modelsIndex = path.join(modulesDir, moduleName, 'models', 'index.js');
        if (fs.existsSync(modelsIndex)) {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const mod = require(modelsIndex);
          exportedModels = (mod && mod.models) ? mod.models : mod;
        }
      } catch (_) {
        // ignore and fallback to per-file load below
      }

      // Fallback: load each model file directly if index.js was broken
      if (!exportedModels) {
        try {
          const modelsDir = path.join(modulesDir, moduleName, 'models');
          if (fs.existsSync(modelsDir)) {
            const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
            exportedModels = {};
            for (const file of files) {
              try {
                // eslint-disable-next-line import/no-dynamic-require, global-require
                const factory = require(path.join(modelsDir, file));
                if (typeof factory === 'function') {
                  // Avoid double-defining models if already defined on the shared sequelize instance
                  const tentativeName = (() => {
                    try { return factory.name || null; } catch (_) { return null; }
                  })();
                  let modelInstance = null;
                  try {
                    modelInstance = factory(sequelize);
                  } catch (_) {
                    // if the model already defined, attempt to pull by model name if we can infer it from filename
                    const base = path.basename(file, '.js');
                    const guess = base.charAt(0).toUpperCase() + base.slice(1);
                    if (sequelize.isDefined && sequelize.isDefined(guess)) {
                      modelInstance = sequelize.model(guess);
                    }
                  }
                  if (modelInstance) {
                    exportedModels[modelInstance.name] = modelInstance;
                  }
                }
              } catch (_) {
                // ignore bad individual model files
              }
            }
          }
        } catch (_) {
          // ignore
        }
      }

      if (exportedModels && typeof exportedModels === 'object') {
        for (const key of Object.keys(exportedModels)) {
          const model = exportedModels[key];
          try {
            const tableName = typeof model.getTableName === 'function' ? model.getTableName() : model.tableName;
            if (tableName && !tableToModel.has(tableName)) {
              tableToModel.set(tableName, model);
            }
            const modelName = model && model.name ? String(model.name) : key;
            if (modelName && !nameToModel.has(modelName)) {
              nameToModel.set(modelName, model);
            }
          } catch (_) {
            // ignore
          }
        }
      }
    }
  }

  return { tableToModel, nameToModel };
};

// Read module settings definitions from modules/*/config.json
const readModuleSettingsDefinitions = () => {
  const modulesDir = path.join(__dirname, '../modules');
  const definitions = [];
  const { tableToModel, nameToModel } = buildModelMaps();

  if (!fs.existsSync(modulesDir)) return definitions;

  const moduleNames = fs.readdirSync(modulesDir).filter((name) => {
    const full = path.join(modulesDir, name);
    return fs.statSync(full).isDirectory();
  });

  for (const moduleName of moduleNames) {
    const configPath = path.join(modulesDir, moduleName, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const settings = Array.isArray(json.settings) ? json.settings : [];
      const moduleKey = String(moduleName || '').toLowerCase();
      const moduleDisplayName = typeof json.name === 'string' ? json.name : moduleName;
      const moduleIcon = typeof json.icon === 'string' ? json.icon : null;
      settings.forEach((s) => {
        if (!s || typeof s !== 'object') return;
        const fields = Array.isArray(s.fields) ? s.fields.filter(Boolean) : [];
        if (!fields.length) return;
        // Prefer explicit table if provided; otherwise derive from model name
        let table = s.table;
        if (!table && s.model) {
          const modelName = String(s.model);
          const model = nameToModel.get(modelName) || nameToModel.get(modelName.trim()) || null;
          if (model) {
            try { table = typeof model.getTableName === 'function' ? model.getTableName() : model.tableName; } catch (_) {}
          }
        }
        if (!table) return;
        definitions.push({
          moduleKey,
          moduleName: moduleDisplayName,
          moduleIcon,
          name: s.name || table,
          table,
          model: s.model || null,
          fields
        });
      });
    } catch (_) {
      // ignore bad configs
    }
  }

  return definitions;
};

const router = express.Router();

// All admin API routes require auth and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Return settings definitions from all modules
router.get('/settings', async (req, res) => {
  try {
    const defs = readModuleSettingsDefinitions();
    res.json({ success: true, settings: defs });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to load settings definitions' });
  }
});

// List rows for a given settings table (limited)
router.get('/settings/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { fields } = req.query;
    const { tableToModel } = buildModelMaps();
    const model = tableToModel.get(table);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Unknown settings table' });
    }

    const modelAttrs = model.rawAttributes ? Object.keys(model.rawAttributes) : null;
    let attrs = modelAttrs || undefined;
    if (typeof fields === 'string' && fields.trim()) {
      const requested = fields.split(',').map((f) => f.trim()).filter(Boolean);
      const safe = modelAttrs ? requested.filter((f) => modelAttrs.includes(f)) : requested;
      // Always include id if present
      if (modelAttrs && modelAttrs.includes('id') && !safe.includes('id')) safe.unshift('id');
      attrs = safe.length ? safe : attrs;
    }

    const rows = await model.findAll({ attributes: attrs, limit: 100, order: [['id', 'DESC']] });
    res.json({ success: true, rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings data' });
  }
});

// Update a row in a settings table
router.put('/settings/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const updates = req.body && typeof req.body === 'object' ? req.body : {};
    const { tableToModel } = buildModelMaps();
    const model = tableToModel.get(table);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Unknown settings table' });
    }

    const modelAttrs = model.rawAttributes ? Object.keys(model.rawAttributes) : [];
    const allowed = Object.fromEntries(Object.entries(updates).filter(([key]) => key !== 'id' && modelAttrs.includes(key)));
    if (!Object.keys(allowed).length) {
      return res.status(400).json({ success: false, error: 'No valid fields provided' });
    }

    const instance = await model.findByPk(id);
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Row not found' });
    }

    await instance.update(allowed);
    res.json({ success: true, row: instance });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update settings row' });
  }
});

// Create a new row in a settings table
router.post('/settings/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const { tableToModel } = buildModelMaps();
    const model = tableToModel.get(table);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Unknown settings table' });
    }

    const modelAttrs = model.rawAttributes ? Object.keys(model.rawAttributes) : [];
    // Only allow known attributes except id/createdAt/updatedAt by default
    const disallow = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']);
    const allowed = Object.fromEntries(
      Object.entries(payload).filter(([key]) => modelAttrs.includes(key) && !disallow.has(key))
    );

    if (!Object.keys(allowed).length) {
      return res.status(400).json({ success: false, error: 'No valid fields provided' });
    }

    const created = await model.create(allowed);
    res.json({ success: true, row: created });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create settings row' });
  }
});

module.exports = router;

// FIELD META endpoint (placed after exports in source for readability; Express registers earlier)
// Describe field kinds based on Sequelize attribute types and naming heuristics
router.get('/settings/:table/meta', async (req, res) => {
  try {
    const { table } = req.params;
    const fieldsParam = typeof req.query.fields === 'string' ? req.query.fields : '';
    const requested = fieldsParam ? fieldsParam.split(',').map((f) => f.trim()).filter(Boolean) : null;
    const { tableToModel } = buildModelMaps();
    const model = tableToModel.get(table);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Unknown settings table' });
    }
    const attrs = model.rawAttributes || {};
    const fieldNames = requested && requested.length ? requested : Object.keys(attrs);

    const kindOf = (attrName, attr) => {
      const n = String(attrName).toLowerCase();
      const typeKey = attr && attr.type && (attr.type.key || attr.type.constructor && attr.type.constructor.key);
      const tk = String(typeKey || '').toUpperCase();
      // Name-based image heuristic
      if (/(photo|image|avatar|logo|picture|thumbnail)/i.test(n)) return 'image';
      if (tk === 'BOOLEAN') return 'boolean';
      if (tk === 'INTEGER' || tk === 'BIGINT' || tk === 'FLOAT' || tk === 'DOUBLE' || tk === 'DECIMAL') return 'number';
      if (tk === 'DATE' || tk === 'DATEONLY') return 'date';
      if (tk === 'TEXT') return 'text';
      if (tk === 'JSON') {
        // Try to guess array vs object
        if (Array.isArray(attr.defaultValue) || /s$/.test(n)) return 'array';
        return 'json';
      }
      if (tk === 'ARRAY') return 'array';
      return 'string';
    };

    const inputFor = (kind) => {
      switch (kind) {
        case 'boolean': return 'checkbox';
        case 'number': return 'number';
        case 'date': return 'date';
        case 'text': return 'textarea';
        case 'image': return 'image-url';
        case 'array': return 'tags';
        case 'json': return 'json';
        default: return 'text';
      }
    };

    const fieldMeta = {};
    for (const f of fieldNames) {
      const attr = attrs[f];
      const kind = kindOf(f, attr || {});
      fieldMeta[f] = {
        kind,
        input: inputFor(kind),
        editableInline: !['array', 'image', 'json'].includes(kind)
      };
    }

    res.json({ success: true, table, model: model.name, fieldMeta });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to load field meta' });
  }
});


