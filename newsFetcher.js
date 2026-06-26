/**
 * newsFetcher.js — Fetch finance news from FREE RSS feeds
 *
 * No API key required for RSS feeds.
 * Parses RSS/Atom XML natively — no npm packages needed.
 *
 * Optional: if NEWS_API_KEY is set, also fetches from NewsAPI free tier.
 */

const NEWSAPI_BASE = 'https://newsapi.org/v2/everything';

export async function fetchNewsArticles(config) {
  const articles = [];

  // ── 1. Fetch all RSS feeds in parallel ─────────────────────────────────────
  const rssResults = await Promise.allSettled(
    config.rssFeeds.map(feed => fetchRSS(feed))
  );

  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // ── 2. Optional: NewsAPI free tier (100 req/day) ────────────────────────────
  if (config.newsApiKey) {
    try {
      const newsApiArticles = await fetchNewsAPI(config);
      articles.push(...newsApiArticles);
    } catch (e) {
      console.warn(`  ⚠ NewsAPI skipped: ${e.message}`);
    }
  }

  // ── 3. Deduplicate by title ──────────────────────────────────────────────────
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title.slice(0, 60).toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── RSS Parser (no dependencies — pure regex + string parsing) ──────────────

async function fetchRSS(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'FinanceHubIndia/1.0 RSS Reader' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRSS(xml, feed.name);
  } catch (err) {
    console.warn(`  ⚠ RSS ${feed.name}: ${err.message}`);
    return [];
  }
}

function parseRSS(xml, sourceName) {
  const articles = [];

  // Extract all <item> or <entry> blocks
  const itemPattern = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];

    const title       = extractTag(block, 'title');
    const description = extractTag(block, 'description') ||
                        extractTag(block, 'summary') ||
                        extractTag(block, 'content');
    const link        = extractTag(block, 'link') || extractAttr(block, 'link', 'href');
    const pubDate     = extractTag(block, 'pubDate') ||
                        extractTag(block, 'published') ||
                        extractTag(block, 'updated');

    if (!title || title.length < 10) continue;

    articles.push({
      title:       cleanText(title),
      description: cleanText(description || ''),
      content:     cleanText(description || ''),
      url:         link || '',
      source:      sourceName,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category:    detectCategory(title + ' ' + (description || '')),
    });
  }

  return articles;
}

function extractTag(xml, tag) {
  // Match <tag>content</tag> or <tag><![CDATA[content]]></tag>
  const pattern = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
  const pattern = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = xml.match(pattern);
  return match ? match[1] : '';
}

function cleanText(str) {
  return str
    .replace(/<[^>]+>/g, ' ')          // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (/rbi|repo rate|monetary policy|inflation|gdp|rupee|mpc/.test(t))    return 'rbi';
  if (/mutual fund|sip|amfi|aum|flexi.?cap|small.?cap|nav/.test(t))       return 'mutualfund';
  if (/crude|oil|global|fed|dollar|geopolit|iran|china|us market/.test(t)) return 'global';
  return 'market';
}

// ── NewsAPI (optional, free tier) ───────────────────────────────────────────

async function fetchNewsAPI(config) {
  const since  = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    q:        'Sensex Nifty India stock market RBI mutual fund',
    language: 'en',
    sortBy:   'publishedAt',
    from:     since,
    pageSize: '10',
    apiKey:   config.newsApiKey,
  });

  const res  = await fetch(`${NEWSAPI_BASE}?${params}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message);

  return (data.articles || []).map(a => ({
    title:       a.title || '',
    description: a.description || '',
    content:     a.content || '',
    url:         a.url || '',
    source:      a.source?.name || 'NewsAPI',
    publishedAt: a.publishedAt || new Date().toISOString(),
    category:    detectCategory((a.title || '') + ' ' + (a.description || '')),
  }));
}
