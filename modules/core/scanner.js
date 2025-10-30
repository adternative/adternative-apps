/**
 * Entity Sentiment Scanner
 * Scans entities and collects sentiment data from various platforms
 */

const { Entity } = require('../../models');
const { Sentiment } = require('./models');
const { PlatformAccount } = require('../flow/models');
const connectors = require('./connectors');
const { analyzeMultiPlatform } = require('./sentiment');
const { sendAlert } = require('./alerts');

/**
 * Scan a single entity and collect sentiment data
 * @param {string} entityId - UUID of the entity to scan
 * @returns {Promise<Object>} Scan result with sentiment data
 */
const scanEntity = async (entityId) => {
  try {
    console.log(`[Scanner] Starting scan for entity: ${entityId}`);
    
    // Fetch entity data
    const entity = await Entity.findByPk(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    
    const activeAccounts = await PlatformAccount.findAll({
      where: {
        entity_id: entityId,
        is_active: true
      }
    });

    if (!activeAccounts.length) {
      throw new Error(`No social platform accounts connected for entity: ${entityId}`);
    }
    
    // Collect posts from each platform
    const platformData = {};
    const availablePlatforms = new Set(connectors.getAvailablePlatforms());
    const groupedAccounts = activeAccounts.reduce((acc, account) => {
      const key = (account.platform || '').toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(account);
      return acc;
    }, {});
    
    for (const [platform, accounts] of Object.entries(groupedAccounts)) {
      if (!availablePlatforms.has(platform)) {
        console.log(`[Scanner] Skipping unsupported platform: ${platform}`);
        continue;
      }

      const collectedPosts = [];

      for (const account of accounts) {
        const identifier = account.account_id || account.account_name;
        if (!identifier) {
          continue;
        }

        try {
          console.log(`[Scanner] Fetching ${platform} data for identifier: ${identifier}`);
          const posts = await connectors.fetchFromPlatform(platform, identifier);
          if (Array.isArray(posts) && posts.length) {
            collectedPosts.push(...posts);
            console.log(`[Scanner] Retrieved ${posts.length} posts from ${platform}`);
          }
        } catch (error) {
          console.error(`[Scanner] Error fetching from ${platform} (${identifier}):`, error.message);
          // Continue with other accounts
        }
      }

      if (collectedPosts.length) {
        platformData[platform] = collectedPosts;
      }
    }
    
    if (Object.keys(platformData).length === 0) {
      throw new Error('No data collected from any platform');
    }
    
    // Analyze sentiment
    const analysis = analyzeMultiPlatform(platformData);
    
    console.log(`[Scanner] Analysis complete for entity: ${entityId}`);
    console.log(`[Scanner] Overall sentiment score: ${analysis.overall.score}, Risk level: ${analysis.overall.riskLevel}`);
    
    // Save sentiment data for each platform
    const savedSentiments = [];
    for (const [platform, data] of Object.entries(analysis.platforms)) {
      const sentiment = await Sentiment.create({
        entityId: entityId,
        platform: platform,
        posts: data.total,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        score: data.score,
        riskLevel: data.riskLevel,
        collectedAt: new Date()
      });
      savedSentiments.push(sentiment);
    }
    
    // Check if risk level increased and send alert
    await checkAndAlert(entity, analysis.overall);
    
    return {
      entityId,
      entityName: entity.name,
      analysis,
      savedSentiments
    };
  } catch (error) {
    console.error(`[Scanner] Error scanning entity ${entityId}:`, error.message);
    throw error;
  }
};

/**
 * Scan all active entities
 * @returns {Promise<Object>} Summary of scan results
 */
const scanAllEntities = async () => {
  try {
    console.log(`[Scanner] Starting batch scan for all active entities`);
    
    const entities = await Entity.findAll({
      where: {
        is_active: true
      }
    });
    
    console.log(`[Scanner] Found ${entities.length} active entities to scan`);
    
    const results = {
      total: entities.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const entity of entities) {
      try {
        await scanEntity(entity.id);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entity.id,
          entityName: entity.name,
          error: error.message
        });
        console.error(`[Scanner] Failed to scan entity ${entity.name}:`, error.message);
      }
    }
    
    console.log(`[Scanner] Batch scan complete. Successful: ${results.successful}, Failed: ${results.failed}`);
    
    return results;
  } catch (error) {
    console.error('[Scanner] Error in batch scan:', error.message);
    throw error;
  }
};

/**
 * Check if risk level increased and send alert if needed
 * @param {Object} entity - Entity model instance
 * @param {Object} currentAnalysis - Current sentiment analysis result
 */
const checkAndAlert = async (entity, currentAnalysis) => {
  try {
    const allSentiments = await Sentiment.findAll({
      where: {
        entityId: entity.id
      },
      order: [['collectedAt', 'DESC']]
    });
    
    if (allSentiments.length === 0) {
      return;
    }
    
    const timestamps = [...new Set(allSentiments.map(s => s.collectedAt.getTime()))];
    
    if (timestamps.length < 2) {
      return;
    }
    
    const previousScanTime = new Date(timestamps[1]);
    const previousSentiments = await Sentiment.findAll({
      where: {
        entityId: entity.id,
        collectedAt: previousScanTime
      }
    });
    
    const previousPlatformCounts = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    previousSentiments.forEach(s => {
      previousPlatformCounts[s.riskLevel]++;
    });
    
    const previousRiskLevel = previousPlatformCounts.high > 0 ? 'high' :
                             previousPlatformCounts.medium > 0 ? 'medium' : 'low';
    
    const currentRiskLevel = currentAnalysis.riskLevel;
    
    if ((previousRiskLevel !== 'high') && (currentRiskLevel === 'high')) {
      console.log(`[Scanner] Risk level increased for entity ${entity.name} from ${previousRiskLevel} to ${currentRiskLevel}`);
      
      await sendAlert({
        entityId: entity.id,
        entityName: entity.name,
        score: currentAnalysis.score,
        riskLevel: currentRiskLevel,
        platforms: Object.keys(currentAnalysis.platforms || {})
      });
    }
  } catch (error) {
    console.error('[Scanner] Error checking risk level:', error.message);
  }
};

module.exports = {
  scanEntity,
  scanAllEntities,
  checkAndAlert
};

