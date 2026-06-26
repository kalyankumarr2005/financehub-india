# FinanceHub India — 100% Free Automated Blog

Generates a fresh SEO-optimised Indian finance blog article **twice daily**, completely automatically, at **₹0/month**.

---

## Total Cost: ₹0

| Component | Service | Cost |
|---|---|---|
| AI Blog Generation | Google Gemini 1.5 Flash | **FREE** (1,500 req/day) |
| Finance News | 7 RSS feeds (ET, Moneycontrol, Livemint…) | **FREE** (no limit) |
| Automation (cron) | GitHub Actions | **FREE** (2,000 min/month) |
| Website Hosting | GitHub Pages | **FREE** (static HTML) |
| **Total** | | **₹0 / month** |

---

## Setup Guide (15 minutes)

### Step 1 — Get your free Gemini API key

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with any Google account (Gmail works)
3. Click **"Create API Key"**
4. Copy the key — it looks like `AIzaSy...`

No credit card needed. Free forever.

---

### Step 2 — Create a GitHub repository

1. Go to **https://github.com/new**
2. Name it `financehub-india`
3. Set it to **Public** (required for free GitHub Pages)
4. Click **"Create repository"**

---

### Step 3 — Upload this project

Option A — Upload via GitHub web UI:
1. Download all these files
2. Drag and drop them into your new repo on GitHub

Option B — Via terminal:
```bash
git clone https://github.com/YOUR-USERNAME/financehub-india.git
cd financehub-india
# copy all project files here
git add .
git commit -m "Initial setup"
git push
```

---

### Step 4 — Add your Gemini API key as a GitHub Secret

1. Open your repo on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Name: `GEMINI_API_KEY`
5. Value: paste your key from Step 1
6. Click **"Add secret"**

---

### Step 5 — Enable GitHub Pages

1. Go to **Settings → Pages**
2. Under "Source", select **"GitHub Actions"**
3. Click **Save**

---

### Step 6 — Update your site URL

Edit `.env.example` (or set as a GitHub variable):
```
SITE_URL=https://YOUR-USERNAME.github.io/financehub-india
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

### Step 7 — Trigger the first run

1. Go to your repo → **Actions** tab
2. Click **"FinanceHub India — Blog Pipeline"**
3. Click **"Run workflow"** → **"Run workflow"**

Watch it run! In 1–2 minutes your site will be live at:
`https://YOUR-USERNAME.github.io/financehub-india`

---

## What happens automatically after setup

| Time (IST) | Action |
|---|---|
| 08:30 Mon–Fri | Morning edition published — overnight + pre-market news |
| 15:35 Mon–Fri | Closing edition published — Sensex/Nifty final numbers |

Each run:
1. Fetches headlines from 7 free RSS feeds
2. Scores and selects the 8 most relevant articles
3. Sends them to Gemini AI → 1,400-word SEO blog generated
4. Saves `/blog/YYYY-MM-DD-market-update.html`
5. Updates `blog/manifest.json`
6. Rebuilds `index.html` (newest article becomes hero)
7. Commits all files back to GitHub
8. Deploys to GitHub Pages automatically

---

## File Structure

```
financehub-india/
├── .github/
│   └── workflows/
│       └── blog-pipeline.yml   ← GitHub Actions (the magic)
├── src/
│   ├── pipeline.js             ← Orchestrator
│   ├── config.js               ← Settings & API keys
│   ├── newsFetcher.js          ← RSS feed reader
│   ├── newsFilter.js           ← Relevance scoring
│   ├── blogGenerator.js        ← Gemini AI integration
│   ├── fileSaver.js            ← HTML writer + manifest
│   ├── homepageBuilder.js      ← index.html generator
│   └── logger.js               ← Terminal output
├── blog/                       ← Generated articles (auto-created)
│   ├── manifest.json
│   ├── 2026-06-25-market-update.html
│   └── 2026-06-25-finance-news.html
├── index.html                  ← Homepage (auto-generated)
├── .env.example
├── package.json                ← Zero dependencies
└── README.md
```

---

## Run locally (optional)

```bash
# 1. Clone your repo
git clone https://github.com/YOUR-USERNAME/financehub-india.git
cd financehub-india

# 2. Set your key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Run
node src/pipeline.js
# open index.html in your browser
```

---

## Gemini free tier limits

| Limit | Amount |
|---|---|
| Requests per day | 1,500 |
| Tokens per minute | 1,000,000 |
| Cost | ₹0 |

Running twice daily uses just 2 requests/day — you're using 0.1% of the free limit.

---

## Troubleshooting

**"GEMINI_API_KEY not set"** — Add it as a GitHub Secret (Step 4 above).

**Workflow fails with "403"** — Go to Settings → Actions → General → set "Workflow permissions" to "Read and write".

**Site shows 404** — Make sure GitHub Pages source is set to "GitHub Actions" (Step 5).

**No articles generated** — RSS feeds may be temporarily down. The pipeline will retry on the next scheduled run.

**Want to add more news sources?** — Add RSS feed URLs to the `rssFeeds` array in `src/config.js`.
