const sequelize = require('../../../config/database');

const Workspace = require('./Workspace')(sequelize);
const KeywordInsight = require('./KeywordInsight')(sequelize);
const PageAudit = require('./PageAudit')(sequelize);
const TechnicalIssue = require('./TechnicalIssue')(sequelize);
const Backlink = require('./Backlink')(sequelize);
const RankSnapshot = require('./RankSnapshot')(sequelize);

let associationsApplied = false;

const applyAssociations = () => {
  if (associationsApplied) return;

  Workspace.hasMany(KeywordInsight, {
    foreignKey: 'workspace_id',
    as: 'keywords',
    onDelete: 'CASCADE'
  });
  KeywordInsight.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });

  Workspace.hasMany(PageAudit, {
    foreignKey: 'workspace_id',
    as: 'pageAudits',
    onDelete: 'CASCADE'
  });
  PageAudit.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });

  Workspace.hasMany(TechnicalIssue, {
    foreignKey: 'workspace_id',
    as: 'technicalIssues',
    onDelete: 'CASCADE'
  });
  TechnicalIssue.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });

  Workspace.hasMany(Backlink, {
    foreignKey: 'workspace_id',
    as: 'backlinks',
    onDelete: 'CASCADE'
  });
  Backlink.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });

  Workspace.hasMany(RankSnapshot, {
    foreignKey: 'workspace_id',
    as: 'rankSnapshots',
    onDelete: 'CASCADE'
  });
  RankSnapshot.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });

  associationsApplied = true;
};

applyAssociations();

const models = {
  Workspace,
  KeywordInsight,
  PageAudit,
  TechnicalIssue,
  Backlink,
  RankSnapshot
};

module.exports = {
  sequelize,
  ...models,
  models,
  applyAssociations
};



