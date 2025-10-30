/**
 * Background Job Scheduler
 * Periodically scans entities for sentiment monitoring
 */

const cron = require('node-cron');
const { scanAllEntities } = require('./scanner');

let scanTask = null;

/**
 * Start the background scanning scheduler
 * @param {string} schedule - Cron schedule (default: every hour)
 */
const startScheduler = (schedule = '0 * * * *') => {
  if (scanTask) {
    console.log('[Scheduler] Already running, stopping previous task');
    stopScheduler();
  }
  
  console.log(`[Scheduler] Starting background scan with schedule: ${schedule}`);
  
  scanTask = cron.schedule(schedule, async () => {
    console.log('[Scheduler] Running scheduled scan...');
    
    try {
      const results = await scanAllEntities();
      console.log('[Scheduler] Scan completed:', results);
    } catch (error) {
      console.error('[Scheduler] Error in scheduled scan:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });
  
  console.log('[Scheduler] Background scanning enabled');
};

/**
 * Stop the background scanning scheduler
 */
const stopScheduler = () => {
  if (scanTask) {
    scanTask.stop();
    scanTask = null;
    console.log('[Scheduler] Background scanning disabled');
  }
};

/**
 * Check if scheduler is running
 * @returns {boolean}
 */
const isRunning = () => {
  return scanTask !== null;
};

/**
 * Get current schedule
 * @returns {string|null}
 */
const getSchedule = () => {
  return scanTask ? scanTask.task.running() : null;
};

module.exports = {
  startScheduler,
  stopScheduler,
  isRunning,
  getSchedule
};

