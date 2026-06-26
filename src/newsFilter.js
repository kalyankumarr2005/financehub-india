const HIGH_PRIORITY = [
  'sensex','nifty','rbi','repo rate','sip','mutual fund','amfi',
  'stock market','bse','nse','fii','dii','gdp india','inflation india',
];
const SECONDARY = [
  'banking','auto sector','it sector','fmcg','crude oil','rupee',
  'interest rate','personal finance','investment','ipo','smallcap',
];
const TRUSTED_SOURCES = [
  'economic times','moneycontrol','livemint','ndtv profit','business standard',
  'bloomberg quint','financial express','reuters','trading economics',
];
const STAT_PATTERN = /\d[\d,.]*\s*(%|cr|crore|lakh|billion|trillion|bps)/i;

export async function filterArticles(articles, config) {
  const scored = articles
    .filter(a => a.title && a.title.length > 10)
    .map(a => ({ ...a, score: scoreArticle(a) }))
    .filter(a => a.score >= config.minRelevanceScore)
    .sort((a, b) => b.score - a.score);

  const limits = { market:3, rbi:2, mutualfund:2, global:1 };
  const counts = { market:0, rbi:0, mutualfund:0, global:0 };
  const out    = [];

  for (const article of scored) {
    const cat = article.category || 'market';
    if ((counts[cat] ?? 0) < (limits[cat] ?? 1)) {
      out.push(article);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    if (out.length >= config.maxArticlesInput) break;
  }
  return out;
}

function scoreArticle(a) {
  let score = 0;
  const tl = a.title.toLowerCase();
  const dl = (a.description || '').toLowerCase();
  if (HIGH_PRIORITY.some(k => tl.includes(k)))  score += 3;
  if (SECONDARY.some(k => dl.includes(k)))       score += 2;
  const ageH = (Date.now() - new Date(a.publishedAt)) / 3600000;
  if (ageH < 6)       score += 2;
  else if (ageH < 12) score += 1;
  if (TRUSTED_SOURCES.some(s => a.source.toLowerCase().includes(s))) score += 1;
  if (a.content && a.content.length > 200)       score += 1;
  if (STAT_PATTERN.test(tl + ' ' + dl))          score += 1;
  return Math.min(score, 10);
}
