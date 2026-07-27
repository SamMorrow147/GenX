import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  SITE,
  CAPTURED,
  NAV,
  SHOP_TREE,
  ORPHAN_CATEGORIES,
  BRANDS,
  EXTRA_PAGES,
} from "./pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const META_PATH = path.join(ROOT, "data", "pages.json");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function byPath(pages) {
  const m = new Map();
  for (const p of pages) {
    const key = normalizePath(p.path || pathOfUrl(p.url));
    m.set(key, p);
  }
  return m;
}

function pathOfUrl(url) {
  try {
    const u = new URL(url);
    let p = u.pathname;
    if (!p.endsWith("/") && !p.includes(".")) p += "/";
    return p || "/";
  } catch {
    return "/";
  }
}

function normalizePath(p) {
  if (!p || p === "/") return "/";
  if (p.includes(".php") || p.includes(".html")) return p;
  return p.endsWith("/") ? p : p + "/";
}

function nodeCard(page, { badge, root } = {}) {
  if (!page) return `<div class="node missing"><div class="node-info"><div class="node-title">Missing page</div></div></div>`;
  const img = `/${(page.screenshot || `screenshots/${page.slug}.png`).replace(/^\//, "")}`;
  const title = page.title || page.path;
  const note = page.note || (page.status && page.status >= 400 ? `HTTP ${page.status}` : "");
  const cls = root ? "node root-node" : "node";
  const live = page.url || "#";
  return `
      <div class="${cls}">
        <a class="thumb" href="${esc(live)}" target="_blank" rel="noopener"><img src="${esc(img)}" alt="${esc(title)}" loading="lazy"></a>
        <div class="node-info">
          <div class="node-title"><a href="${esc(live)}" target="_blank" rel="noopener">${esc(title)}</a>${badge ? `<span class="badge">${esc(badge)}</span>` : ""}</div>
          <div class="node-path">${esc(page.path)}</div>
          ${note ? `<div class="node-note">${esc(note)}</div>` : ""}
        </div>
      </div>`;
}

function stackHtml(items, label) {
  if (!items.length) return "";
  return `
        <div class="stack">
          ${label ? `<div class="group-label">${esc(label)}</div>` : ""}
          ${items.map((p) => (typeof p === "string" ? p : nodeCard(p))).join("\n")}
        </div>`;
}

function branch(inner) {
  return `<li><div class="drop"></div>${inner}</li>`;
}

function productsForCategory(products, catPath) {
  const needle = catPath.replace(/^\/|\/$/g, "");
  // Match product URLs whose path contains /slug/ as a segment
  return products.filter((p) => {
    const parts = p.path.replace(/^\/|\/$/g, "").split("/");
    return parts.includes(needle) || p.path.includes(`/${needle}/`);
  });
}

function productsUnderAccessories(products) {
  return products.filter((p) => p.path.startsWith("/accessories/"));
}

function productsBerg(products) {
  return products.filter((p) => p.path.startsWith("/b-e-r-g-s/"));
}

function productsGeneratorBrands(products) {
  return products.filter((p) => p.path.startsWith("/generator-brands/"));
}

async function main() {
  const meta = JSON.parse(await readFile(META_PATH, "utf8"));
  const pages = meta.pages;
  const map = byPath(pages);

  const get = (p) => map.get(normalizePath(p));
  const products = pages.filter((p) => p.kind === "product");
  const blogPosts = pages.filter((p) => p.kind === "blog");

  const home = get("/") || pages.find((p) => p.kind === "home");

  const counts = {
    total: pages.length,
    pages: pages.filter((p) => ["home", "page", "utility"].includes(p.kind)).length,
    categories: pages.filter((p) => p.kind === "category").length,
    products: products.length,
    brands: pages.filter((p) => p.kind === "brand").length,
    blog: blogPosts.length,
  };

  // --- Shop branch ---
  const shopPage = get("/generator-brands/");
  let shopInner = nodeCard(shopPage, { badge: String(SHOP_TREE.length) });

  // Brand stacks under shop
  const brandStacks = [];
  const claimedProductUrls = new Set();

  for (const brand of SHOP_TREE) {
    const brandPage = get(brand.path);
    const modelBlocks = [];
    for (const child of brand.children || []) {
      const childPage = get(child.path);
      const childProducts = productsForCategory(products, child.path).filter((p) => !claimedProductUrls.has(p.url));
      childProducts.forEach((p) => claimedProductUrls.add(p.url));
      // Also claim products under /generator-brands/{brand-slug}/...
      const more = products.filter(
        (p) =>
          !claimedProductUrls.has(p.url) &&
          p.path.includes(brand.path.replace(/^\/|\/$/g, "")) &&
          p.path.includes(child.path.replace(/^\/|\/$/g, ""))
      );
      more.forEach((p) => claimedProductUrls.add(p.url));
      const allChildProds = [...childProducts, ...more.filter((p) => !childProducts.includes(p))];
      modelBlocks.push(nodeCard(childPage || { url: SITE + child.path, path: child.path, title: child.title, note: child.note, screenshot: `screenshots/${child.path.replace(/^\/|\/$/g, "").replace(/\//g, "-")}.png`, slug: child.path.replace(/^\/|\/$/g, "") }));
      if (allChildProds.length) {
        modelBlocks.push(`<div class="group-label">Products · ${esc(child.title)}</div>`);
        for (const pr of allChildProds) modelBlocks.push(nodeCard(pr));
      }
    }
    // Brand-level products not under a model
    const brandOnly = products.filter(
      (p) =>
        !claimedProductUrls.has(p.url) &&
        p.path.startsWith("/generator-brands/") &&
        p.path.includes(`/${brand.path.replace(/^\/|\/$/g, "")}/`)
    );
    brandOnly.forEach((p) => claimedProductUrls.add(p.url));

    brandStacks.push(`
          <div class="group-label">${esc(brand.title)}</div>
          ${nodeCard(brandPage || { url: SITE + brand.path, path: brand.path, title: brand.title, screenshot: "", slug: "" })}
          ${modelBlocks.join("\n")}
          ${brandOnly.map((p) => nodeCard(p)).join("\n")}
    `);
  }

  // BERG systems products
  const berg = productsBerg(products).filter((p) => !claimedProductUrls.has(p.url));
  berg.forEach((p) => claimedProductUrls.add(p.url));

  // Orphan categories
  const orphanBlocks = ORPHAN_CATEGORIES.map((o) => {
    const pg = get(o.path);
    const prods = productsForCategory(products, o.path).filter((p) => !claimedProductUrls.has(p.url));
    prods.forEach((p) => claimedProductUrls.add(p.url));
    return (
      nodeCard(pg || { url: SITE + o.path, path: o.path, title: o.title, note: o.note, screenshot: "", slug: "" }) +
      prods.map((p) => nodeCard(p)).join("\n")
    );
  });

  // Leftover products
  const leftover = products.filter((p) => !claimedProductUrls.has(p.url) && !p.path.startsWith("/accessories/"));

  shopInner += stackHtml(
    [
      ...brandStacks,
      berg.length ? `<div class="group-label">B.E.R.G.S. Systems</div>` : "",
      ...berg.map((p) => nodeCard(p)),
      orphanBlocks.length ? `<div class="group-label">Other categories</div>` : "",
      ...orphanBlocks,
      leftover.length ? `<div class="group-label">Other products</div>` : "",
      ...leftover.map((p) => nodeCard(p)),
    ].filter(Boolean)
  );

  // --- Accessories ---
  const accPage = get("/accessories-3/");
  const accProducts = productsUnderAccessories(products);
  let accInner = nodeCard(accPage, { badge: String(accProducts.length) });
  accInner += stackHtml(accProducts.map((p) => nodeCard(p)), "Products");

  // --- Simple content pages ---
  const contentBranches = NAV.filter((n) => !["shop", "accessories"].includes(n.id)).map((n) => {
    const pg = get(n.path);
    return branch(nodeCard(pg || { url: n.url, path: n.path, title: n.title, note: n.note, screenshot: "", slug: "" }));
  });

  // --- Brands ---
  const brandIndex = get("/brands/") || get("/brands");
  let brandsInner = nodeCard(brandIndex || { url: `${SITE}/brands/`, path: "/brands/", title: "Brands", screenshot: "", slug: "brands" }, { badge: String(BRANDS.length - 1) });
  brandsInner += stackHtml(
    BRANDS.filter((b) => b.path !== "/brands/").map((b) => get(b.path) || { url: b.url, path: b.path, title: b.title, screenshot: "", slug: "" }),
    "Brand pages"
  );

  // --- Blog ---
  const blogIndex = get("/blog/");
  let blogInner = nodeCard(blogIndex || { url: `${SITE}/blog/`, path: "/blog/", title: "Blog", screenshot: "", slug: "blog" }, { badge: String(blogPosts.length) });
  blogInner += stackHtml(
    blogPosts.map((p) => nodeCard(p)),
    "Articles"
  );

  // --- Utility ---
  const utilPages = EXTRA_PAGES.filter((e) => e.group === "utility").map((e) => get(e.path) || e);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visual Sitemap — GenXDirect</title>
<style>
  :root {
    --bg: #f4f6f9;
    --card: #ffffff;
    --ink: #1a2233;
    --muted: #6b7688;
    --line: #c3ccd9;
    --accent: #e85d04;
    --accent-soft: #fff0e6;
    --radius: 10px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--ink);
    padding-bottom: 80px;
  }
  header {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    padding: 28px 40px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header-inner {
    max-width: 1800px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
  }
  .title-block h1 { font-size: 22px; font-weight: 700; }
  .title-block a {
    color: var(--accent);
    text-decoration: none;
    font-size: 14px;
  }
  .title-block a:hover { text-decoration: underline; }
  .title-block .meta { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .stats {
    display: flex;
    gap: 12px;
    margin-left: auto;
    flex-wrap: wrap;
  }
  .stat {
    background: var(--accent-soft);
    border-radius: var(--radius);
    padding: 10px 18px;
    text-align: center;
    min-width: 96px;
  }
  .stat .num { font-size: 22px; font-weight: 700; color: var(--accent); }
  .stat .lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

  .tree-wrap {
    overflow-x: auto;
    padding: 48px 40px 20px;
  }
  .tree {
    min-width: 2200px;
    max-width: none;
    margin: 0 auto;
    width: max-content;
  }
  .root-row { display: flex; justify-content: center; }
  .stem {
    width: 2px;
    height: 28px;
    background: var(--line);
    margin: 0 auto;
  }
  ul.branches {
    display: flex;
    justify-content: center;
    list-style: none;
    align-items: flex-start;
  }
  ul.branches > li {
    position: relative;
    padding: 28px 14px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  ul.branches > li::before,
  ul.branches > li::after {
    content: "";
    position: absolute;
    top: 0;
    height: 2px;
    width: 50%;
    background: var(--line);
  }
  ul.branches > li::before { left: 0; }
  ul.branches > li::after  { right: 0; }
  ul.branches > li:first-child::before { background: none; }
  ul.branches > li:last-child::after   { background: none; }
  ul.branches > li > .drop {
    position: absolute;
    top: 0;
    left: 50%;
    width: 2px;
    height: 28px;
    background: var(--line);
    transform: translateX(-50%);
  }
  .stack {
    margin-top: 14px;
    padding-left: 22px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .stack::before {
    content: "";
    position: absolute;
    left: 8px;
    top: -14px;
    bottom: 84px;
    width: 2px;
    background: var(--line);
  }
  .stack > .node { position: relative; }
  .stack > .node::before {
    content: "";
    position: absolute;
    left: -14px;
    top: 50%;
    width: 14px;
    height: 2px;
    background: var(--line);
  }
  .stack > .group-label { position: relative; }
  .group-label {
    position: relative;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
    padding: 6px 0 0 2px;
  }
  .node {
    width: 224px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .node:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(26, 34, 51, 0.14);
  }
  .node.root-node { width: 260px; border-color: var(--accent); border-width: 2px; }
  .node.missing { opacity: 0.5; min-height: 80px; }
  .thumb {
    display: block;
    width: 100%;
    height: 150px;
    overflow: hidden;
    background: #e8ebf0;
    border-bottom: 1px solid var(--line);
  }
  .root-node .thumb { height: 175px; }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .node-info { padding: 10px 12px 12px; }
  .node-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .node-title a { color: var(--ink); text-decoration: none; }
  .node-title a:hover { color: var(--accent); }
  .badge {
    flex-shrink: 0;
    margin-left: auto;
    background: var(--accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 999px;
    padding: 2px 8px;
  }
  .node-path {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    color: var(--muted);
    margin-top: 4px;
    word-break: break-all;
  }
  .node-note { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .notes {
    max-width: 1800px;
    margin: 36px auto 0;
    padding: 0 40px;
  }
  .notes h2 { font-size: 15px; margin-bottom: 10px; }
  .notes ul { list-style: none; }
  .notes li {
    font-size: 13px;
    color: var(--muted);
    padding: 4px 0 4px 18px;
    position: relative;
  }
  .notes li::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 11px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
</style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="title-block">
      <h1>Visual Sitemap</h1>
      <a href="${SITE}/" target="_blank" rel="noopener">genxdirect.com</a>
      <div class="meta">BigCommerce &middot; crawled &amp; captured ${CAPTURED} &middot; click any card to open the live page</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="num">${counts.total}</div><div class="lbl">Total URLs</div></div>
      <div class="stat"><div class="num">${counts.categories}</div><div class="lbl">Categories</div></div>
      <div class="stat"><div class="num">${counts.products}</div><div class="lbl">Products</div></div>
      <div class="stat"><div class="num">${counts.blog}</div><div class="lbl">Blog posts</div></div>
      <div class="stat"><div class="num">4</div><div class="lbl">Levels deep</div></div>
    </div>
  </div>
</header>

<div class="tree-wrap">
  <div class="tree">
    <div class="root-row">
      ${nodeCard(home, { badge: "ROOT", root: true })}
    </div>
    <div class="stem"></div>
    <ul class="branches">
      ${branch(shopInner)}
      ${branch(accInner)}
      ${contentBranches.join("\n")}
      ${branch(brandsInner)}
      ${branch(blogInner)}
      ${utilPages.map((p) => branch(nodeCard(typeof p.url === "string" && p.screenshot ? p : get(p.path) || { ...p, screenshot: `screenshots/${(p.path || "").replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-")}.png` }))).join("\n")}
    </ul>
  </div>
</div>

<div class="notes">
  <h2>Crawl notes</h2>
  <ul>
    <li>Platform is BigCommerce (Stencil). XML sitemap index exposes pages, products, categories, brands, and news.</li>
    <li>Primary Shop nav points to <code>/generator-brands/</code>; Accessories points to <code>/accessories-3/</code>.</li>
    <li>Several duplicate category URLs exist (e.g. <code>/honda-eu1000/</code> vs <code>/honda-eu1000-1/</code>, same pattern for Kipor models) — worth consolidating with redirects.</li>
    <li>Ryobi 2300 Bluetooth still uses the placeholder slug <code>/new-category/</code>.</li>
    <li>Footer links to <code>/champion/</code>, <code>/powerhorse/</code>, and <code>/westinghouse/</code> return 404; related model categories (e.g. Champion 3100, Powerhorse 2000, W2000i) do resolve.</li>
    <li>Product catalog mixes three URL trees: <code>/generator-brands/…</code>, <code>/b-e-r-g-s/…</code>, and <code>/accessories/…</code>.</li>
    <li>Blog lives at <code>/blog/</code> (${counts.blog} posts in the news sitemap) but is not in the main header nav.</li>
  </ul>
</div>

</body>
</html>
`;

  await writeFile(path.join(ROOT, "public", "index.html"), html);
  console.log("Wrote public/index.html");
  console.log("Stats:", counts);
  console.log("Claimed products:", claimedProductUrls.size, "/", products.length);
  console.log("Leftover non-accessory:", leftover.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
