const path = require('path');

const { models } = require('../database');
const {
  resolveWorkspace,
  buildBaseContext,
  mapToPlain
} = require('./shared');
const { summarizeRankPerformance, getRankTimeline } = require('../services/rank');

const RANK_VIEW = path.join(__dirname, '..', 'views', 'ranks.pug');

const { RankSnapshot } = models;

const listRankTracking = async (req, res, next) => {
  try {
    const entity = req.currentEntity || null;
    const { workspace, workspaceError } = entity ? await resolveWorkspace({ entity }) : { workspace: null, workspaceError: null };
    const selectedKeyword = (req.query.keyword || '').trim();

    if (!workspace) {
      return res.render(RANK_VIEW, {
        ...buildBaseContext({ req, res, entity, workspace, workspaceError }),
        title: 'Rank Tracking — Reverb',
        summary: null,
        selectedKeyword,
        latestSnapshots: [],
        timeline: []
      });
    }

    const summary = await summarizeRankPerformance({ workspaceId: workspace.id });

    const latestSnapshots = await RankSnapshot.findAll({
      where: { workspaceId: workspace.id },
      order: [['trackedAt', 'DESC']],
      limit: 200
    });

    const latestByKeyword = [];
    const seenKeywords = new Set();
    latestSnapshots.forEach((snapshot) => {
      if (!seenKeywords.has(snapshot.keyword)) {
        seenKeywords.add(snapshot.keyword);
        latestByKeyword.push(snapshot.get({ plain: true }));
      }
    });

    let timeline = [];

    if (selectedKeyword) {
      const timelineRows = await getRankTimeline({ workspaceId: workspace.id, keyword: selectedKeyword, limit: 24 });
      timeline = mapToPlain(timelineRows);
    }

    res.render(RANK_VIEW, {
      ...buildBaseContext({ req, res, entity, workspace, workspaceError: null }),
      title: 'Rank Tracking — Reverb',
      summary,
      selectedKeyword,
      latestSnapshots: latestByKeyword,
      timeline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRankTracking
};



