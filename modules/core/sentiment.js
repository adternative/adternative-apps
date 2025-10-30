/**
 * Sentiment Analysis Module
 * Analyzes text sentiment and computes risk levels
 */

/**
 * Simple sentiment analysis using keyword matching
 * In production, this would use a ML model or API like Google Cloud NL API
 * 
 * @param {string[]} texts - Array of text strings to analyze
 * @returns {Object} Sentiment analysis result
 */
const analyzeSentiment = (texts) => {
  // Positive keywords
  const positiveWords = [
    'love', 'amazing', 'great', 'excellent', 'fantastic', 'wonderful',
    'awesome', 'perfect', 'superb', 'brilliant', 'outstanding', 'impressed',
    'satisfied', 'happy', 'delighted', 'exceeded', 'recommended', 'best',
    'wow', 'incredible', 'phenomenal', 'stunning', 'impressed'
  ];
  
  // Negative keywords
  const negativeWords = [
    'hate', 'terrible', 'awful', 'worst', 'poor', 'bad', 'disappointed',
    'horrible', 'frustrated', 'angry', 'wasted', 'joke', 'buggy', 'slow',
    'damaged', 'broken', 'fake', 'scam', 'avoid', 'refund', 'complaint',
    'unsatisfied', 'fails', 'defective', 'useless', 'waste', 'regret'
  ];
  
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  
  texts.forEach(text => {
    const lowerText = text.toLowerCase();
    let sentiment = 0;
    
    // Count positive words
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    // Count negative words
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      positive++;
      sentiment = 1;
    } else if (negativeCount > positiveCount) {
      negative++;
      sentiment = -1;
    } else {
      neutral++;
      sentiment = 0;
    }
  });
  
  // Calculate sentiment score (-1 to +1)
  const total = texts.length;
  const positiveRatio = positive / total;
  const negativeRatio = negative / total;
  const score = Number((positiveRatio - negativeRatio).toFixed(2));
  
  // Determine risk level
  const riskLevel = calculateRiskLevel(score);
  
  return {
    positive,
    neutral,
    negative,
    score,
    riskLevel,
    total
  };
};

/**
 * Calculate risk level based on sentiment score
 * @param {number} score - Sentiment score from -1 to +1
 * @returns {string} Risk level: 'low', 'medium', or 'high'
 */
const calculateRiskLevel = (score) => {
  if (score < -0.4) {
    return 'high';
  } else if (score >= -0.4 && score < 0.2) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Analyze sentiment for multiple platforms and aggregate results
 * @param {Object} platformData - Object with platform names as keys and texts as values
 * @returns {Object} Aggregated sentiment analysis
 */
const analyzeMultiPlatform = (platformData) => {
  const results = {};
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  let totalPosts = 0;
  
  // Analyze each platform
  for (const [platform, texts] of Object.entries(platformData)) {
    if (!Array.isArray(texts) || texts.length === 0) continue;
    
    const analysis = analyzeSentiment(texts);
    results[platform] = analysis;
    
    totalPositive += analysis.positive;
    totalNegative += analysis.negative;
    totalNeutral += analysis.neutral;
    totalPosts += analysis.total;
  }
  
  // Calculate overall aggregated score
  if (totalPosts > 0) {
    const overallScore = Number(((totalPositive / totalPosts) - (totalNegative / totalPosts)).toFixed(2));
    const overallRiskLevel = calculateRiskLevel(overallScore);
    
    return {
      platforms: results,
      overall: {
        positive: totalPositive,
        neutral: totalNeutral,
        negative: totalNegative,
        score: overallScore,
        riskLevel: overallRiskLevel,
        total: totalPosts
      }
    };
  }
  
  return {
    platforms: results,
    overall: null
  };
};

module.exports = {
  analyzeSentiment,
  calculateRiskLevel,
  analyzeMultiPlatform
};

