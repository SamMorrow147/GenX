/** Site inventory + hierarchy for GenXDirect visual sitemap */

export const SITE = "https://www.genxdirect.com";
export const CAPTURED = "Jul 27, 2026";

/** Utility / account pages not in XML sitemap but linked in chrome */
export const EXTRA_PAGES = [
  { url: `${SITE}/cart.php`, title: "Cart", path: "/cart.php", group: "utility", note: "BigCommerce cart" },
  { url: `${SITE}/login.php`, title: "Sign In", path: "/login.php", group: "utility", note: "Account login / register" },
  { url: `${SITE}/blog/`, title: "Blog", path: "/blog/", group: "content", note: "News & articles index" },
  { url: `${SITE}/sitemap.php`, title: "HTML Sitemap", path: "/sitemap.php", group: "utility", note: "BigCommerce auto sitemap" },
  { url: `${SITE}/giftcertificates.php`, title: "Gift Certificates", path: "/giftcertificates.php", group: "utility", note: "Linked from header" },
];

/**
 * Primary nav order (level-1 branches under Home).
 * Shop points at Generator Brands category.
 */
export const NAV = [
  { id: "shop", title: "Shop", path: "/generator-brands/", url: `${SITE}/generator-brands/`, note: "Generator Brands hub — Shop nav target" },
  { id: "accessories", title: "Accessories", path: "/accessories-3/", url: `${SITE}/accessories-3/`, note: "Accessories category" },
  { id: "videos", title: "Videos", path: "/videos/", url: `${SITE}/videos/`, note: "Product / how-to videos" },
  { id: "about", title: "About Us", path: "/about-us/", url: `${SITE}/about-us/`, note: "Company story" },
  { id: "faq", title: "F.A.Q.", path: "/f-a-q/", url: `${SITE}/f-a-q/`, note: "Frequently asked questions" },
  { id: "contact", title: "Contact Us", path: "/contact-us/", url: `${SITE}/contact-us/`, note: "Contact form + phone" },
  { id: "warranty", title: "Warranty", path: "/warranty/", url: `${SITE}/warranty/`, note: "Warranty policy" },
  { id: "shipping", title: "Shipping & Returns", path: "/shipping-returns/", url: `${SITE}/shipping-returns/`, note: "Shipping & returns policy" },
];

/**
 * Mega-menu category tree under Shop / Generator Brands.
 * Children are model-level categories. Products hang off matching URL prefixes.
 */
export const SHOP_TREE = [
  {
    title: "Briggs & Stratton",
    path: "/briggs-stratton/",
    children: [
      { title: "P2200 PowerSmart Series", path: "/p2200-powersmart-series-inverter-generator/" },
    ],
  },
  {
    title: "Generac",
    path: "/generac/",
    children: [
      { title: "Generac IQ2000", path: "/generac-iq2000/" },
    ],
  },
  {
    title: "Predator",
    path: "/predator/",
    children: [
      { title: "Predator 2000", path: "/predator-2000/" },
      { title: "Predator 3500", path: "/predator-3500/" },
    ],
  },
  {
    title: "Honda",
    path: "/honda/",
    children: [
      { title: "Honda EU1000", path: "/honda-eu1000/" },
      { title: "Honda EU1000 (alt)", path: "/honda-eu1000-1/", note: "Duplicate category URL" },
      { title: "Honda EB2800i", path: "/honda-eb2800i/" },
      { title: "Honda EU2200i", path: "/honda-eu2200/" },
      { title: "Honda EU3000", path: "/honda-eu3000/" },
      { title: "Honda EU3000 (alt)", path: "/honda-eu3000-1/", note: "Duplicate category URL" },
      { title: "Honda EU3200i", path: "/honda-eu3200i/" },
      { title: "Honda EU2000", path: "/honda-eu2000/" },
      { title: "Honda EU6500", path: "/honda-eu6500/" },
      { title: "Honda EM6500SX", path: "/em6500sx/" },
      { title: "Honda EU7000", path: "/honda-eu7000/" },
    ],
  },
  {
    title: "Kipor",
    path: "/kipor/",
    children: [
      { title: "Kipor 1000", path: "/kipor-1000/" },
      { title: "Kipor 1000 (alt)", path: "/kipor-1000-1/", note: "Duplicate category URL" },
      { title: "Kipor 2000", path: "/kipor-2000/" },
      { title: "Kipor 2000 (alt)", path: "/kipor-2000-1/", note: "Duplicate category URL" },
      { title: "Kipor 2600", path: "/kipor-2600/" },
      { title: "Kipor 2600 (alt)", path: "/kipor-2600-1/", note: "Duplicate category URL" },
      { title: "Kipor 770", path: "/kipor-770/" },
      { title: "Kipor 770 (alt)", path: "/kipor-770-1/", note: "Duplicate category URL" },
    ],
  },
  {
    title: "Ryobi",
    path: "/ryobi/",
    children: [
      { title: "Ryobi 2200", path: "/ryobi-2200/" },
      { title: "Ryobi 2300 Bluetooth", path: "/new-category/", note: "Slug is still /new-category/" },
    ],
  },
  {
    title: "Yamaha",
    path: "/yamaha/",
    children: [
      { title: "EF2200iS", path: "/ef2200is/" },
      { title: "Yamaha 1000", path: "/yamaha-1000/" },
      { title: "Yamaha 2000", path: "/yamaha-2000/" },
    ],
  },
];

/** Category pages in sitemap but not in primary mega-menu */
export const ORPHAN_CATEGORIES = [
  { title: "Champion 3100", path: "/champion-3100-1/", note: "In sitemap; Champion brand page 404s" },
  { title: "DuroMax XP2000i", path: "/duromax-xp2000i/" },
  { title: "DuroMax XP2000i (alt)", path: "/duromax-xp2000i-1/", note: "Duplicate category URL" },
  { title: "iGen2200", path: "/igen2200/" },
  { title: "Powerhorse 2000 Gravity Fed", path: "/powerhorse-2000-gravity-fed/" },
  { title: "Westinghouse W2000i", path: "/w2000i/" },
];

export const BRANDS = [
  { title: "All Brands", path: "/brands/", url: `${SITE}/brands/` },
  { title: "IPI Industries", path: "/brands/IPI-Industries.html", url: `${SITE}/brands/IPI-Industries.html` },
  { title: "Attwood", path: "/brands/Attwood.html", url: `${SITE}/brands/Attwood.html` },
  { title: "Generac (brand)", path: "/brands/Generac.html", url: `${SITE}/brands/Generac.html` },
];

/** Map path slug → short screenshot filename (no extension) */
export function slugify(urlOrPath) {
  let p = urlOrPath.replace(SITE, "").replace(/^https?:\/\/www\.genxdirect\.com/, "");
  p = p.split("?")[0].split("#")[0];
  if (!p || p === "/") return "home";
  let slug = p
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/\.html?$/i, "")
    .replace(/\.php$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  // Keep the unique trailing segment when paths are long (avoids collisions)
  if (slug.length > 100) {
    const parts = slug.split("-").filter(Boolean);
    const tail = parts.slice(-12).join("-");
    const head = parts.slice(0, 4).join("-");
    slug = `${head}--${tail}`.slice(0, 120);
  }
  return slug;
}

export function pathOf(url) {
  try {
    const u = new URL(url);
    return u.pathname + (u.pathname.endsWith("/") || u.pathname.includes(".") ? "" : "/");
  } catch {
    return url;
  }
}

export function shortenTitle(raw) {
  if (!raw) return "Untitled";
  let t = raw
    .replace(/\s*[|\-–—]\s*GenXDirect.*$/i, "")
    .replace(/\s*-\s*Portable Generator.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > 72) t = t.slice(0, 69) + "…";
  return t || "Untitled";
}
