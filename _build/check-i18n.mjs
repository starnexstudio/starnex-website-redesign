// Checks the three-language site. Run after `node build.mjs`:
//   node check-i18n.mjs            content + built-output checks
//   node check-i18n.mjs --http     also requests every URL from the preview server (node serve.mjs)
// Exits with code 1 when any check fails. Warnings never fail the run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, DEFAULT_LOCALE, CONTENT_FILES, loadContent, pathFor } from './lib/i18n.mjs';
import { SITE, services, posts, legal } from './data.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const errors = [], warnings = [];
const fail = m => errors.push(m), warn = m => warnings.push(m);
const REF = 'en';

/* ---------- 1. translation-key parity ---------- */
const content = {};
for (const l of LOCALES) content[l.code] = await loadContent(l.code);
const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
const tags = s => [...s.matchAll(/<\/?([a-z0-9]+)/gi)].map(m => m[1].toLowerCase()).join(',');
const isPlural = v => v && typeof v === 'object' && !Array.isArray(v) && 'other' in v;
function compare(ref, val, where, code) {
  if (isPlural(ref)) {
    if (!isPlural(val)) return fail(`${code}: ${where} must be a plural object`);
    const need = new Intl.PluralRules(LOCALES.find(l => l.code === code).intl).resolvedOptions().pluralCategories;
    for (const c of need) if (!val[c]) fail(`${code}: ${where} is missing plural form "${c}"`);
    for (const c of Object.keys(val)) if (placeholders(val[c]) !== placeholders(ref.other)) fail(`${code}: ${where}.${c} placeholders differ from ${REF}`);
    return;
  }
  if (typeof ref === 'string') {
    if (typeof val !== 'string') return fail(`${code}: ${where} should be text`);
    if (!val.trim() && ref.trim()) fail(`${code}: ${where} is empty`);
    if (val.includes('⟦missing')) fail(`${code}: ${where} contains a missing-translation marker`);
    if (placeholders(val) !== placeholders(ref)) fail(`${code}: ${where} placeholders {${placeholders(val)}} differ from ${REF} {${placeholders(ref)}}`);
    if (tags(val) !== tags(ref)) fail(`${code}: ${where} HTML tags differ from ${REF}`);
    if (code !== REF && val === ref && ref.split(/\s+/).length >= 4 && !/^(<b>StarNex|\{page\} \| StarNex Studio$)/.test(ref)) warn(`${code}: ${where} is identical to English: "${ref.slice(0, 60)}"`);
    return;
  }
  if (Array.isArray(ref)) {
    if (!Array.isArray(val)) return fail(`${code}: ${where} should be a list`);
    if (val.length !== ref.length) fail(`${code}: ${where} has ${val.length} items, ${REF} has ${ref.length}`);
    ref.forEach((r, i) => val[i] !== undefined && compare(r, val[i], `${where}[${i}]`, code));
    return;
  }
  if (ref && typeof ref === 'object') {
    if (!val || typeof val !== 'object') return fail(`${code}: ${where} should be an object`);
    for (const k of Object.keys(ref)) k in val ? compare(ref[k], val[k], where ? `${where}.${k}` : k, code) : fail(`${code}: missing key ${where ? where + '.' : ''}${k}`);
    for (const k of Object.keys(val)) if (!(k in ref)) fail(`${code}: extra key ${where ? where + '.' : ''}${k} (not in ${REF})`);
  }
}
for (const l of LOCALES) for (const f of CONTENT_FILES) compare(content[REF][f], content[l.code][f], f, l.code);
for (const l of LOCALES) {
  for (const s of services) {
    if (!content[l.code].services[s.slug]) fail(`${l.code}: no copy for service ${s.slug}`);
    else for (const w of s.work) if (!content[l.code].services[s.slug].work[w]) fail(`${l.code}: services.${s.slug}.work.${w} missing`);
  }
  for (const p of posts) if (!content[l.code].posts[p.slug]) fail(`${l.code}: no copy for post ${p.slug}`);
}
// German uses the formal address throughout
const informal = /\b(du|dich|dir|dein|deine|deinen|deinem|deiner|euch|euer|eure)\b/i;
(function scan(v, where) {
  if (typeof v === 'string') { const m = v.replace(/<[^>]+>/g, ' ').match(informal); if (m) fail(`de: ${where} uses the informal "${m[0]}"`); }
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${where}.${k}`);
})(content.de, 'de');

/* ---------- 2. built pages: lang, canonical, hreflang, links, switcher ---------- */
const pageIds = ['', ...services.map(s => `services/${s.slug}.html`), 'projects.html', 'about.html', 'blog.html', ...posts.map(p => `blog/${p.slug}.html`), 'imprint.html', 'privacy.html', '404.html'];
const fileOf = (l, id) => path.join(OUT, l.prefix, id || 'index.html');
const html = {};
for (const l of LOCALES) for (const id of pageIds) {
  const f = fileOf(l, id);
  if (!fs.existsSync(f)) { fail(`missing page ${l.prefix}${id || 'index.html'}`); continue; }
  html[l.code + ':' + id] = fs.readFileSync(f, 'utf8');
}
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const resolveLocal = (u, fromFile) => {
  const [p, hash] = u.split('#');
  let target = p ? (p.startsWith('/') ? path.join(OUT, p) : path.resolve(path.dirname(fromFile), p)) : fromFile;
  if (p && p.endsWith('/')) target = path.join(target, 'index.html');
  return { target, hash };
};
const idsCache = {};
const idsOf = f => (idsCache[f] ??= new Set([...fs.readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
const texts = h => (h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').match(/>([^<>]+)</g) || [])
  .map(s => s.slice(1, -1).replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()).filter(Boolean);
// names, loanwords and labels that are correctly the same in every language
const ALLOW_SAME = /^(Leicht & Blitzsauber|(Branding|SEO|Blog) \| StarNex Studio|\d\d · (Design|Launch)|StarNex Studio|Instagram|SEO|Branding|Blog|Studio|Tirana|[+\d\s]+|\d\d \/ \d\d|\d\d|SQ|EN|DE|Shqip|English|Deutsch|404|KONTAKT|Kontakt)$/;
let checked = 0;
for (const l of LOCALES) for (const id of pageIds) {
  const h = html[l.code + ':' + id]; if (!h) continue; checked++;
  const where = `${l.prefix}${id || 'index.html'}`, file = fileOf(l, id);
  if (!h.includes(`<html lang="${l.htmlLang}"`)) fail(`${where}: <html lang> is not "${l.htmlLang}"`);
  if (h.includes('⟦missing')) fail(`${where}: shows a missing-translation marker`);
  if (!h.includes(`property="og:locale" content="${l.og}"`)) fail(`${where}: og:locale is not ${l.og}`);
  const links = [...h.matchAll(/<link\b[^>]*>/g)].map(m => m[0]);
  const canon = links.filter(x => attr(x, 'rel') === 'canonical').map(x => attr(x, 'href'));
  const alts = Object.fromEntries(links.filter(x => attr(x, 'rel') === 'alternate' && attr(x, 'hreflang')).map(x => [attr(x, 'hreflang'), attr(x, 'href')]));
  if (id === '404.html') {
    if (canon.length || Object.keys(alts).length) fail(`${where}: a 404 page must not have canonical or hreflang`);
    if (!/<meta name="robots" content="noindex">/.test(h)) fail(`${where}: 404 page should be noindex`);
  } else {
    const self = SITE + pathFor(l, id);
    if (canon.length !== 1 || canon[0] !== self) fail(`${where}: canonical ${canon.join(' ')} should be ${self}`);
    for (const o of LOCALES) if (alts[o.htmlLang] !== SITE + pathFor(o, id)) fail(`${where}: hreflang ${o.htmlLang} is ${alts[o.htmlLang]}`);
    if (alts['x-default'] !== SITE + pathFor(LOCALES.find(o => o.code === DEFAULT_LOCALE), id)) fail(`${where}: x-default should point to the Albanian page`);
    if (Object.keys(alts).length !== LOCALES.length + 1) fail(`${where}: unexpected hreflang set ${Object.keys(alts)}`);
  }
  if (legal.draft && /^(imprint|privacy).html$/.test(id) && !/<meta name="robots" content="noindex">/.test(h)) fail(`${where}: draft legal page should be noindex`);
  // language switcher points at the same page in each language, marks the current one
  const sw = (h.match(/<nav class="lang"[\s\S]*?<\/nav>/) || [''])[0];
  for (const o of LOCALES) {
    const a = [...sw.matchAll(/<a\b[^>]*>/g)].map(m => m[0]).find(x => attr(x, 'lang') === o.htmlLang);
    if (!a) { fail(`${where}: switcher has no ${o.short} link`); continue; }
    if (attr(a, 'href') !== pathFor(o, id)) fail(`${where}: switcher ${o.short} -> ${attr(a, 'href')}, expected ${pathFor(o, id)}`);
    if ((o.code === l.code) !== /aria-current="true"/.test(a)) fail(`${where}: switcher ${o.short} has the wrong aria-current`);
  }
  // every local link resolves; page links stay in this language (except the switcher and 404 language links)
  const body = h.replace(/<nav class="lang"[\s\S]*?<\/nav>/, '').replace(/<p class="nf-other">[\s\S]*?<\/p>/, '');
  for (const [, u] of body.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    const { target, hash } = resolveLocal(u, file);
    if (!fs.existsSync(target)) { fail(`${where}: broken link ${u}`); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) fail(`${where}: ${u} has no #${hash}`);
    if (target.endsWith('.html')) {
      const rel = path.relative(OUT, target).replace(/\\/g, '/');
      const inLocale = l.prefix ? rel.startsWith(l.prefix) : !/^(en|de)\//.test(rel);
      if (!inLocale) fail(`${where}: link ${u} leaves the ${l.code} version`);
    }
  }
  // leftover English: visible text identical to the English page
  if (l.code !== REF) {
    const en = new Set(texts(html[REF + ':' + id] || ''));
    for (const s of new Set(texts(h))) if (en.has(s) && !ALLOW_SAME.test(s) && s.split(' ').length >= 3) warn(`${where}: same text as English page: "${s.slice(0, 70)}"`);
  }
}

/* ---------- 3. sitemap ---------- */
const sm = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const isDraft = id => legal.draft && /^(imprint|privacy).html$/.test(id);
for (const l of LOCALES) for (const id of pageIds.filter(x => isDraft(x) && sm.includes(SITE + pathFor(l, x)))) fail(`sitemap: lists the draft page ${pathFor(l, id)}`);
for (const l of LOCALES) for (const id of pageIds.filter(x => x !== '404.html' && !isDraft(x))) if (!sm.includes(`<loc>${SITE + pathFor(l, id)}</loc>`)) fail(`sitemap: missing ${SITE + pathFor(l, id)}`);
if (sm.includes('404.html')) fail('sitemap: lists a 404 page');

/* ---------- 4. HTTP status (optional) ---------- */
if (process.argv.includes('--http')) {
  const base = 'http://localhost:' + (process.env.PORT || 5178);
  const get = async u => (await fetch(base + u, { redirect: 'manual' })).status;
  for (const l of LOCALES) for (const id of pageIds.filter(x => x !== '404.html')) { const u = pathFor(l, id), s = await get(u); if (s !== 200) fail(`HTTP ${s} for ${u}`); }
  for (const [u, want] of [['/en', 301], ['/de', 301], ['/does-not-exist', 404], ['/en/does-not-exist.html', 404], ['/sitemap.xml', 200], ['/robots.txt', 200]]) { const s = await get(u); if (s !== want) fail(`HTTP ${s} for ${u}, expected ${want}`); }
}

console.log(`checked ${CONTENT_FILES.length} content files × ${LOCALES.length} languages and ${checked} built pages`);
if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ` + warnings.join('\n  '));
if (errors.length) { console.log(`\nFAILED (${errors.length}):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('\nall checks passed');
