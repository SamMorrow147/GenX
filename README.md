# GenXDirect Visual Sitemap

Static visual sitemap of [genxdirect.com](https://www.genxdirect.com), built in the VisualSitemaps style: page screenshots laid out in the site hierarchy with counts and crawl notes.

## What's included

- **126 URLs** from the BigCommerce XML sitemaps (+ cart, login, blog index, gift certificates, HTML sitemap)
- Screenshot thumbnails for every page
- Org-chart tree: Home → Shop / Accessories / content pages / Brands / Blog / utilities
- Shop branch expands by generator brand → model category → products
- Accessories, B.E.R.G.S. systems, and blog articles in stacked columns
- Crawl notes (duplicate categories, 404 footer links, etc.)

## Local preview

```bash
npx serve .
```

Or open `index.html` in a browser.

## Recapture / rebuild

```bash
npm install
npx playwright install chromium
npm run all          # capture screenshots + build index.html
npm run capture      # screenshots only (resumes / retries missing)
npm run build:html   # regenerate index.html from data/pages.json
```

## Deploy on Vercel

This is a static site. `vercel.json` sets Framework to none, skips install/build, and serves from the repo root (`.`).

1. Import [SamMorrow147/GenX](https://github.com/SamMorrow147/GenX) in [Vercel](https://vercel.com/new)
2. Confirm Output Directory is `.` (not `public`)
3. Deploy

Or from the CLI:

```bash
npx vercel
```

## Source

Captured July 27, 2026 from live pages on genxdirect.com (BigCommerce).
