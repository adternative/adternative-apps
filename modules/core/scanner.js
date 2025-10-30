/**
 * Entity Sentiment Scanner
 * Scans entities and collects sentiment data from various platforms
 */

const { Entity } = require('../../models');
const { Sentiment } = require('./models');
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
    
    if (!entity.social_media_platforms || typeof entity.social_media_platforms !== 'object') {
      throw new Error(`No social media platforms configured for entity: ${entityId}`);
    }
    
    // Collect posts from each platform
    const platformData = {};
    const platforms = Object.keys(entity.social_media_platforms);
    
    // Check if there are any platforms configured
    if (platforms.length === 0) {
      throw new Error(`No social media platforms configured for entity: ${entityId}`);
    }
    
    for (const platform of platforms) {
      if (!connectors.getAvailablePlatforms().includes(platform)) {
        console.log(`[Scanner] Skipping unsupported platform: ${platform}`);
        continue;
      }
      
      try {
        const identifier = entity.social_media_platforms[platform];
        console.log(`[Scanner] Fetching ${platform} data for identifier: ${identifier}`);
        
        const posts = await connectors.fetchFromPlatform(platform, identifier);
        platformData[platform] = posts;
        
        console.log(`[Scanner] Retrieved ${posts.length} posts from ${platform}`);
      } catch (error) {
        console.error(`[Scanner] Error fetching from ${platform}:`, error.message);
        // Continue with other platforms
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

