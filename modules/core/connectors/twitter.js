/**
 * Twitter Connector
 * Returns mocked Twitter/X posts for sentiment analysis
 * In production, this would connect to the Twitter API v2
 */

const mockTwitterPosts = [
  "Love this new product! Just got mine and it's amazing 😍",
  "Great customer service experience today. Highly recommended!",
  "Finally, something that actually works as advertised.",
  "Not impressed with the latest update. Seems buggy and slow.",
  "Worst purchase I've made this year. Poor quality material.",
  "Received damaged goods. Customer support unresponsive.",
  "After 3 months, still waiting for a refund. Very disappointed.",
  "The hype was real. This product exceeded my expectations!",
  "Decent product, nothing special. Does what it says.",
  "Average at best. Expected more for the price point."
];

/**
 * Fetch posts from Twitter/X for a given handle
 * @param {string} handle - Twitter handle (e.g., "@brandname")
 * @returns {Promise<string[]>} Array of post texts
 */
const fetchTwitterPosts = async (handle) => {
  // Mock implementation - returns randomized sample posts
  console.log(`[Twitter Connector] Fetching posts for ${handle}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return random sample of posts
  const sampleSize = Math.floor(Math.random() * 7) + 3; // 3-10 posts
  const shuffled = [...mockTwitterPosts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize);
};

module.exports = {
  fetchTwitterPosts,
  name: 'twitter'
};

