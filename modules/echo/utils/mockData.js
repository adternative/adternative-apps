const { v4: uuidv4 } = require('uuid');

const influencers = [
  {
    id: uuidv4(),
    name: 'Alex Dev',
    photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
    bio: 'Building the future of developer tools. Host of the Byte Builder podcast.',
    socials: [
      { platform: 'youtube', handle: 'alexdev' },
      { platform: 'tiktok', handle: 'alexdev' }
    ],
    contactEmail: 'alex@devtools.fm',
    demographics: { location: { country: 'United States' }, language: 'en' },
    authenticityScore: 0.92,
    averageEngagementRate: 0.061,
    avgCostPerPost: 2500
  },
  {
    id: uuidv4(),
    name: 'Byte Builder',
    photo: 'https://images.unsplash.com/photo-1485219299157-758e3f998b7c?auto=format&fit=crop&w=320&q=80',
    bio: 'Creative technologist, exploring AI and design at scale.',
    socials: [
      { platform: 'instagram', handle: 'bytebuilder' },
      { platform: 'linkedin', handle: 'bytebuilder' }
    ],
    contactEmail: 'partnerships@bytebuilder.studio',
    demographics: { location: { country: 'United States' }, language: 'en' },
    authenticityScore: 0.9,
    averageEngagementRate: 0.048,
    avgCostPerPost: 2400
  },
  {
    id: uuidv4(),
    name: 'UX Cat',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=80',
    bio: 'Human-centered design, front-end craft, and accessibility advocate.',
    socials: [
      { platform: 'youtube', handle: 'uxcat' },
      { platform: 'instagram', handle: 'uxcat.design' }
    ],
    contactEmail: 'collab@uxcat.design',
    demographics: { location: { country: 'Canada' }, language: 'en' },
    authenticityScore: 0.84,
    averageEngagementRate: 0.058,
    avgCostPerPost: 1800
  },
  {
    id: uuidv4(),
    name: 'Growth Geeks',
    photo: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?auto=format&fit=crop&w=320&q=80',
    bio: 'Experimenting with paid social, viral loops, and product-led growth.',
    socials: [
      { platform: 'twitter', handle: 'growthgeeks' },
      { platform: 'linkedin', handle: 'growthgeeks' }
    ],
    contactEmail: 'hello@growthgeeks.co',
    demographics: { location: { country: 'United Kingdom' }, language: 'en' },
    authenticityScore: 0.79,
    averageEngagementRate: 0.044,
    avgCostPerPost: 2100
  },
  {
    id: uuidv4(),
    name: 'Data Drift',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
    bio: 'Storytelling with data science, AI, and automation.',
    socials: [
      { platform: 'youtube', handle: 'datadrift' },
      { platform: 'linkedin', handle: 'datadrift' }
    ],
    contactEmail: 'partners@datadrift.ai',
    demographics: { location: { country: 'Germany' }, language: 'de' },
    authenticityScore: 0.88,
    averageEngagementRate: 0.051,
    avgCostPerPost: 1900
  }
];

const industryTopicMap = {
  technology: ['technology', 'startups', 'developer tools', 'ai'],
  ecommerce: ['ecommerce', 'retail', 'd2c', 'growth marketing'],
  finance: ['fintech', 'investing', 'crypto', 'personal finance'],
  healthcare: ['wellness', 'healthtech', 'mental health', 'fitness'],
  education: ['learning', 'productivity', 'career growth', 'edtech'],
  gaming: ['gaming', 'esports', 'streaming', 'metaverse'],
  sustainability: ['climate', 'sustainability', 'green tech']
};

module.exports = {
  influencers,
  industryTopicMap
};
