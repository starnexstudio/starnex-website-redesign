// Checks the built HTML for SEO and launch problems. Needs nothing installed; safe for CI.
//   node check-seo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://starnexstudio.com';
const errors = [], warns = [];
const err = (f, m) => errors.push(`${f}: ${m}`), warn = (f, m) => warns.push(`${f}: ${m}`);

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
  if (e.name.startsWith('_') || e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') return [];
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const all = walk(OUT);
const htmlFiles = all.filter(f => f.endsWith('.html')).map(f => path.relative(OUT, f).replace(/\\/g, '/'));
const urlOf = f => '/' + f.replace(/(^|\/)index\.html$/, '$1');
const meta = (h, n) => (h.match(new RegExp(`<meta (?:name|property)="${n}" content="([^"]*)"`)) || [])[1];
const seenT = {}, seenD = {}, inbound = {};

for (const f of htmlFiles) {
  const h = fs.readFileSync(path.join(OUT, f), 'utf8');
  const noindex = /<meta name="robots" content="noindex"/.test(h);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = meta(h, 'description');
  if (!/<html lang="(sq|en|de)"/.test(h)) err(f, 'html lang missing');
  if (!title) err(f, 'no title'); else {
    (seenT[title] ||= []).push(f);
    if (title.length > 70) warn(f, `title ${title.length} chars: ${title}`);
    if (!title.includes('StarNex Studio')) err(f, 'title lacks the brand');
  }
  if (!desc) err(f, 'no description'); else {
    (seenD[desc] ||= []).push(f);
    if (desc.length > 175 && !noindex) warn(f, `description ${desc.length} chars`);
    if (desc.length < 50 && !noindex) warn(f, `description ${desc.length} chars`);
  }
  // headings: one h1, and no level skipped on the way down
  const main = h.slice(h.search(/<body/)).replace(/<script[\s\S]*?<\/script>/g, '');
  const heads = [...main.matchAll(/<h([1-6])[\s>]/g)].map(m => +m[1]);
  if (heads.filter(x => x === 1).length !== 1) err(f, `${heads.filter(x => x === 1).length} h1 elements`);
  heads.forEach((x, i) => { if (i && x > heads[i - 1] + 1) err(f, `heading jumps h${heads[i - 1]} to h${x}`); });
  // canonical and alternates
  if (!noindex) {
    const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canon !== SITE + urlOf(f)) err(f, `canonical ${canon}`);
    const alts = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    for (const c of ['sq', 'en', 'de', 'x-default']) if (!alts.some(a => a[1] === c)) err(f, `no hreflang ${c}`);
    for (const [, , u] of alts) { const rel = u.replace(SITE + '/', '').replace(/(^|\/)$/, '$1index.html'); if (!fs.existsSync(path.join(OUT, rel))) err(f, `hreflang target missing: ${u}`); }
  } else if (!f.endsWith('404.html')) err(f, 'noindex on a normal page');
  // sharing
  for (const n of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:card']) if (!meta(h, n)) err(f, `no ${n}`);
  const og = meta(h, 'og:image');
  if (og && !fs.existsSync(path.join(OUT, og.replace(SITE + '/', '')))) err(f, `og:image file missing: ${og}`);
  // icons
  for (const r of ['href="/favicon.ico"', 'href="/assets/icons/apple-touch-icon.png"', 'href="/site.webmanifest"']) if (!h.includes(r)) err(f, `no ${r}`);
  // structured data parses; no invented reviews
  const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = [];
  for (const [, j] of lds) try { const o = JSON.parse(j); (o['@graph'] || [o]).forEach(n => types.push(n['@type'])); if (/aggregateRating|"review"/.test(j)) err(f, 'review markup found'); } catch (e) { err(f, 'bad JSON-LD: ' + e.message); }
  const home = /(^|\/)index\.html$/.test(f);
  if (home && types.filter(x => x === 'WebSite').length !== 1) err(f, 'home needs exactly one WebSite node');
  if (!home && types.includes('WebSite')) err(f, 'WebSite node belongs on home pages only');
  if (!home && !noindex && !types.includes('BreadcrumbList')) err(f, 'no BreadcrumbList');
  if (/\/services\//.test('/' + f) && !types.includes('Service')) err(f, 'no Service node');
  if (/\/blog\//.test('/' + f) && !types.includes('BlogPosting')) err(f, 'no BlogPosting node');
  // leftovers
  if (/localhost|127\.0\.0\.1/.test(h)) err(f, 'localhost reference');
  if (/⟦|lorem ipsum|\bTODO\b|\bFIXME\b/i.test(h)) err(f, 'placeholder text');
  if (/draft-note/.test(h)) err(f, 'draft notice present');
  // everything loads from this site, except analytics inside consent.js
  const ext = [...h.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]).filter(u => !u.startsWith(SITE));
  if (ext.length) err(f, 'loads from another host: ' + ext.join(', '));
  if (/googletagmanager|gtag\(/.test(h)) err(f, 'analytics in the HTML: must load through consent.js only');
  // internal links and files
  const base = path.posix.dirname('/' + f);
  for (const m of h.matchAll(/(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(u)) continue;
    const p = u.startsWith('/') ? u : path.posix.join(base, u);
    const t = path.join(OUT, p.endsWith('/') ? p + 'index.html' : p);
    if (!fs.existsSync(t)) err(f, `broken link: ${u}`);
    else if (/(\.html|\/)$/.test(p)) (inbound[p.replace(/index\.html$/, '')] ||= new Set()).add(f);
  }
  for (const m of h.matchAll(/srcset="([^"]+)"/g)) for (const c of m[1].split(',')) { const u = c.trim().split(' ')[0]; if (!fs.existsSync(path.join(OUT, u))) err(f, `broken srcset: ${u}`); }
  // images
  for (const m of main.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(m[0])) err(f, 'image without alt');
    if (!/\bwidth="/.test(m[0]) || !/\bheight="/.test(m[0])) err(f, 'image without width and height: ' + m[0].slice(0, 70));
  }
}
for (const [v, fs_] of [...Object.entries(seenT), ...Object.entries(seenD)]) if (fs_.length > 1) err(fs_.join(', '), `same text: ${v.slice(0, 70)}`);

// sitemap
const sm = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d\d-\d\d)<\/lastmod>/g)];
if (locs.length !== (sm.match(/<loc>/g) || []).length) err('sitemap.xml', 'an entry has no lastmod');
for (const [, u] of locs) {
  const rel = u.replace(SITE + '/', '').replace(/(^|\/)$/, '$1index.html');
  if (!fs.existsSync(path.join(OUT, rel))) err('sitemap.xml', `missing page: ${u}`);
  else if (/noindex/.test(fs.readFileSync(path.join(OUT, rel), 'utf8').slice(0, 6000))) err('sitemap.xml', `noindex page listed: ${u}`);
  const key = new URL(u).pathname; if (key !== '/' && !inbound[key]) err(rel, 'orphan page: nothing links to it');
}
const listed = new Set(locs.map(l => new URL(l[1]).pathname));
for (const f of htmlFiles) if (!/404\.html$/.test(f) && !listed.has(urlOf(f))) err(f, 'not in the sitemap');

// hosting files
const cname = path.join(OUT, 'CNAME');
if (!fs.existsSync(cname) || fs.readFileSync(cname, 'utf8').trim() !== 'starnexstudio.com') err('CNAME', 'must hold starnexstudio.com');
if (fs.existsSync(path.join(OUT, '.nojekyll'))) err('.nojekyll', 'must not exist: it would publish _build');
if (!/^Sitemap: https:\/\/starnexstudio\.com\/sitemap\.xml/m.test(fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8'))) err('robots.txt', 'no sitemap line');
const rb = fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8').split(/\n\s*\n/).find(b => /User-agent: \*/.test(b)) || '';
if (/Disallow: \/\s*$/m.test(rb)) err('robots.txt', 'default policy blocks the site');
const man = JSON.parse(fs.readFileSync(path.join(OUT, 'site.webmanifest'), 'utf8'));
for (const i of man.icons) if (!fs.existsSync(path.join(OUT, i.src))) err('site.webmanifest', `missing ${i.src}`);
if (!fs.existsSync(path.join(OUT, 'favicon.ico'))) err('favicon.ico', 'missing');
for (const f of all) if (/\.(env|log)$|(^|[\\/])\.env/.test(f)) err(path.relative(OUT, f), 'should not be published');

console.log(`${htmlFiles.length} pages, ${locs.length} sitemap entries`);
if (warns.length) console.log(`\nwarnings (${warns.length}):\n  ` + warns.join('\n  '));
if (errors.length) { console.log(`\nerrors (${errors.length}):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('\nno errors');
