const cron = require('node-cron');
const { industryTopicMap, influencers: mockInfluencers } = require('../utils/mockData');
const { fetchInfluencers } = require('../services/influencerAPI');
const { upsertInfluencerWithPlatforms } = require('../database');

let scheduledTask = null;

const syncInfluencersForIndustry = async (industryKey) => {
  const topics = industryTopicMap[industryKey] || [];
  const filters = {
    industryTopics: topics,
    minEngagement: 0.025
  };

  let influencers = await fetchInfluencers(filters);
  if (!Array.isArray(influencers) || influencers.length === 0) {
    influencers = mockInfluencers.filter((influencer) =>
      (influencer.topics || []).some((topic) => topics.includes(topic))
    );
  }

  for (const influencer of influencers) {
    await upsertInfluencerWithPlatforms(influencer);
  }
};

const startScheduledSync = () => {
  if (scheduledTask) return scheduledTask;
  if (process.env.ECHO_ENABLE_SYNC !== 'true') {
    return null;
  }

  const schedule = process.env.ECHO_SYNC_SCHEDULE || '0 */6 * * *';

  scheduledTask = cron.schedule(schedule, async () => {
    try {
      const industries = Object.keys(industryTopicMap);
      for (const industryKey of industries) {
        await syncInfluencersForIndustry(industryKey);
      }
      console.log('[ECHO] Influencer stats sync complete');
    } catch (error) {
      console.error('[ECHO] Influencer sync job failed:', error.message);
    }
  });

  console.log('[ECHO] Scheduled influencer sync job');
  return scheduledTask;
};

module.exports = {
  startScheduledSync
};


