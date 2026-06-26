const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROMPT = `You are a senior financial journalist writing for FinanceHub India. Write a complete SEO blog article.

TODAY DATE: {DATE}
EDITION: {EDITION}

LATEST FINANCE NEWS:
{NEWS_BLOCK}

RESPOND IN EXACTLY THIS FORMAT:
TITLE: [SEO title with date and main theme]
META_DESCRIPTION: [150-160 characters]
HTML_BODY:
[Full article as HTML using h2 h3 p ul li strong tags. Minimum 1000 words. Include: Introduction, Market Summary, Stock Highlights, RBI Updates, Mutual Fund Insights, Key Sectors, What to Watch Tomorrow, Conclusion, Disclaimer]
FAQ:
Q1: [question]
A1: [answer]
Q2: [question]
A2: [answer]
Q3: [question]
A3: [answer]
SEO_TAGS: Indian Stock Market, Nifty 50, Sensex, RBI Updates, Mutual Funds India, Stock Market News, Personal Finance India, Investment Strategy, Market Outlook, Finance News Today`;

export async function generateBlog(articles, date, edition, config) {
  const newsBlock = articles
    .map((a, i) => '[' + (i+1) + '] ' + a.source + '\n' + a.title + '\n' + (a.description || ''))
    .join('\n\n');

  const prompt = PROMPT
    .replace('{DATE}', date)
    .replace('{EDITION}', edition)
    .replace('{NEWS_BLOCK}', newsBlock);

  const rawText = await callGemini(prompt, config);
  return parseBlogResponse(rawText, date, edition);
}

async function callGemini(prompt, config) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ];

  let lastError = '';

  for (const model of models) {
    try {
      const url = GEMINI_API_BASE + '/' + model + ':generateContent?key=' + config.geminiApiKey;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
        signal: AbortSignal.timeout(60000),
      });

      const data = await res.json();

      if (!res.ok) {
        lastError = 'Model ' + model + ' failed: ' + (data?.error?.message || res.status);
        console.warn('  Trying next model...');
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = 'Model ' + model + ' returned no text';
        continue;
      }

      console.log('  OK Used model: ' + model);
      return text;

    } catch (err) {
      lastError = 'Model ' + model + ' error: ' + err.message;
      continue;
    }
  }

  throw new Error('All Gemini models failed. Last error: ' + lastError);
}

function parseBlogResponse(raw, date, edition) {
  const get = (startKey, endKey) => {
    const start = raw.indexOf(startKey + ':');
    if (start === -1) return '';
    const after = raw.slice(start + startKey.length + 1).trimStart();
    if (!endKey) return after.trim();
    const end = after.search(new RegExp('\n' + endKey + ':'));
    return end === -1 ? after.trim() : after.slice(0, end).trim();
  };

  const seoTitle  = get('TITLE',            'META_DESCRIPTION');
  const metaDesc  = get('META_DESCRIPTION', 'HTML_BODY');
  const htmlBody  = get('HTML_BODY',        'FAQ');
  const faqRaw    = get('FAQ',              'SEO_TAGS');
  const tagsRaw   = get('SEO_TAGS');

  const faqs = [];
  const lines = faqRaw.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^Q\d+:/.test(lines[i]) && /^A\d+:/.test(lines[i+1])) {
      faqs.push({
        q: lines[i].replace(/^Q\d+:\s*/, ''),
        a: lines[i+1].replace(/^A\d+:\s*/, ''),
      });
      i++;
    }
  }

  const seoTags   = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const wordCount = htmlBody.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return {
    seoTitle:    seoTitle    || 'Indian Stock Market Today ' + date,
    metaDesc:    metaDesc    || 'Latest Indian stock market news, Nifty 50 and Sensex updates.',
    htmlContent: htmlBody    || '<p>Content generation failed. Please retry.</p>',
    faqs, seoTags, wordCount,
    seoScore: 80,
    date, edition,
    generatedAt: new Date().toISOString(),
  };
}
