// AI Integrations (Feature 22)
// Stubs for OpenAI and Gemini. If env keys are present, code outlines how to call;
// in this environment, we return deterministic summaries to avoid network calls.

async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    return { text: `AI summary unavailable (missing OPENAI_API_KEY). Prompt: ${prompt.slice(0, 60)}...` };
  }
  // Placeholder: In production, call OpenAI chat completions here.
  return { text: 'OpenAI summary (stub)' };
}

async function callGemini(a, b) {
  if (!process.env.GEMINI_API_KEY) {
    return { similarity: 'N/A (missing GEMINI_API_KEY)', a, b };
  }
  // Placeholder: In production, call Gemini compare endpoint here.
  return { similarity: '0.82 (stub)', a, b };
}

exports.summarizeWithAI = async (crawl) => {
  const pages = Array.isArray(crawl.result) ? crawl.result : [];
  const prompt = `Summarize key SEO findings for ${crawl.startUrl} across ${pages.length} pages.`;
  const res = await callOpenAI(prompt);
  return {
    insights: [
      res.text,
      `Detected ${pages.length} pages.`,
      'Check titles and meta descriptions for consistency.'
    ]
  };
};

exports.compareWithGemini = async ({ a, b }) => {
  return callGemini(a, b);
};


