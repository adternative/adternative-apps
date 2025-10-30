/**
 * Reddit Connector
 * Returns mocked Reddit posts/comments for sentiment analysis
 * In production, this would use Reddit's API
 */

const mockRedditPosts = [
  "Anyone tried [Brand] recently? Thinking about switching.",
  "Just read a review and it looks promising!",
  "Has anyone had issues with [Brand]? Keep seeing mixed reviews.",
  "r/[category] recommends staying away from [Brand] products.",
  "Update: Been using [Brand] for 6 months now, still going strong!",
  "Wasted my money on [Brand]. Don't do it!",
  "Actually impressed with [Brand]. Better than expected.",
  "YMMV but I've had great experiences with [Brand].",
  "My friend swears by [Brand], might give it a try.",
  "Read some concerning things about [Brand] in the news.",
  "Their customer service is a joke. Filed a complaint.",
  "Solid product, would buy again.",
  "Not worth the price. Looking for alternatives.",
  "ELI5: What makes [Brand] so popular?",
  "Just discovered [Brand] and I'm loving it!"
];

/**
 * Fetch posts from Reddit for a given brand
 * @param {string} brandName - Brand name to search for
 * @returns {Promise<string[]>} Array of post/comment texts
 */
const fetchRedditPosts = async (brandName) => {
  console.log(`[Reddit Connector] Searching for posts about "${brandName}"`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Return random sample of posts
  const sampleSize = Math.floor(Math.random() * 8) + 4; // 4-12 posts
  const shuffled = [...mockRedditPosts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize).map(post => 
    post.replace('[Brand]', brandName)
  );
};

module.exports = {
  fetchRedditPosts,
  name: 'reddit'
};

