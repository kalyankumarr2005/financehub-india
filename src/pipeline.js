import { loadConfig } from './config.js';
import { fetchNewsArticles } from './newsFetcher.js';
import { filterArticles } from './newsFilter.js';
import { generateBlog } from './blogGenerator.js';
import { saveBlogHTML } from './fileSaver.js';
import { rebuildHomepage } from './homepageBuilder.js';
import { log, logSuccess, logError, logStep } from './logger.js';

const flags = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k,v] = a.slice(2).split('='); return [k, v ?? true]; })
);

async function run() {
  const config  = await loadConfig();
  const today   = flags.date || new Date().toISOString().slice(0, 10);
  const edition = flags.type || 'market-update';

  console.log('\n==============================');
  console.log('  FinanceHub India — Free Blog Pipeline');
  console.log('  Date: ' + today + '  Edition: ' + edition);
  console.log('  AI: Gemini 1.5 Flash (FREE)');
  console.log('  News: RSS feeds (FREE)');
  console.log('==============================\n');

  logStep(1, 'Fetching news from RSS feeds');
  const raw = await fetchNewsArticles(config);
  log('Fetched ' + raw.length + ' articles from ' + config.rssFeeds.length + ' free RSS sources');

  logStep(2, 'Filtering and scoring articles');
  const selected = await filterArticles(raw, config);
  log('Selected ' + selected.length + ' relevant articles');
  selected.forEach(a => log('  [' + a.score + '/10] ' + a.title.slice(0,70)));

  logStep(3, 'Generating SEO blog with Gemini AI (free)');
  const blog = await generateBlog(selected, today, edition, config);
  log('"' + blog.seoTitle + '"');
  log('Words: ' + blog.wordCount + '  SEO score: ' + blog.seoScore + '/100');

  logStep(4, 'Saving HTML files');
  const paths = await saveBlogHTML(blog, today, edition, config);
  paths.forEach(p => logSuccess('Saved: ' + p));

  logStep(5, 'Rebuilding homepage');
  await rebuildHomepage(config);
  logSuccess('index.html updated');

  console.log('\n==============================');
  console.log('  Done  Total cost: Rs.0');
  console.log('  Files: ' + paths.join(', '));
  console.log('==============================\n');
}

run().catch(err => { logError(err.message); process.exit(1); });
