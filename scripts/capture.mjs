import { chromium } from "playwright";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SITE,
  EXTRA_PAGES,
  NAV,
  SHOP_TREE,
  ORPHAN_CATEGORIES,
  BRANDS,
  slugify,
  pathOf,
  shortenTitle,
} from "./pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots");
const META_PATH = path.join(ROOT, "data", "pages.json");

const VIEWPORT = { width: 1440, height: 900 };
const CLIP = { x: 0, y: 0, width: 1440, height: 2400 };

async function fetchSitemap(type) {
  const url = `${SITE}/xmlsitemap.php?type=${type}&page=1`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 GenXSitemapBot/1.0" } });
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function collectKnownUrls() {
  const urls = new Set([SITE + "/"]);
  for (const n of NAV) urls.add(n.url);
  for (const b of BRANDS) urls.add(b.url);
  for (const e of EXTRA_PAGES) urls.add(e.url);
  for (const brand of SHOP_TREE) {
    urls.add(SITE + brand.path);
    for (const child of brand.children || []) urls.add(SITE + child.path);
  }
  for (const o of ORPHAN_CATEGORIES) urls.add(SITE + o.path);
  return urls;
}

async function buildInventory() {
  const [pages, products, categories, brands, news] = await Promise.all([
    fetchSitemap("pages"),
    fetchSitemap("products"),
    fetchSitemap("categories"),
    fetchSitemap("brands"),
    fetchSitemap("news"),
  ]);

  const known = collectKnownUrls();
  const all = new Map(); // url -> meta

  function add(url, kind, extra = {}) {
    const clean = url.split("?")[0].split("#")[0].replace(/\/$/, url.includes(".php") || url.includes(".html") ? "" : "/") || SITE + "/";
    // normalize homepage
    let u = url.split("?")[0].split("#")[0];
    if (u === SITE || u === SITE + "/") u = SITE + "/";
    if (all.has(u)) {
      Object.assign(all.get(u), extra);
      return;
    }
    const p = pathOf(u);
    all.set(u, {
      url: u,
      path: p === "/" ? "/" : p,
      kind,
      slug: slugify(u),
      title: extra.title || null,
      note: extra.note || null,
      ...extra,
    });
  }

  for (const u of pages) add(u, u === SITE + "/" || u === SITE ? "home" : "page");
  for (const u of categories) add(u, "category");
  for (const u of products) add(u, "product");
  for (const u of brands) add(u.endsWith("/brands") ? u.replace(/\/brands$/, "/brands/") : u, "brand");
  for (const u of news) add(u, "blog");

  for (const e of EXTRA_PAGES) add(e.url, e.group === "utility" ? "utility" : "page", { title: e.title, note: e.note });

  // ensure nav + tree cats present
  for (const n of NAV) add(n.url, n.id === "shop" || n.id === "accessories" ? "category" : "page", { title: n.title, note: n.note });
  for (const brand of SHOP_TREE) {
    add(SITE + brand.path, "category", { title: brand.title });
    for (const child of brand.children || []) {
      add(SITE + child.path, "category", { title: child.title, note: child.note });
    }
  }
  for (const o of ORPHAN_CATEGORIES) add(SITE + o.path, "category", { title: o.title, note: o.note });
  for (const b of BRANDS) add(b.url, "brand", { title: b.title });

  // brand index normalization
  add(`${SITE}/brands/`, "brand", { title: "All Brands" });
  add(`${SITE}/blog/`, "page", { title: "Blog" });

  return [...all.values()].sort((a, b) => a.path.localeCompare(b.path));
}

async function dismissOverlays(page) {
  // Try common cookie / privy / promo dismissals
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("Got it")',
    'button:has-text("Close")',
    '[aria-label="Close"]',
    ".privy-dismiss-content",
    "#privy-container button",
    ".modal-close",
  ];
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 })) await el.click({ timeout: 800 });
    } catch {
      /* ignore */
    }
  }
  // Escape key
  try {
    await page.keyboard.press("Escape");
  } catch {
    /* ignore */
  }
}

async function captureOne(browser, item, force = false) {
  const file = path.join(OUT_DIR, `${item.slug}.png`);
  if (!force && existsSync(file) && !item.error) {
    return {
      ...item,
      error: null,
      screenshot: `screenshots/${item.slug}.png`,
      skipped: true,
    };
  }

  let title = item.title;
  let status = 0;
  let error = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    try {
      const res = await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      status = res?.status() || 0;
      await page.waitForTimeout(1500);
      await dismissOverlays(page);
      await page.waitForTimeout(300);

      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      const needsTitle = !title || title.startsWith("/") || title === item.path;
      if (needsTitle) {
        const h1 = await page.locator("h1").first().textContent().catch(() => null);
        const docTitle = await page.title();
        title = shortenTitle((h1 && h1.trim()) || docTitle);
      }

      await page.setViewportSize({ width: 1440, height: 2400 });
      await page.waitForTimeout(150);
      await page.screenshot({ path: file, clip: CLIP, type: "png" });
      error = null;
      await context.close();
      break;
    } catch (e) {
      error = String(e.message || e);
      await context.close();
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  return {
    ...item,
    title: title || item.title || item.path,
    status,
    error,
    screenshot: `screenshots/${item.slug}.png`,
    skipped: false,
  };
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.join(ROOT, "data"), { recursive: true });

  console.log("Building inventory from XML sitemaps…");
  const inventory = await buildInventory();
  console.log(`Found ${inventory.length} unique URLs`);

  // Resume: merge previous titles
  let prev = {};
  if (existsSync(META_PATH)) {
    try {
      const old = JSON.parse(await readFile(META_PATH, "utf8"));
      for (const p of old.pages || []) prev[p.url] = p;
    } catch {
      /* ignore */
    }
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let i = 0;
  for (const item of inventory) {
    i++;
    const merged = { ...item, ...(prev[item.url] || {}) };
    // prefer fresh inventory kind/path
    merged.kind = item.kind;
    merged.path = item.path;
    merged.slug = item.slug;
    if (item.title) merged.title = item.title;
    if (item.note) merged.note = item.note;

    process.stdout.write(`[${i}/${inventory.length}] ${merged.path} … `);
    const captured = await captureOne(browser, merged, force);
    console.log(
      captured.error
        ? `ERR ${captured.error.slice(0, 80)}`
        : captured.skipped
          ? "skip"
          : `ok (${captured.status}) — ${captured.title}`
    );
    results.push(captured);

    // checkpoint every 10
    if (i % 10 === 0) {
      await writeFile(
        META_PATH,
        JSON.stringify({ capturedAt: new Date().toISOString(), site: SITE, pages: results.concat(inventory.slice(i)) }, null, 2)
      );
    }
  }

  await browser.close();

  const meta = {
    capturedAt: new Date().toISOString(),
    site: SITE,
    counts: {
      total: results.length,
      home: results.filter((p) => p.kind === "home").length,
      pages: results.filter((p) => p.kind === "page").length,
      categories: results.filter((p) => p.kind === "category").length,
      products: results.filter((p) => p.kind === "product").length,
      brands: results.filter((p) => p.kind === "brand").length,
      blog: results.filter((p) => p.kind === "blog").length,
      utility: results.filter((p) => p.kind === "utility").length,
    },
    pages: results,
  };
  await writeFile(META_PATH, JSON.stringify(meta, null, 2));
  console.log("Wrote", META_PATH);
  console.log("Counts:", meta.counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
