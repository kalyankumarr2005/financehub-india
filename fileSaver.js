/**
 * fileSaver.js — Save blog as standalone HTML + update manifest.json
 */

import fs   from 'fs/promises';
import path from 'path';

export async function saveBlogHTML(blog, date, edition, config) {
  await fs.mkdir(config.blogOutputDir, { recursive: true });

  const filename   = `${date}-${edition}.html`;
  const filePath   = path.join(config.blogOutputDir, filename);
  const publicUrl  = `${config.siteUrl}/blog/${filename}`;

  await fs.writeFile(filePath, buildArticlePage(blog, publicUrl, config), 'utf8');
  await updateManifest(blog, date, edition, filename, publicUrl, config);

  return [filePath];
}

function buildArticlePage(blog, canonicalUrl, config) {
  const faqHtml = blog.faqs.map(f => `
    <div class="faq-item">
      <h3 class="faq-q">${esc(f.q)}</h3>
      <p class="faq-a">${esc(f.a)}</p>
    </div>`).join('');

  const tagsHtml = blog.seoTags
    .map(t => `<a href="${config.siteUrl}/tag/${slugify(t)}" class="seo-tag">${esc(t)}</a>`)
    .join('');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: blog.seoTitle, description: blog.metaDesc,
    datePublished: blog.generatedAt, dateModified: blog.generatedAt,
    author: { '@type': 'Organization', name: config.siteName },
    publisher: { '@type': 'Organization', name: config.siteName,
      logo: { '@type': 'ImageObject', url: `${config.siteUrl}/logo.png` } },
    keywords: blog.seoTags.join(', '), url: canonicalUrl,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(blog.seoTitle)} | ${config.siteName}</title>
<meta name="description" content="${esc(blog.metaDesc)}">
<meta name="keywords" content="${esc(blog.seoTags.join(', '))}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type"        content="article">
<meta property="og:title"       content="${esc(blog.seoTitle)}">
<meta property="og:description" content="${esc(blog.metaDesc)}">
<meta property="og:url"         content="${canonicalUrl}">
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${esc(blog.seoTitle)}">
<meta name="twitter:description" content="${esc(blog.metaDesc)}">
<script type="application/ld+json">${jsonLd}</script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;background:#fff;line-height:1.75}
.site-header{background:#1a3a5c;padding:14px 24px}
.site-header a{color:#fff;text-decoration:none;font-weight:700;font-size:20px}
.breadcrumb{max-width:780px;margin:12px auto;padding:0 20px;font-size:13px;color:#666}
.breadcrumb a{color:#185fa5;text-decoration:none}
article{max-width:780px;margin:0 auto;padding:24px 20px 60px}
.article-meta{display:flex;gap:16px;font-size:13px;color:#666;margin-bottom:20px;flex-wrap:wrap}
h1{font-size:clamp(22px,3vw,30px);font-weight:700;line-height:1.35;margin-bottom:12px;color:#1a3a5c}
h2{font-size:20px;font-weight:600;margin:32px 0 10px;color:#1a3a5c;border-bottom:2px solid #e8f0f8;padding-bottom:6px}
h3{font-size:17px;font-weight:600;margin:20px 0 8px;color:#2c4a6e}
p{margin-bottom:14px}
ul,ol{margin:8px 0 14px 20px}
li{margin-bottom:5px}
strong{color:#1a3a5c}
.highlight-box{background:#fffbea;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:0 8px 8px 0;margin:20px 0}
.faq-section{background:#f0f4f9;border-radius:10px;padding:24px;margin:36px 0 24px}
.faq-section h2{border:none;margin-top:0}
.faq-item{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #dce4ef}
.faq-item:last-child{border:none;margin-bottom:0;padding-bottom:0}
.faq-q{font-size:15px;font-weight:600;margin-bottom:6px;color:#1a3a5c}
.faq-a{font-size:14px;color:#444}
.tags-section{margin-top:28px}
.tags-section h3{font-size:14px;color:#666;margin-bottom:8px}
.seo-tag{display:inline-block;background:#e8f0f8;color:#185fa5;font-size:12px;padding:3px 10px;border-radius:20px;margin:3px;text-decoration:none}
.seo-tag:hover{background:#185fa5;color:#fff}
.disclaimer{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-top:32px;font-size:13px;color:#7f1d1d}
footer{background:#1a3a5c;color:#9ab3cb;text-align:center;padding:24px;font-size:13px;margin-top:60px}
footer a{color:#7eb4d8;text-decoration:none}
@media(max-width:600px){article{padding:16px 14px 40px}h1{font-size:20px}}
</style>
</head>
<body>
<header class="site-header">
  <a href="${config.siteUrl}">${config.siteName}</a>
</header>
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="${config.siteUrl}">Home</a> › <a href="${config.siteUrl}/blog">Market News</a> › ${esc(blog.seoTitle.slice(0,50))}…
</nav>
<article>
  <div class="article-meta">
    <span>📅 ${new Date(blog.generatedAt).toLocaleDateString('en-IN',{dateStyle:'long'})}</span>
    <span>📖 ~${Math.ceil(blog.wordCount/200)} min read</span>
    <span>🏷️ ${esc(blog.seoTags[0]||'Finance News')}</span>
  </div>
  <h1>${esc(blog.seoTitle)}</h1>
  ${blog.htmlContent}
  <section class="faq-section" aria-labelledby="faq-heading">
    <h2 id="faq-heading">Frequently Asked Questions</h2>
    ${faqHtml}
  </section>
  <div class="tags-section">
    <h3>Topics covered:</h3>
    ${tagsHtml}
  </div>
  <div class="disclaimer" role="note">
    <strong>⚠ Disclaimer:</strong> This article is for informational purposes only and does not constitute financial advice.
    Market investments are subject to risk. Please read all scheme-related documents carefully and consult a
    SEBI-registered financial advisor before making investment decisions. Past performance is not indicative of future returns.
  </div>
</article>
<footer>
  <p>© ${new Date().getFullYear()} ${config.siteName} · <a href="${config.siteUrl}/privacy">Privacy</a> · <a href="${config.siteUrl}/disclaimer">Disclaimer</a></p>
  <p style="margin-top:6px;font-size:11px">Auto-generated · Powered by Gemini AI (Free) · ${new Date(blog.generatedAt).toLocaleString('en-IN')}</p>
</footer>
</body>
</html>`;
}

async function updateManifest(blog, date, edition, filename, publicUrl, config) {
  let manifest = { articles: [] };
  try {
    const raw = await fs.readFile(config.manifestPath, 'utf8');
    manifest  = JSON.parse(raw);
  } catch { /* first run */ }

  manifest.articles = manifest.articles.filter(a => !(a.date === date && a.edition === edition));
  manifest.articles.unshift({
    date, edition, filename, url: publicUrl,
    title: blog.seoTitle, metaDesc: blog.metaDesc,
    seoTags: blog.seoTags.slice(0, 6),
    wordCount: blog.wordCount, generatedAt: blog.generatedAt,
  });
  manifest.articles  = manifest.articles.slice(0, 90);
  manifest.updatedAt = new Date().toISOString();

  await fs.writeFile(config.manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

const esc      = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slugify  = s => s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
