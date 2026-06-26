import fs   from 'fs/promises';
import path from 'path';

export async function rebuildHomepage(config) {
  let manifest;
  try {
    const raw = await fs.readFile(config.manifestPath, 'utf8');
    manifest  = JSON.parse(raw);
  } catch {
    throw new Error('manifest.json not found. Run the pipeline first.');
  }
  const articles = manifest.articles || [];
  if (!articles.length) throw new Error('No articles in manifest yet.');
  const html = buildPage(articles[0], articles.slice(1,6), articles.slice(6,20), config);
  await fs.writeFile(config.indexPath, html, 'utf8');
}

function buildPage(hero, cards, archive, config) {
  const cardHtml = cards.map(a =>
    '<article class="card">' +
    '<div class="card-cat">' + edLabel(a.edition) + '</div>' +
    '<h2><a href="' + a.url + '">' + esc(a.title) + '</a></h2>' +
    '<p class="card-desc">' + esc(a.metaDesc) + '</p>' +
    '<div class="card-foot"><span>' + fmtDate(a.date) + '</span><a href="' + a.url + '" class="read-more">Read</a></div>' +
    '</article>'
  ).join('');

  const archiveHtml = archive.length ?
    '<section class="archive"><h2>Earlier Articles</h2><ul>' +
    archive.map(a => '<li><a href="' + a.url + '">' + esc(a.title) + '</a><span class="arch-date">' + fmtDate(a.date) + '</span></li>').join('') +
    '</ul></section>' : '';

  const heroTagsHtml = (hero.seoTags||[]).slice(0,4)
    .map(t => '<span class="hero-tag">' + esc(t) + '</span>').join('');

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>' + esc(config.siteName) + ' - ' + esc(config.siteTagline) + '</title>\n' +
    '<meta name="description" content="' + esc(hero.metaDesc) + '">\n' +
    '<style>\n' +
    '*{box-sizing:border-box;margin:0;padding:0}\n' +
    'body{font-family:-apple-system,sans-serif;color:#1a1a1a;background:#f4f6f9}\n' +
    'nav{background:#1a3a5c;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:54px}\n' +
    '.nav-logo{color:#fff;font-weight:700;font-size:20px;text-decoration:none}\n' +
    '.nav-links a{color:rgba(255,255,255,.75);font-size:13px;text-decoration:none;margin-left:20px}\n' +
    '.page{max-width:1080px;margin:0 auto;padding:28px 20px 60px}\n' +
    '.hero{background:#fff;border-radius:12px;padding:32px 36px;margin-bottom:24px;border:1px solid #dce4ef}\n' +
    '.hero h1{font-size:30px;font-weight:700;line-height:1.3;color:#1a3a5c;margin-bottom:12px}\n' +
    '.hero h1 a{color:inherit;text-decoration:none}\n' +
    '.hero-desc{font-size:15px;color:#555;line-height:1.65;margin-bottom:16px}\n' +
    '.hero-tag{background:#e8f0f8;color:#185fa5;font-size:12px;padding:3px 10px;border-radius:20px;margin-right:6px}\n' +
    '.read-btn{display:inline-block;background:#1a3a5c;color:#fff;padding:9px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-top:20px}\n' +
    '.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:28px}\n' +
    '.card{background:#fff;border-radius:10px;padding:20px;border:1px solid #dce4ef}\n' +
    '.card-cat{font-size:10px;text-transform:uppercase;color:#185fa5;font-weight:700;margin-bottom:6px}\n' +
    '.card h2{font-size:15px;font-weight:600;line-height:1.4;margin-bottom:8px}\n' +
    '.card h2 a{color:#1a3a5c;text-decoration:none}\n' +
    '.card-desc{font-size:13px;color:#555;line-height:1.55;margin-bottom:12px}\n' +
    '.card-foot{display:flex;justify-content:space-between;font-size:12px;color:#888}\n' +
    '.read-more{color:#185fa5;text-decoration:none;font-weight:600}\n' +
    '.archive{background:#fff;border-radius:10px;padding:20px 24px;border:1px solid #dce4ef}\n' +
    '.archive ul{list-style:none}\n' +
    '.archive li{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eef1f5;font-size:14px}\n' +
    '.archive li a{color:#1a3a5c;text-decoration:none}\n' +
    '.arch-date{font-size:12px;color:#999}\n' +
    'footer{background:#1a3a5c;color:#9ab3cb;text-align:center;padding:28px;font-size:13px;margin-top:60px}\n' +
    '</style>\n</head>\n<body>\n' +
    '<nav><a href="' + config.siteUrl + '" class="nav-logo">' + config.siteName + '</a>' +
    '<div class="nav-links"><a href="' + config.siteUrl + '/blog">Markets</a><a href="' + config.siteUrl + '/blog">Mutual Funds</a><a href="' + config.siteUrl + '/blog">Personal Finance</a></div></nav>\n' +
    '<main class="page">\n' +
    '<div class="hero">\n' +
    '<div style="font-size:11px;text-transform:uppercase;color:#e53935;font-weight:700;margin-bottom:10px">Latest - ' + edLabel(hero.edition) + ' - ' + fmtDate(hero.date) + '</div>\n' +
    '<h1><a href="' + hero.url + '">' + esc(hero.title) + '</a></h1>\n' +
    '<p class="hero-desc">' + esc(hero.metaDesc) + '</p>\n' +
    '<div style="margin-bottom:16px">' + heroTagsHtml + '</div>\n' +
    '<a href="' + hero.url + '" class="read-btn">Read Full Article</a>\n' +
    '</div>\n' +
    (cards.length ? '<p style="font-size:14px;font-weight:700;color:#1a3a5c;margin-bottom:14px;text-transform:uppercase">Recent Articles</p><div class="card-grid">' + cardHtml + '</div>' : '') +
    archiveHtml + '\n' +
    '</main>\n' +
    '<footer><p>2026 ' + config.siteName + ' | Auto-rebuilt by Gemini AI and GitHub Actions (Free)</p></footer>\n' +
    '</body>\n</html>';
}

const esc     = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate = d => new Date(d+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
const edLabel = e => e==='finance-news' ? 'Finance News' : 'Market Update';
