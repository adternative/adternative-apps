const sequelize = require('../../../config/database');

const ReverbSite = require('./Site')(sequelize);
const ReverbSiteAudit = require('./SiteAudit')(sequelize);
const ReverbPageInsight = require('./PageInsight')(sequelize);
const ReverbKeyword = require('./Keyword')(sequelize);
const ReverbKeywordSnapshot = require('./KeywordSnapshot')(sequelize);
const ReverbSerpSnapshot = require('./SerpSnapshot')(sequelize);
const ReverbSerpResult = require('./SerpResult')(sequelize);
const ReverbBacklink = require('./Backlink')(sequelize);
const ReverbBacklinkSnapshot = require('./BacklinkSnapshot')(sequelize);
const ReverbCompetitor = require('./Competitor')(sequelize);
const ReverbCompetitorGap = require('./CompetitorGap')(sequelize);
const ReverbRankRecord = require('./RankRecord')(sequelize);
const ReverbInsightEvent = require('./InsightEvent')(sequelize);
const ReverbAiInsight = require('./AiInsight')(sequelize);

const SiteAudit = ReverbSiteAudit;
const PageInsight = ReverbPageInsight;
const Keyword = ReverbKeyword;
const KeywordSnapshot = ReverbKeywordSnapshot;
const SerpSnapshot = ReverbSerpSnapshot;
const SerpResult = ReverbSerpResult;
const Backlink = ReverbBacklink;
const BacklinkSnapshot = ReverbBacklinkSnapshot;
const Competitor = ReverbCompetitor;
const CompetitorGap = ReverbCompetitorGap;
const RankRecord = ReverbRankRecord;
const InsightEvent = ReverbInsightEvent;
const AiInsight = ReverbAiInsight;

let associationsApplied = false;

const applyAssociations = () => {
  if (associationsApplied) return;

  ReverbSite.hasMany(SiteAudit, { foreignKey: 'site_id', as: 'audits' });
  SiteAudit.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  SiteAudit.hasMany(PageInsight, { foreignKey: 'audit_id', as: 'pages' });
  PageInsight.belongsTo(SiteAudit, { foreignKey: 'audit_id', as: 'audit' });

  ReverbSite.hasMany(Keyword, { foreignKey: 'site_id', as: 'keywords' });
  Keyword.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  Keyword.hasMany(KeywordSnapshot, { foreignKey: 'keyword_id', as: 'snapshots' });
  KeywordSnapshot.belongsTo(Keyword, { foreignKey: 'keyword_id', as: 'keyword' });

  Keyword.hasMany(SerpSnapshot, { foreignKey: 'keyword_id', as: 'serpSnapshots' });
  SerpSnapshot.belongsTo(Keyword, { foreignKey: 'keyword_id', as: 'keyword' });

  SerpSnapshot.hasMany(SerpResult, { foreignKey: 'serp_snapshot_id', as: 'results' });
  SerpResult.belongsTo(SerpSnapshot, { foreignKey: 'serp_snapshot_id', as: 'snapshot' });

  ReverbSite.hasMany(Backlink, { foreignKey: 'site_id', as: 'backlinks' });
  Backlink.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  Backlink.hasMany(BacklinkSnapshot, { foreignKey: 'backlink_id', as: 'snapshots' });
  BacklinkSnapshot.belongsTo(Backlink, { foreignKey: 'backlink_id', as: 'backlink' });

  ReverbSite.hasMany(Competitor, { foreignKey: 'site_id', as: 'competitors' });
  Competitor.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  Competitor.hasMany(CompetitorGap, { foreignKey: 'competitor_id', as: 'gaps' });
  CompetitorGap.belongsTo(Competitor, { foreignKey: 'competitor_id', as: 'competitor' });

  Keyword.hasMany(RankRecord, { foreignKey: 'keyword_id', as: 'rankHistory' });
  RankRecord.belongsTo(Keyword, { foreignKey: 'keyword_id', as: 'keyword' });

  ReverbSite.hasMany(InsightEvent, { foreignKey: 'site_id', as: 'events' });
  InsightEvent.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  ReverbSite.hasMany(AiInsight, { foreignKey: 'site_id', as: 'aiInsights' });
  AiInsight.belongsTo(ReverbSite, { foreignKey: 'site_id', as: 'site' });

  associationsApplied = true;
};

applyAssociations();

const models = {
  ReverbSite,
  SiteAudit,
  PageInsight,
  Keyword,
  KeywordSnapshot,
  SerpSnapshot,
  SerpResult,
  Backlink,
  BacklinkSnapshot,
  Competitor,
  CompetitorGap,
  RankRecord,
  InsightEvent,
  AiInsight
};

module.exports = {
  sequelize,
  ReverbSite,
  ReverbSiteAudit,
  ReverbPageInsight,
  ReverbKeyword,
  ReverbKeywordSnapshot,
  ReverbSerpSnapshot,
  ReverbSerpResult,
  ReverbBacklink,
  ReverbBacklinkSnapshot,
  ReverbCompetitor,
  ReverbCompetitorGap,
  ReverbRankRecord,
  ReverbInsightEvent,
  ReverbAiInsight,
  SiteAudit,
  PageInsight,
  Keyword,
  KeywordSnapshot,
  SerpSnapshot,
  SerpResult,
  Backlink,
  BacklinkSnapshot,
  Competitor,
  CompetitorGap,
  RankRecord,
  InsightEvent,
  AiInsight,
  models,
  applyAssociations
};
