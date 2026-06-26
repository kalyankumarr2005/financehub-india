import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadConfig() {
  await loadDotEnv(path.join(__dirname, '../.env'));

  const missing = ['GEMINI_API_KEY'].filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error('Missing: ' + missing.join(', '));
  }

  const root = process.env.SITE_ROOT || path.join(__dirname, '../');

  return {
    geminiApiKey:  process.env.GEMINI_API_KEY,
    geminiModel:   'gemini-2.5-flash',
    newsApiKey:    process.env.NEWS_API_KEY || null,

    rssFeeds: [
      { name: 'Economic Times Markets',    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
      { name: 'Moneycontrol Markets',      url: 'https://www.moneycontrol.com/rss/marketreports.xml' },
      { name: 'Moneycontrol Economy',      url: 'https://www.moneycontrol.com/rss/economy.xml' },
      { name: 'Livemint Markets',          url: 'https://www.livemint.com/rss/markets' },
      { name: 'Business Standard',         url: 'https://www.business-standard.com/rss/markets-106.rss' },
      { name: 'NDTV Profit',               url: 'https://feeds.feedburner.com/ndtvprofit-latest' },
      { name: 'Financial Express Markets', url: 'https://www.financialexpress.com/market/feed/' },
    ],

    blogOutputDir:  process.env.BLOG_OUTPUT_DIR || path.join(root, 'blog'),
    siteRoot:       root,
    manifestPath:   path.join(root, 'blog', 'manifest.json'),
    indexPath:      path.join(root, 'index.html'),

    siteUrl:     process.env.SITE_URL || 'https://kalyankumarr2005.github.io/financehub-india',
    siteName:    'FinanceHub India',
    siteTagline: 'Indias Trusted Finance News and Investment Guide',

    minRelevanceScore: 3,
    maxArticlesInput:  8,

    requiredKeywords: [
      'Indian Stock Market', 'Nifty 50', 'Sensex', 'RBI Updates',
      'Mutual Funds India', 'Stock Market News', 'Personal Finance India',
      'Investment Strategy', 'Market Outlook', 'Finance News Today',
    ],
  };
}

async function loadDotEnv(envPath) {
  try {
    const text = await fs.readFile(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch { }
}
