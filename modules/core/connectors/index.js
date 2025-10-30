/**
 * Connectors Index
 * Central hub for all social platform connectors
 */

const twitterConnector = require('./twitter');
const redditConnector = require('./reddit');

// Registry of available connectors
const connectors = new Map();
connectors.set('twitter', twitterConnector);
connectors.set('reddit', redditConnector);

/**
 * Fetch posts from a specific platform
 * @param {string} platform - Platform name (e.g., 'twitter', 'reddit')
 * @param {string} identifier - Handle or search term for the platform
 * @returns {Promise<string[]>} Array of post texts
 */
const fetchFromPlatform = async (platform, identifier) => {
  const connector = connectors.get(platform.toLowerCase());
  
  if (!connector) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  switch (platform.toLowerCase()) {
    case 'twitter':
      return await connector.fetchTwitterPosts(identifier);
    case 'reddit':
      return await connector.fetchRedditPosts(identifier);
    default:
      throw new Error(`No fetch method implemented for platform: ${platform}`);
  }
};

/**
 * Get list of available connector platforms
 * @returns {string[]} Array of platform names
 */
const getAvailablePlatforms = () => {
  return Array.from(connectors.keys());
};

module.exports = {
  fetchFromPlatform,
  getAvailablePlatforms,
  connectors
};

