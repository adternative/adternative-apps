const influencers = [
  {
    id: 1,
    name: 'Alex Dev',
    handle: 'alexdev',
    profileImage: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
    bio: 'Building the future of developer tools. Host of the Byte Builder podcast.',
    contactEmail: 'hi@alexdev.io',
    country: 'United States',
    language: 'en',
    topics: ['technology', 'startups', 'developer tools', 'productivity'],
    authenticityScore: 0.86,
    averageEngagementRate: 0.054,
    followersTotal: 540000,
    estimatedReach: 320000,
    avgCostPerPost: 2800,
    platforms: [
      {
        platform: 'youtube',
        username: 'alexdev',
        followers: 240000,
        engagementRate: 0.062,
        avgViews: 180000,
        audienceDemographics: {
          gender: { male: 62, female: 38 },
          age: { '18-24': 28, '25-34': 47, '35-44': 20, other: 5 },
          location: { UnitedStates: 58, Canada: 14, UnitedKingdom: 12, India: 8, Other: 8 }
        },
        link: 'https://youtube.com/@alexdev',
        verified: true,
        lastUpdated: new Date()
      },
      {
        platform: 'tiktok',
        username: 'alexdev',
        followers: 180000,
        engagementRate: 0.071,
        avgViews: 210000,
        audienceDemographics: {
          gender: { male: 54, female: 46 },
          age: { '18-24': 45, '25-34': 38, other: 17 },
          location: { UnitedStates: 44, UnitedKingdom: 16, Germany: 10, India: 9, Other: 21 }
        },
        link: 'https://www.tiktok.com/@alexdev',
        verified: false,
        lastUpdated: new Date()
      }
    ]
  },
  {
    id: 2,
    name: 'Byte Builder',
    handle: 'bytebuilder',
    profileImage: 'https://images.unsplash.com/photo-1485219299157-758e3f998b7c?auto=format&fit=crop&w=320&q=80',
    bio: 'Creative technologist, exploring AI and design at scale.',
    contactEmail: 'partnerships@bytebuilder.studio',
    country: 'United States',
    language: 'en',
    topics: ['design', 'ai', 'developer tools', 'ux'],
    authenticityScore: 0.9,
    averageEngagementRate: 0.048,
    followersTotal: 430000,
    estimatedReach: 290000,
    avgCostPerPost: 2400,
    platforms: [
      {
        platform: 'instagram',
        username: 'bytebuilder',
        followers: 210000,
        engagementRate: 0.052,
        avgViews: 98000,
        audienceDemographics: {
          gender: { male: 48, female: 52 },
          age: { '18-24': 32, '25-34': 42, '35-44': 18, other: 8 },
          location: { UnitedStates: 41, Canada: 11, Australia: 10, UnitedKingdom: 18, Other: 20 }
        },
        link: 'https://instagram.com/bytebuilder',
        verified: true,
        lastUpdated: new Date()
      },
      {
        platform: 'linkedin',
        username: 'bytebuilder',
        followers: 120000,
        engagementRate: 0.034,
        avgViews: 62000,
        audienceDemographics: {
          gender: { male: 56, female: 44 },
          age: { '25-34': 52, '35-44': 36, other: 12 },
          location: { UnitedStates: 48, UnitedKingdom: 15, Germany: 9, Netherlands: 6, Other: 22 }
        },
        link: 'https://www.linkedin.com/in/bytebuilder/',
        verified: false,
        lastUpdated: new Date()
      }
    ]
  },
  {
    id: 3,
    name: 'UX Cat',
    handle: 'uxcat',
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=80',
    bio: 'Human-centered design, front-end craft, and accessibility advocate.',
    contactEmail: 'collab@uxcat.design',
    country: 'Canada',
    language: 'en',
    topics: ['ux', 'design', 'accessibility', 'no-code'],
    authenticityScore: 0.84,
    averageEngagementRate: 0.058,
    followersTotal: 280000,
    estimatedReach: 185000,
    avgCostPerPost: 1800,
    platforms: [
      {
        platform: 'youtube',
        username: 'uxcat',
        followers: 98000,
        engagementRate: 0.065,
        avgViews: 72000,
        audienceDemographics: {
          gender: { male: 44, female: 56 },
          age: { '18-24': 36, '25-34': 40, '35-44': 18, other: 6 },
          location: { Canada: 42, UnitedStates: 28, UnitedKingdom: 10, Australia: 8, Other: 12 }
        },
        link: 'https://youtube.com/@uxcat',
        verified: true,
        lastUpdated: new Date()
      },
      {
        platform: 'instagram',
        username: 'uxcat.design',
        followers: 122000,
        engagementRate: 0.071,
        avgViews: 83000,
        audienceDemographics: {
          gender: { male: 38, female: 62 },
          age: { '18-24': 48, '25-34': 34, '35-44': 12, other: 6 },
          location: { Canada: 35, UnitedStates: 30, France: 9, Brazil: 7, Other: 19 }
        },
        link: 'https://instagram.com/uxcat.design',
        verified: false,
        lastUpdated: new Date()
      }
    ]
  },
  {
    id: 4,
    name: 'Growth Geeks',
    handle: 'growthgeeks',
    profileImage: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?auto=format&fit=crop&w=320&q=80',
    bio: 'Experimenting with paid social, viral loops, and product-led growth.',
    contactEmail: 'hello@growthgeeks.co',
    country: 'United Kingdom',
    language: 'en',
    topics: ['growth marketing', 'startups', 'analytics'],
    authenticityScore: 0.79,
    averageEngagementRate: 0.044,
    followersTotal: 360000,
    estimatedReach: 240000,
    avgCostPerPost: 2100,
    platforms: [
      {
        platform: 'x',
        username: 'growthgeeks',
        followers: 190000,
        engagementRate: 0.038,
        avgViews: 150000,
        audienceDemographics: {
          gender: { male: 68, female: 32 },
          age: { '18-24': 26, '25-34': 48, '35-44': 20, other: 6 },
          location: { UnitedKingdom: 46, UnitedStates: 24, Germany: 8, Other: 22 }
        },
        link: 'https://x.com/growthgeeks',
        verified: true,
        lastUpdated: new Date()
      },
      {
        platform: 'linkedin',
        username: 'growthgeeks',
        followers: 95000,
        engagementRate: 0.029,
        avgViews: 54000,
        audienceDemographics: {
          gender: { male: 61, female: 39 },
          age: { '25-34': 51, '35-44': 33, other: 16 },
          location: { UnitedKingdom: 49, UnitedStates: 21, Netherlands: 7, Other: 23 }
        },
        link: 'https://www.linkedin.com/company/growthgeeks/',
        verified: false,
        lastUpdated: new Date()
      }
    ]
  },
  {
    id: 5,
    name: 'Data Drift',
    handle: 'datadrift',
    profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
    bio: 'Storytelling with data science, AI, and automation.',
    contactEmail: 'partners@datadrift.ai',
    country: 'Germany',
    language: 'de',
    topics: ['data science', 'ai', 'automation', 'analytics'],
    authenticityScore: 0.88,
    averageEngagementRate: 0.051,
    followersTotal: 310000,
    estimatedReach: 210000,
    avgCostPerPost: 1900,
    platforms: [
      {
        platform: 'youtube',
        username: 'datadrift',
        followers: 145000,
        engagementRate: 0.057,
        avgViews: 99000,
        audienceDemographics: {
          gender: { male: 58, female: 42 },
          age: { '18-24': 22, '25-34': 41, '35-44': 27, other: 10 },
          location: { Germany: 55, Austria: 16, Switzerland: 12, Other: 17 }
        },
        link: 'https://youtube.com/@datadrift',
        verified: true,
        lastUpdated: new Date()
      },
      {
        platform: 'linkedin',
        username: 'datadrift',
        followers: 86000,
        engagementRate: 0.033,
        avgViews: 41000,
        audienceDemographics: {
          gender: { male: 60, female: 40 },
          age: { '25-34': 49, '35-44': 31, other: 20 },
          location: { Germany: 61, Austria: 17, Netherlands: 5, Other: 17 }
        },
        link: 'https://www.linkedin.com/company/datadrift/',
        verified: false,
        lastUpdated: new Date()
      }
    ]
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


