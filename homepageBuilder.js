/**
 * homepageBuilder.js — Rebuild index.html from manifest.json
 * Newest article → hero block. Next 5 → card grid. Rest → archive list.
 */

import fs   from 'fs/promises';
import path from 'path';

export async function rebuildHomepage(config) {
  let manifest;
  try {
    const raw = await fs.readFile(config.manifestPath, 'utf8');
    manifest  = JSON.parse(raw);
  } catch {
    throw new Error(`manifest.json not found at ${config.manifestPath}`);
  }

  const articles = manifest.articles || [];
  if (!articles.length) throw new Error('No articles in manifest yet.');

  const html = buildPage(articles[0], articles.slice(1,6), articles.slice(6,20), config);
  await fs.writeFile(config.indexPath, html, 'utf8');
}

function buildPage(hero, cards, archive, config) {
  const cardHtml = cards.map(a => `
    <article class="card">
      <div class="card-cat">${edLabel(a.edition)}</div>
      <h2><a href="${a.url}">${esc(a.title)}</a></h2>
      <p class="card-desc">${esc(a.metaDesc)}</p>
      <div class="card-foot">
        <span>${fmtDate(a.date)}</span>
        <a href="${a.url}" class="read-more">Read →</a>
      </div>
    </article>`).join('');

  const archiveHtml = archive.length ? `
    <section class="archive">
      <h2 class="section-heading">Earlier Articles</h2>
      <ul>${archive.map(a=>`
        <li><a href="${a.url}">${esc(a.title)}</a><span class="arch-date">${fmtDate(a.date)}</span></li>`).join('')}
      </ul>
    </section>` : '';

  const heroTagsHtml = (hero.seoTags||[]).slice(0,4)
    .map(t=>`<span class="hero-tag">${esc(t)}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.siteName)} — ${esc(config.siteTagline)}</title>
<meta name="description" content="${esc(hero.metaDesc)}">
<link rel="canonical" href="${config.siteUrl}">
<meta property="og:type"        content="website">
<meta property="og:title"       content="${esc(config.siteName)}">
<meta property="og:description" content="${esc(hero.metaDesc)}">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;background:#f4f6f9}
nav{background:#1a3a5c;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:54px}
.nav-logo{color:#fff;font-weight:700;font-size:20px;text-decoration:none}
.nav-links{display:flex;gap:20px}
.nav-links a{color:rgba(255,255,255,.75);font-size:13px;text-decoration:none}
.nav-links a:hover{color:#fff}
.live-badge{background:#e53935;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;margin-left:6px;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}
.page{max-width:1080px;margin:0 auto;padding:28px 20px 60px}
.hero{background:#fff;border-radius:12px;padding:32px 36px;margin-bottom:24px;border:1px solid #dce4ef}
.hero-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#e53935;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.live-dot{width:8px;height:8px;border-radius:50%;background:#e53935;animation:blink 1.2s infinite}
.hero h1{font-size:clamp(22px,3vw,32px);font-weight:700;line-height:1.3;color:#1a3a5c;margin-bottom:12px}
.hero h1 a{color:inherit;text-decoration:none}
.hero h1 a:hover{color:#185fa5}
.hero-desc{font-size:15px;color:#555;line-height:1.65;margin-bottom:16px}
.hero-meta{display:flex;gap:14px;font-size:13px;color:#888;flex-wrap:wrap}
.hero-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:16px}
.hero-tag{background:#e8f0f8;color:#185fa5;font-size:12px;padding:3px 10px;border-radius:20px}
.read-btn{display:inline-block;background:#1a3a5c;color:#fff;padding:9px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-top:20px}
.read-btn:hover{background:#185fa5}
.section-heading{font-size:14px;font-weight:700;color:#1a3a5c;margin-bottom:14px;text-transform:uppercase;letter-spacing:.05em}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:28px}
.card{background:#fff;border-radius:10px;padding:20px;border:1px solid #dce4ef;display:flex;flex-direction:column}
.card-cat{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#185fa5;font-weight:700;margin-bottom:6px}
.card h2{font-size:15px;font-weight:600;line-height:1.4;margin-bottom:8px}
.card h2 a{color:#1a3a5c;text-decoration:none}
.card h2 a:hover{color:#185fa5}
.card-desc{font-size:13px;color:#555;line-height:1.55;flex:1;margin-bottom:12px}
.card-foot{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#888;margin-top:auto}
.read-more{color:#185fa5;text-decoration:none;font-weight:600}
.archive{background:#fff;border-radius:10px;padding:20px 24px;border:1px solid #dce4ef}
.archive ul{list-style:none}
.archive li{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #eef1f5;font-size:14px}
.archive li:last-child{border:none}
.archive li a{color:#1a3a5c;text-decoration:none;flex:1}
.archive li a:hover{color:#185fa5}
.arch-date{font-size:12px;color:#999;flex-shrink:0;margin-left:12px}
footer{background:#1a3a5c;color:#9ab3cb;text-align:center;padding:28px;font-size:13px;margin-top:60px}
footer a{color:#7eb4d8;text-decoration:none}
@media(max-width:600px){.nav-links{display:none}.hero{padding:20px}.page{padding:16px 12px 40px}}
</style>
</head>
<body>
<nav aria-label="Main navigation">
  <a href="${config.siteUrl}" class="nav-logo">${config.siteName}</a>
  <div class="nav-links">
    <a href="${config.siteUrl}/blog">Markets</a>
    <a href="${config.siteUrl}/mutual-funds">Mutual Funds</a>
    <a href="${config.siteUrl}/personal-finance">Personal Finance</a>
    <a href="${config.siteUrl}/blog">Latest<span class="live-badge">LIVE</span></a>
  </div>
</nav>
<main class="page">
  <section aria-label="Latest article">
    <div class="hero">
      <div class="hero-eyebrow"><span class="live-dot" aria-hidden="true"></span> Latest · ${edLabel(hero.edition)} · ${fmtDate(hero.date)}</div>
      <h1><a href="${hero.url}">${esc(hero.title)}</a></h1>
      <p class="hero-desc">${esc(hero.metaDesc)}</p>
      <div class="hero-meta">
        <span>📅 ${fmtDate(hero.date)}</span>
        <span>📖 ~${Math.ceil((hero.wordCount||1400)/200)} min read</span>
      </div>
      <div class="hero-tags">${heroTagsHtml}</div>
      <a href="${hero.url}" class="read-btn">Read Full Article →</a>
    </div>
  </section>
  ${cards.length ? `<p class="section-heading">Recent Articles</p><div class="card-grid">${cardHtml}</div>` : ''}
  ${archiveHtml}
</main>
<footer>
  <p>© ${new Date().getFullYear()} ${config.siteName} · <a href="${config.siteUrl}/privacy">Privacy</a> · <a href="${config.siteUrl}/disclaimer">Disclaimer</a></p>
  <p style="margin-top:8px;font-size:11px">Auto-rebuilt ${new Date().toLocaleString('en-IN')} · Powered by Gemini AI (Free) & GitHub Actions</p>
</footer>
</body>
</html>`;
}

const esc    = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate= d => new Date(d+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
const edLabel= e => e==='finance-news' ? 'Finance News' : 'Market Update';
