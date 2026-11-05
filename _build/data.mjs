// Language-neutral facts for the StarNex Studio site: order, slugs, links, dates.
// Every word a visitor reads lives in content/<locale>/*.mjs instead.

export const SITE = 'https://starnexstudio.com';
export const GA4_ID = 'G-1RVYRLNBYY'; // the existing property, kept so history continues; loads only after consent, only on the production host
export const OG_IMAGE = { path: '/images/og-image.jpg', width: 1200, height: 630 };

export const contact = {
  phone: '+355 68 234 8060',
  tel: 'tel:+355682348060',
  email: 'contact@starnexstudio.com',
  whatsapp: 'https://wa.me/355682348060',
  // official profiles: shown in the footer and used as sameAs in the structured data
  social: [
    ['Instagram', 'https://www.instagram.com/starnex_studio'],
    ['TikTok', 'https://www.tiktok.com/@starnex_studio'],
    ['LinkedIn', 'https://www.linkedin.com/company/starnexstudio/'],
    ['Facebook', 'https://www.facebook.com/people/StarNex-Studio/61591739003773/'],
  ],
};

// Order set by the studio. `work` lists related project slugs.
export const services = [
  // from: the starting price in euros, shown on the prices page; no value shows "on request"
  { slug: 'development', from: 299, shape: 'dev', work: ['ls-entruempelung', 'villa-johannes', 'lb-gebaeude'] },
  { slug: 'seo', shape: 'seo', work: ['ls-entruempelung', 'auto-xheviti', 'lb-gebaeude', 'villa-johannes'] },
  { slug: 'online-stores', from: 599, shape: 'store', work: [] },
  { slug: 'branding', shape: 'brand', work: ['teka', 'starnex'] },
  { slug: 'ui-ux-design', shape: 'uiux', work: ['villa-johannes', 'ls-entruempelung'] },
  { slug: 'web-apps', shape: 'apps', work: ['villa-johannes'] },
  { slug: 'digital-menus', from: 99, shape: 'menu', work: [] },
  { slug: 'online-ads', shape: 'ads', work: [] },
  { slug: 'cms-automation', shape: 'cms', work: ['villa-johannes'] },
];

// real Google reviews supplied by the studio: the words are kept as written (content/<locale>/site.mjs, reviews.quotes)
export const reviews = [
  { id: 'fatlum', name: 'Fatlum Bunjaku', lang: 'sq' },
  { id: 'pm', name: 'p m', lang: 'de' },
  { id: 'trim', name: 'Trim Sopa', lang: 'sq' },
];

export const projects = [
  { slug: 'auto-xheviti', name: 'Auto Xheviti', url: 'https://www.autoxheviti.com/', host: 'autoxheviti.com', services: ['development', 'seo'] },
  { slug: 'ls-entruempelung', name: 'L&S Entrümpelung', url: 'https://ls-entruempelung-demontage.de/', host: 'ls-entruempelung-demontage.de', services: ['development', 'seo'] },
  { slug: 'lb-gebaeude', name: 'Leicht & Blitzsauber', url: 'https://xn--lb-gebude-service-vqb.de/', host: 'lb-gebäude-service.de', services: ['development', 'seo'] },
  { slug: 'villa-johannes', name: 'Villa Johannes', url: 'https://villajohannes.de/', host: 'villajohannes.de', services: ['development', 'seo', 'cms-automation'] },
  // a branding project has no website: `brand` holds its images instead of url and host
  { slug: 'teka', name: 'Teka', services: ['branding'], brand: { photo: 'teka-packaging', logo: 'teka-logo' } },
  // the studio's own brand: shown with the work, but left out of the client count and the homepage
  { slug: 'starnex', name: 'StarNex Studio', services: ['branding'], own: true, brand: { photo: 'starnex-stationery', logo: 'starnex-logo' } },
];

// `cat` is a stable topic key; its label is translated in content/<locale>/site.mjs (blog.cats).
export const posts = [
  { slug: 'before-you-start-a-website', cat: 'guides', date: '2026-11-03', read: 5, service: 'development' },
  { slug: 'website-speed', cat: 'development', date: '2026-10-22', read: 4, service: 'seo' },
  { slug: 'instagram-to-online-store', cat: 'stores', date: '2026-10-14', read: 5, service: 'online-stores' },
];

// Legal notice and privacy policy. While draft is true they are hidden from search engines (noindex, not in the sitemap)
// and show a draft notice. Set draft to false only after the [bracketed] parts are filled in and checked.
export const legal = { draft: false, updated: '2026-11-05' };
