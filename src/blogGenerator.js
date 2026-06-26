const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROMPT = `You are a senior financial journalist writing for FinanceHub India, an Indian personal finance website. Write a complete SEO-optimised blog article.

TODAY DATE: {DATE}
EDITION: {EDITION}

LATEST FINANCE NEWS:
{NEWS_BLOCK}

RESPOND IN EXACTLY THIS FORMAT:
TITLE: [60-70 char SEO title with date and main theme]
META_DESCRIPTION: [150-160 characters including Indian Stock Market or Nifty 50]
HTML_BODY:
[Full article as HTML using h2 h3 p ul li strong tags. No html/head/body tags. Minimum 1000 words. Include these sections: Introduction, Market Summary, Stock Highlights, RBI Updates, Mutual Fund Insights, Key Sectors, Global Impact, What to Watch Tomorrow, Conclusion, Disclaimer saying market investments are subject to risk]
FAQ:
Q1: [beginner question about todays market]
A1: [2-3 sentence answer]
Q2: [question about RBI or interest rates]
A2: [2-3 sentence answer]
Q3: [question about mutual funds or SIPs]
A3: [2-3 sentence answer]
SEO_TAGS: Indian Stock Market, Nifty 50, Sensex, RBI Updates, Mutual Funds India, Stock Market News, Personal Finance India, Investment Strategy, Market Outlook, Finance News Today, {EXTRA_TAGS}

RULES: Use simple English. Include specific numbers. Every recommendation needs a risk note.`;

export async function generateBlog(articles, date, edition, config) {
  const newsBlock = articles
    .map((a, i) => '[' + (i+1) + '] ' + a.source + '\nHeadline: ' + a.title + '\nDetails: ' + (a.description || 'No details'))
    .join('\n\n');

  const extraTags = [...new Set(articles.map(a => {
    if (a.category === 'rbi')        return 'RBI Policy India';
    if (a.category === 'mutualfund') return 'SIP Investment India';
    if (a.category === 'global')     return 'Global Markets Impact';
    return 'NSE BSE India';
  }))].join(', ');

  const prompt = PROMPT
    .replace('{DATE}',       formatDate(date))
    .replace('{EDITION}',    edition === 'finance-news' ? 'End-of-Day Finance News' : 'Morning Market Update')
    .replace('{NEWS_BLOCK}', newsBlock)
    .replace('{EXTRA_TAGS}', extraTags);

  const rawText = await callGemini(prompt, config);
  return parseBlogResponse(rawText, date, edition);
}

async function callGemini(prompt, config) {
  const url = GEMINI_API_BASE + '/' + config.geminiModel + ':generateContent?key=' + config.geminiApiKey;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096, topP: 0.9 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Gemini API error ' + res.status + ': ' + err);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text. Reason: ' + (data?.candidates?.[0]?.finishReason || 'unknown'));
  return text;
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
  const seoScore  = calcSeoScore(seoTitle, metaDesc, htmlBody, seoTags);

  return {
    seoTitle:    seoTitle    || 'Indian Stock Market Today ' + formatDate(date),
    metaDesc:    metaDesc    || 'Latest Indian stock market news, Nifty 50 and Sensex updates.',
    htmlContent: htmlBody    || '<p>Content generation failed. Please retry.</p>',
    faqs, seoTags, wordCount, seoScore, date, edition,
    generatedAt: new Date().toISOString(),
  };
}

function calcSeoScore(title, meta, body, tags) {
  let s = 55;
  if (title.length >= 40 && title.length <= 70)   s += 8;
  if (meta.length  >= 145 && meta.length  <= 162) s += 8;
  if (body.length  > 4000)                        s += 8;
  if (tags.length  >= 8)                          s += 6;
  if (/nifty|sensex/i.test(title))                s += 5;
  if (/<h2/i.test(body) && /<h3/i.test(body))     s += 5;
  if (/<ul/i.test(body))                          s += 3;
  if (/\d+(\.\d+)?%/.test(body))                  s += 2;
  return Math.min(s, 100);
}

function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00Z')
    .toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}
