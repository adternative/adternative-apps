const cheerioLikeLoad = (html = '') => {
  // Minimal parser: create DOM using JSDOM-like approach without dependency
  // For simplicity and zero dependency, we rely on DOMParser-like heuristics.
  const container = { html };
  return {
    findOrganicResults: () => {
      const regex = /<a[^>]+href="(https?:\/\/[^"#]+)"[^>]*>(.*?)<\/a>/gi;
      const results = [];
      let match;
      let rank = 1;
      while ((match = regex.exec(html)) && rank <= 10) {
        const snippetRegex = new RegExp(`<div[^>]*class="[^"]*(snippet|description|summary)[^"]*"[^>]*>(.*?)<\/div>`, 'i');
        const snippetMatch = snippetRegex.exec(html.slice(match.index, match.index + 500));
        const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!title) continue;
        results.push({
          rank,
          url: match[1],
          title,
          snippet: snippetMatch ? snippetMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null,
          type: 'organic'
        });
        rank += 1;
      }
      return results;
    },
    detectFeatures: () => {
      const features = {
        peopleAlsoAsk: /People\s+also\s+ask/i.test(html),
        faqs: /FAQ/i.test(html),
        topStories: /Top\s+stories/i.test(html),
        video: /Video/i.test(html)
      };
      return features;
    }
  };
};

const parseSerpHtml = (html) => {
  if (!html) return { featureSummary: {}, results: [] };
  const $ = cheerioLikeLoad(html);
  const results = $.findOrganicResults();
  const featureSummary = $.detectFeatures();
  return { featureSummary, results };
};

module.exports = {
  parseSerpHtml
};


