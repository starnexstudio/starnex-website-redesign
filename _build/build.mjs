// Builds the StarNex Studio site in Albanian (root), English (/en/) and German (/de/).
// Usage:  node build.mjs          strict: any missing translation stops the build
//         node build.mjs --dev    missing translations render as visible ⟦missing:…⟧ markers
// Templates are shared by all languages; the words come from content/<locale>/*.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { SITE, GA4_ID, OG_IMAGE, contact, services, projects, reviews, posts, legal } from './data.mjs';
import { LOCALES, DEFAULT_LOCALE, loadContent, translator, pathFor } from './lib/i18n.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const DEV = process.argv.includes('--dev');
const home = fs.readFileSync(path.join(HERE, 'home-source.html'), 'utf8');
const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const missingKeys = new Set();

/* ---------- small helpers ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
// responsive project image; every project has 720 and 1200 wide versions
const projImg = (p, alt, sizes) => {
  const base = `/assets/projects/${p.brand ? p.brand.photo : p.slug + '-d'}`;
  return `<img src="${base}-1200.webp" srcset="${base}-720.webp 720w, ${base}-1200.webp 1200w" sizes="${sizes}" alt="${esc(alt)}" ${p.brand ? 'width="1200" height="800"' : 'width="1200" height="750"'} loading="lazy" decoding="async">`;
};
const ldTag = o => `\n<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const ORG_ID = SITE + '/#organization', WEB_ID = SITE + '/#website', FONT_CSS = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts.css'), 'utf8').trim();
// everything is served from this site: no font or script request goes to another host
const localize = html => html
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, `<link rel="preload" href="/assets/fonts/figtree-latin.woff2" as="font" type="font/woff2" crossorigin>\n<style>${FONT_CSS}</style>\n`)
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@3\.12\.2\/dist\//g, '/assets/lib/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@1\.1\.13\/dist\//g, '/assets/lib/')
  .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\//g, '/assets/lib/');
const svg = d => `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const chev = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const icUp = svg('M4.5 11.5l7-7M5.5 4.5h6v6'), icDown = svg('M8 3v10M4 9l4 4 4-4'), icRight = svg('M3 8h10M9 4l4 4-4 4'), icLeft = svg('M13 8H3M7 4L3 8l4 4');
const goIc = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const accIc = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const arrow = '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const xb = (kind, href, label, o = {}) => {
  const cls = 'xbtn ' + kind + (o.sm ? ' sm' : '') + (o.cls ? ' ' + o.cls : '');
  const ic = o.icon || (kind === 'primary' ? icUp : icDown);
  const tgt = o.blank ? ' target="_blank" rel="noopener"' : '';
  const lb = `<span class="lb" aria-hidden="true"><span data-t="${esc(label)}">${esc(label)}</span></span>`;
  const pre = kind === 'ghost' ? '<i class="sh" aria-hidden="true"></i>' : '';
  return `<a class="${cls}" href="${href}"${tgt} aria-label="${esc(o.aria || label)}">${pre}${lb}<span class="ic">${ic}</span></a>`;
};
const logoSvg = home.match(/<svg viewBox="0 0 1880 531"[\s\S]*?<\/svg>/)[0];

/* ---------- shared assets (language-neutral) ---------- */
write('assets/logo.svg', logoSvg.replace(' aria-hidden="true"', ''));
const GEO = JSON.parse(home.match(/const GEO = (\{.*?\});\n/)[1]);
write('js/emblem.js', `window.SN_GEO=${JSON.stringify({ W: GEO.W, H: GEO.H, outer: GEO.outer, hole: GEO.hole, tip: GEO.tip })};\n`);

/* ---------- which pages exist, and in which languages ---------- */
const content = {};
for (const loc of LOCALES) content[loc.code] = await loadContent(loc.code);
const has = (code, group, slug) => Boolean(content[code][group]?.[slug]);
// page id = path inside a locale folder ('' is the homepage)
const pages = [
  { id: '', kind: 'home' },
  ...services.map(s => ({ id: `services/${s.slug}.html`, kind: 'service', slug: s.slug, group: 'services' })),
  { id: 'services.html', kind: 'services' },
  { id: 'projects.html', kind: 'projects' },
  { id: 'prices.html', kind: 'prices' },
  { id: 'about.html', kind: 'about' },
  { id: 'blog.html', kind: 'blog' },
  ...posts.map(p => ({ id: `blog/${p.slug}.html`, kind: 'post', slug: p.slug, group: 'posts' })),
  { id: 'imprint.html', kind: 'legal', doc: 'imprint', draft: legal.draft },
  { id: 'privacy.html', kind: 'legal', doc: 'privacy', draft: legal.draft },
  { id: '404.html', kind: '404', noindex: true },
];
for (const pg of pages) pg.locales = LOCALES.filter(l => !pg.group || has(l.code, pg.group, pg.slug)).map(l => l.code);
// strict builds need every page in every language
for (const pg of pages) if (!DEV && pg.locales.length !== LOCALES.length) throw new Error(`[i18n] ${pg.id} is missing in: ${LOCALES.map(l => l.code).filter(c => !pg.locales.includes(c)).join(', ')}`);

/* ---------- per-language page parts ---------- */
function parts(loc) {
  const t = translator(loc, content[loc.code], { strict: !DEV, onMissing: (c, k) => missingKeys.add(`${c}: ${k}`) });
  const L = p => pathFor(loc, p); // link to a page in this language
  const svcT = slug => t.entry('services', slug) || { name: `⟦missing:${loc.code}:services.${slug}⟧`, split: ['⟦missing⟧', ''] };
  const CALL = `<p class="call">${t('cta.call', { phone: `<a href="${contact.whatsapp}" target="_blank" rel="noopener">${esc(contact.phone)}</a>` })}</p>`;

  const heroBtns = (href2, label2) => `<div class="xbtns">${xb('primary', '#contact', t('hero.contact'))}${xb('ghost', href2, label2)}</div>`;
  const menuBtn = `<button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="overlay"><span class="lbl" aria-hidden="true"><span>${esc(t('header.menuOpen'))}</span><span>${esc(t('header.menuClose'))}</span></span><span class="ring" aria-hidden="true"><i></i><i></i></span><span class="vh">${esc(t('header.menuToggle'))}</span></button>`;

  // Globe in the header; the languages drop down on hover (mouse), tap (touch) or Enter/Space (keyboard).
  // Each link opens the same page in that language, or that language's homepage if the page has no translation.
  const globe = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1"><circle cx="8" cy="8" r="6.5"/><path d="M1.5 8h13"/><ellipse class="m" cx="8" cy="8" rx="2.8" ry="6.5"/></svg>';
  const langNav = pg => `<nav class="lang" aria-label="${esc(t('lang.label'))}">
      <button class="lang-btn" type="button" aria-expanded="false" aria-controls="langMenu" aria-label="${esc(t('lang.current', { lang: loc.label }))}">${globe}</button>
      <ul class="lang-menu" id="langMenu">${LOCALES.map(o => {
    const exists = pg.locales.includes(o.code);
    const href = pathFor(o, exists ? pg.id : '');
    const cur = o.code === loc.code;
    return `<li><a href="${href}" hreflang="${o.htmlLang}" lang="${o.htmlLang}"${cur ? ' aria-current="true"' : ''}${exists ? '' : ' data-fallback="home"'}>${o.label}</a></li>`;
  }).join('')}</ul>
    </nav>`;
  // open/close the language list; keep ?query and #section when switching language
  const langJs = `<script>(function(){var w=document.querySelector('.hdr .lang');if(!w)return;var b=w.querySelector('.lang-btn');
function set(o){w.classList.toggle('open',o);b.setAttribute('aria-expanded',o);}
b.addEventListener('click',function(){set(!w.classList.contains('open'));});
w.addEventListener('mouseenter',function(){if(matchMedia('(hover:hover)').matches)set(true);});
w.addEventListener('mouseleave',function(){if(matchMedia('(hover:hover)').matches)set(false);});
w.addEventListener('focusout',function(e){if(!w.contains(e.relatedTarget))set(false);});
document.addEventListener('click',function(e){if(!w.contains(e.target))set(false);});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&w.classList.contains('open')){set(false);b.focus();}});
w.querySelectorAll('a:not([aria-current]):not([data-fallback])').forEach(function(a){a.addEventListener('click',function(){a.href=a.getAttribute('href')+location.search+location.hash;});});})();</script>`;

  const head = (pg, { title, desc, extra = '' }) => {
    const self = SITE + L(pg.id);
    const alts = pg.noindex ? '' : [
      ...pg.locales.map(c => { const o = LOCALES.find(x => x.code === c); return `<link rel="alternate" hreflang="${o.htmlLang}" href="${SITE + pathFor(o, pg.id)}">`; }),
      pg.locales.includes(DEFAULT_LOCALE) ? `<link rel="alternate" hreflang="x-default" href="${SITE + pathFor(LOCALES.find(x => x.code === DEFAULT_LOCALE), pg.id)}">` : '',
    ].filter(Boolean).join('\n');
    const ogAlts = pg.noindex ? '' : pg.locales.filter(c => c !== loc.code).map(c => `<meta property="og:locale:alternate" content="${LOCALES.find(x => x.code === c).og}">`).join('\n');
    return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${pg.draft ? '<meta name="robots" content="noindex">\n' : ''}${pg.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${self}">\n${alts}`}
<meta property="og:type" content="${pg.kind === 'post' ? 'article' : 'website'}">
<meta property="og:site_name" content="StarNex Studio">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${pg.noindex ? '' : `<meta property="og:url" content="${self}">\n`}<meta property="og:locale" content="${loc.og}">
${ogAlts}
<meta property="og:image" content="${SITE + OG_IMAGE.path}">
<meta property="og:image:width" content="${OG_IMAGE.width}">
<meta property="og:image:height" content="${OG_IMAGE.height}">
<meta property="og:image:alt" content="${esc(t('meta.ogAlt'))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">${extra}`;
  };

  const footer = (cur, svc, logo, toContact = '#contact') => {
    const fl = (k, href, label) => `<li><a href="${href}"${k === cur ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
    const footSvc = services.map(o => `<li><a href="${L(`services/${o.slug}.html`)}"${o.slug === svc ? ' aria-current="page"' : ''}>${esc(svcT(o.slug).name)}</a></li>`).join('');
    return `<footer class="foot wrap">
  <div class="top">
    <div class="brand">${logo}<p>${esc(t('footer.tagline'))}</p>${xb('primary', toContact, t('header.letsTalk'), { sm: true })}</div>
    <div><p class="fh">${esc(t('footer.explore'))}</p><ul>${fl('home', L(''), t('nav.home'))}${fl('services', L('services.html'), t('nav.services'))}${fl('projects', L('projects.html'), t('nav.projects'))}${fl('prices', L('prices.html'), t('nav.prices'))}${fl('about', L('about.html'), t('nav.about'))}${fl('blog', L('blog.html'), t('nav.blog'))}${fl('', L('') + '#faq', t('nav.faq'))}</ul></div>
    <div><p class="fh">${esc(t('footer.services'))}</p><ul>${footSvc}</ul></div>
    <div><p class="fh">${esc(t('footer.studio'))}</p><ul>${fl('about', L('about.html'), t('nav.about'))}<li><a href="${toContact}">${esc(t('header.letsTalk'))}</a></li><li><a href="${contact.whatsapp}" target="_blank" rel="noopener">${esc(t('footer.whatsapp'))}</a></li><li><a href="${contact.tel}">${esc(contact.phone)}</a></li>${contact.social.map(([name, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${name}</a></li>`).join('')}<li>${esc(t('footer.city'))}</li></ul></div>
  </div>
  <div class="bottom"><span>${esc(t('footer.rights', { year: 2026 }))}</span><span class="legal-links">${['imprint', 'privacy'].map(k => `<a href="${L(k + '.html')}"${k === cur ? ' aria-current="page"' : ''}>${esc(t('footer.' + k))}</a>`).join('')}<button type="button" class="consent-open">${esc(t('consent.settings'))}</button></span></div>
</footer>`;
  };
  const consent = `<div class="consent" id="consent" role="dialog" aria-label="${esc(t('consent.label'))}" hidden>
  <p>${esc(t('consent.text'))} <a href="${L('privacy.html')}">${esc(t('consent.more'))}</a></p>
  <div class="consent-btns"><button type="button" data-consent="denied">${esc(t('consent.decline'))}</button><button type="button" data-consent="granted" class="on">${esc(t('consent.accept'))}</button></div>
</div>
<script src="/js/consent.js" data-ga="${GA4_ID}" defer></script>`;
  // Real Google reviews, kept quiet: three columns divided by fine lines. Reviews are shown in the visitor's language, with a note when translated.
  const reviewsBlock = () => {
    const items = reviews.map(r => {
      const meta = [t('reviews.source'), ...(loc.code === r.lang ? [] : [t(`reviews.from.${r.lang}`)])].map(esc).join(' · ');
      return `    <figure class="rv">
      <div class="rv-stars" role="img" aria-label="${esc(t('reviews.stars'))}">${'<i></i>'.repeat(5)}</div>
      <blockquote><p>${esc(t(`reviews.quotes.${r.id}`))}</p></blockquote>
      <figcaption><b>${esc(r.name)}</b><span>${meta}</span></figcaption>
    </figure>`;
    }).join('\n');
    return `<section class="reviews wrap" id="reviews" aria-labelledby="rv-title">
  <div class="rv-head"><h2 id="rv-title">${esc(t('reviews.titleA'))}<span class="o">${esc(t('reviews.titleB'))}</span></h2><p>${esc(t('reviews.intro'))}</p></div>
  <div class="rv-list">
${items}
  </div>
  <script src="/js/reviews.js" defer></script>
</section>`;
  };
  // The menu, shared by every page: numbered links, the services, contact details, and the emblem drawn in a fine line.
  const overlay = (cur, svc, onHome) => {
    const main = [['home', onHome ? '#top' : L(''), 'nav.home'], ['services', L('services.html'), 'nav.services'], ['projects', L('projects.html'), 'nav.projects'], ['prices', L('prices.html'), 'nav.prices'], ['about', L('about.html'), 'nav.about'], ['blog', L('blog.html'), 'nav.blog']];
    const poly = pl => 'M' + pl.map(p => p.join(' ')).join('L') + 'Z';
    const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;
    return `<div class="overlay" id="overlay" data-lenis-prevent>
  <div class="ov-bg" aria-hidden="true"><svg class="ov-mark" viewBox="0 0 ${GEO.W} ${GEO.H}" aria-hidden="true"><path pathLength="1" d="${poly(GEO.outer)}"/><path pathLength="1" d="${poly(GEO.hole)}"/><path class="tip" d="${poly(GEO.tip)}"/></svg></div>
  <nav class="ov-main" aria-label="${esc(t('nav.menu'))}">
${main.map(([k, href, key], i) => `    <a href="${href}"${k === cur ? ' aria-current="page"' : ''}><span><small aria-hidden="true">${pad(i + 1)}</small><i aria-hidden="true"></i><b>${esc(t(key))}</b></span></a>`).join('\n')}
  </nav>
  <div class="ov-svc">
    <p class="ov-label">${esc(t('nav.services'))}</p>
    <ul>${services.map(o => `<li><a href="${L(`services/${o.slug}.html`)}"${o.slug === svc ? ' aria-current="page"' : ''}>${esc(svcT(o.slug).name)}</a></li>`).join('')}</ul>
  </div>
  <div class="ov-foot">
    <div>${ext(contact.whatsapp, t('footer.whatsapp'))}<a href="${contact.tel}">${esc(contact.phone)}</a><a href="mailto:${contact.email}">${esc(contact.email)}</a></div>
    <div>${contact.social.map(([name, url]) => ext(url, name)).join('')}</div>
  </div>
</div>`;
  };

  function layout(pg, { title, desc, cur = '', svc = '', main, three = false, extraHead = '', extraScripts = '' }) {
    // "Let's Talk" scrolls to this page's contact section, or opens the homepage's one if there is none
    const toContact = main.includes('id="contact"') ? '#contact' : L('') + '#contact';
    const logoImg = (w, h) => `<a class="logo" href="${L('')}" aria-label="${esc(t('header.homeAria'))}"><img src="/assets/logo.svg" alt="StarNex Studio" width="${w}" height="${h}"></a>`;
    return `<!doctype html>
<html lang="${loc.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head(pg, { title, desc, extra: extraHead })}
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/css/service.css">
<link rel="stylesheet" href="/css/pages.css">
<link rel="stylesheet" href="/css/xbtn.css">
<link rel="stylesheet" href="/css/menu.css">
</head>
<body>
<header class="hdr" id="hdr">
  ${logoImg(113, 32)}
  <div class="right">
    ${langNav(pg)}
    ${xb('primary', toContact, t('header.letsTalk'), { sm: true })}
    ${menuBtn}
  </div>
</header>
${overlay(cur, svc)}

<main>
${main}
</main>

${footer(cur, svc, logoImg(106, 30), toContact)}

<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
${three ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n' : ''}${extraScripts}<script src="/js/service.js"></script>
${langJs}
${consent}
</body>
</html>
`;
  }

  const cta = (a = t('cta.titleA'), b = t('cta.titleB')) => `<section class="cta wrap" id="contact" aria-labelledby="cta-title">
  <h2 id="cta-title">${esc(a)}<span class="o">${esc(b)}</span></h2>
  <p>${esc(t('cta.text'))}</p>
  ${xb('primary', contact.whatsapp, t('cta.button'), { blank: true })}
  ${CALL}
</section>`;
  const hero = ({ shape, id, crumb, h1, lead, btn2, explore }) => `<section class="s-hero wrap" id="top" aria-labelledby="${id}">
  <canvas id="svcGL" data-shape="${shape}" aria-hidden="true"></canvas>
  <div class="copy" id="heroCopy">
    <div class="crumb"><i class="dot"></i>${crumb}</div>
    <h1 id="${id}">${esc(h1[0])}<span class="o">${esc(h1[1])}</span></h1>
    <p class="lead">${esc(lead)}</p>
    ${heroBtns(btn2[0], btn2[1])}
    <a class="explore" href="${explore}">${chev}${esc(t('hero.scroll'))}</a>
  </div>
</section>`;
  const crumb = (...items) => [`<a href="${L('')}">${esc(t('nav.home'))}</a>`, ...items].join('<i class="sep"></i>');
  const nextLink = (href, label, title) => `<a class="next wrap" href="${href}"><span><span class="lbl">${esc(label)}</span><span class="t">${esc(title)}</span></span><span class="arrow">${arrow}</span></a>`;
  const steps = (a, b, intro, list) => `<section class="steps wrap" aria-labelledby="steps-title">
  <div class="grid">
    <div class="side"><h2 id="steps-title">${esc(a)}<span class="o">${esc(b)}</span></h2><p>${esc(intro)}</p></div>
    <ol style="list-style:none;margin:0;padding:0">
${list.map(([x, d], k) => `      <li class="step"><span class="num">${pad(k + 1)}</span><div><h3>${esc(x)}</h3><p>${esc(d)}</p></div></li>`).join('\n')}
    </ol>
  </div>
</section>`;
  const grid = (id, titleHtml, intro, items) => `<section class="included wrap" id="${id}" aria-labelledby="${id}-title">
  <div class="sec-head"><h2 id="${id}-title">${titleHtml}</h2><p>${esc(intro)}</p></div>
  <div class="inc-grid">
${items.map(([x, d], k) => `    <article class="inc"><span class="n">${pad(k + 1)}</span><div><h3>${esc(x)}</h3><p>${esc(d)}</p></div></article>`).join('\n')}
  </div>
</section>`;
  const fit = (title, tags) => `<section class="fit wrap" aria-labelledby="fit-title">
  <h2 id="fit-title">${esc(title)}</h2>
  <div class="tags">${tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
</section>`;
  const faq = (title, intro, list, extraHead = '') => `<section class="faq wrap"${extraHead} aria-labelledby="faq-title">
  <div class="head"><h2 id="faq-title">${esc(title)}</h2><p>${esc(intro)}</p></div>
  <div class="qa">
${list.map(([q, a], k) => `    <details${k === 0 ? ' open' : ''}><summary>${esc(q)}${chev}</summary><div class="ans"><div><p>${esc(a)}</p></div></div></details>`).join('\n')}
  </div>
</section>`;
  const orgNode = () => ({
    '@type': 'ProfessionalService', '@id': ORG_ID, name: 'StarNex Studio', alternateName: 'StarNex', url: SITE + '/',
    logo: { '@type': 'ImageObject', url: SITE + '/assets/icons/icon-512.png', width: 512, height: 512 }, image: SITE + OG_IMAGE.path,
    description: t('meta.orgDesc'), telephone: contact.phone, email: contact.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Tirana', addressCountry: 'AL' },
    areaServed: { '@type': 'Country', name: 'Albania' }, sameAs: contact.social.map(([, url]) => url),
  });
  const webNode = () => ({ '@type': 'WebSite', '@id': WEB_ID, url: SITE + '/', name: 'StarNex Studio', alternateName: 'StarNex', publisher: { '@id': ORG_ID }, inLanguage: LOCALES.map(l => l.htmlLang) });
  // the trail matches the page's place in the site: home, then any parent, then the page
  const crumbs = (pg, trail) => ({ '@type': 'BreadcrumbList', '@id': SITE + L(pg.id) + '#breadcrumb', itemListElement: [[t('nav.home'), L('')], ...trail].map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + url })) });
  const graph = (...nodes) => ldTag({ '@context': 'https://schema.org', '@graph': nodes });
  return { reviewsBlock, consent, orgNode, webNode, crumbs, graph, t, L, svcT, CALL, xb, heroBtns, menuBtn, langNav, langJs, head, footer, overlay, layout, cta, hero, crumb, nextLink, steps, grid, fit, faq };
}

/* ---------- page builders ---------- */
const builders = {
  service(loc, P, pg) {
    const { t, L, svcT } = P;
    const i = services.findIndex(s => s.slug === pg.slug), s = services[i], c = svcT(s.slug);
    const next = services[(i + 1) % services.length];
    const work = s.work.map(slug => {
      const pr = projects.find(x => x.slug === slug);
      return `    <a class="rwork${pr.brand ? ' brand' : ''}" href="${L('projects.html')}#${slug}"><span class="shot">${projImg(pr, pr.brand ? t.entry('projects', slug).altPhoto : t('service.workAlt', { name: pr.name }), '(max-width:600px) 90vw, (max-width:960px) 45vw, 45vw')}</span><span class="rw-meta"><b>${esc(pr.name)}</b><span>${esc(c.work[slug])}</span></span></a>`;
    }).join('\n');
    const workSection = work ? `<section class="related wrap" aria-labelledby="rw-title">
  <div class="sec-head"><h2 id="rw-title">${esc(t('service.workTitleA'))}<span class="o">${esc(t('service.workTitleB'))}</span></h2>${xb('ghost', L('projects.html'), t('service.allProjects'), { icon: icRight })}</div>
  <div class="rgrid">
${work}
  </div>
</section>

` : '';
    const main = `${P.hero({ shape: s.shape, id: 'svc-title', crumb: `<a href="${L('services.html')}">${esc(t('nav.services'))}</a><i class="sep"></i><span>${pad(i + 1)} / ${pad(services.length)}</span>`, h1: c.split, lead: c.lead, btn2: ['#included', t('service.included')], explore: '#intro' })}

<section class="statement wrap" id="intro" aria-label="${esc(t('service.approach'))}">
  <span class="label">${esc(t('service.approach'))}</span>
  <p>${esc(c.statement)}</p>
</section>

${P.grid('included', esc(t('service.includedTitle')), c.incIntro, c.included)}

${P.fit(t('service.fitTitle'), c.fit)}

${P.steps(t('service.stepsTitleA'), t('service.stepsTitleB'), t('service.stepsIntro'), c.steps)}

${workSection}${P.faq(c.faqTitle, t('service.faqIntro'), c.faq)}

${P.nextLink(L(`services/${next.slug}.html`), t('service.next'), svcT(next.slug).name)}

${P.cta()}`;
    const ld = P.graph(P.crumbs(pg, [[t('nav.services'), L('services.html')], [c.name, L(pg.id)]]), { '@type': 'Service', '@id': SITE + L(pg.id) + '#service', name: c.name, description: c.lead, url: SITE + L(pg.id), inLanguage: loc.htmlLang, provider: { '@id': ORG_ID }, areaServed: { '@type': 'Country', name: 'Albania' } });
    return P.layout(pg, { title: t('meta.pageTitle', { page: c.seoTitle }), desc: c.lead, cur: 'services', svc: s.slug, main, three: true, extraHead: ld });
  },

services(loc, P, pg) {
    const { t, L, svcT } = P;
    const rows = services.map((s, i) => { const c = svcT(s.slug); return `  <a class="svc${i % 2 ? ' flip' : ''}" href="${L(`services/${s.slug}.html`)}"><h2 class="sl">${esc(c.name)}</h2><p class="sp">${esc(c.blurb)}<span class="go">${esc(t('home.viewService'))} ${goIc}</span></p></a>`; }).join('\n');
    const main = `${P.hero({ shape: 'website', id: 'all-title', crumb: P.crumb(`<span>${esc(t('servicesPage.title'))}</span>`), h1: [t('servicesPage.h1A'), t('servicesPage.h1B')], lead: t('servicesPage.lead'), btn2: ['#all', t('servicesPage.seeAll')], explore: '#all' })}

<section class="services wrap" id="all" aria-labelledby="all-title">
${rows}
</section>

${P.cta()}`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('servicesPage.seoTitle') }), desc: t('servicesPage.desc'), cur: 'services', main, three: true, extraHead: P.graph(P.crumbs(pg, [[t('servicesPage.title'), L(pg.id)]])) });
  },

  projects(loc, P, pg) {
    const { t, L, svcT } = P;
    const cases = projects.map((p, k) => {
      const c = t.entry('projects', p.slug) || {};
      return `
  <article class="case${k % 2 ? ' flip' : ''}" id="${p.slug}" aria-labelledby="${p.slug}-t">
    ${p.brand ? `<div class="media brandset">
      <span class="bphoto">${projImg(p, c.altPhoto, '(max-width:960px) 90vw, 50vw')}</span>
      <span class="blogo"><img src="/assets/projects/${p.brand.logo}-480.webp" alt="${esc(c.altLogo)}" width="480" height="320" loading="lazy" decoding="async"></span>
    </div>` : `<a class="media" href="${p.url}" target="_blank" rel="noopener" aria-label="${esc(t('projects.mediaAria', { name: p.name }))}">
      <span class="browser"><span class="bar"><i></i><i></i><i></i><span class="addr">${esc(p.host)}</span></span>${projImg(p, t('projects.altDesktop', { name: p.name }), '(max-width:960px) 90vw, 50vw')}</span>
      <span class="phone"><img src="/assets/projects/${p.slug}-m-360.webp" alt="${esc(t('projects.altPhone', { name: p.name }))}" width="360" height="779" loading="lazy" decoding="async"></span>
    </a>`}
    <div class="info">
      <span class="n">${pad(k + 1)} / ${pad(projects.length)}</span>
      <h2 id="${p.slug}-t">${esc(p.name)}</h2>
      <p class="meta">${esc(c.type)}<i></i>${esc(c.place)}</p>
      <p class="desc">${esc(c.desc)}</p>
      <ul class="chips" aria-label="${esc(t('projects.chipsAria'))}">${p.services.map(s => `<li><a href="${L(`services/${s}.html`)}">${esc(svcT(s).name)}</a></li>`).join('')}${c.lang ? `<li><span>${esc(c.lang)}</span></li>` : ''}</ul>
      ${p.url ? xb('ghost', p.url, t('projects.visit'), { icon: icUp, blank: true, cls: 'visit', aria: t('projects.visitAria', { name: p.name }) }) : ''}
    </div>
  </article>`;
    }).join('\n');
    const main = `${P.hero({ shape: 'work', id: 'work-title', crumb: P.crumb(`<span>${esc(t('projects.title'))}</span>`), h1: [t('projects.h1A'), t('projects.h1B')], lead: t('projects.lead'), btn2: ['#' + projects[0].slug, t('projects.seeWork')], explore: '#' + projects[0].slug })}

<section class="cases wrap" aria-label="${esc(t('projects.listAria'))}">
${cases}
</section>

${P.reviewsBlock()}

${P.cta(t('projects.ctaA'), t('projects.ctaB'))}`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('projects.seoTitle') }), desc: t('projects.desc'), cur: 'projects', main, three: true, extraHead: P.graph(P.crumbs(pg, [[t('projects.title'), L(pg.id)]])) });
  },

prices(loc, P, pg) {
    const { t, L, svcT } = P;
    const rows = services.map((s, i) => {
      const c = svcT(s.slug);
      const price = s.from
        ? `<span class="pr-price"><small>${esc(t('prices.from'))}</small><b>${esc(t('prices.amount', { n: s.from }))}</b></span>`
        : `<span class="pr-price ask"><b>${esc(t('prices.onRequest'))}</b></span>`;
      return `    <a class="prow" href="${L(`services/${s.slug}.html`)}"><span class="pr-n">${pad(i + 1)}</span><span class="pr-main"><h3>${esc(c.name)}</h3><span class="pr-b">${esc(c.blurb)}</span></span>${price}<span class="pr-go" aria-hidden="true">${icRight}</span></a>`;
    }).join('\n');
    const main = `${P.hero({ shape: 'price', id: 'prices-title', crumb: P.crumb(`<span>${esc(t('prices.title'))}</span>`), h1: [t('prices.h1A'), t('prices.h1B')], lead: t('prices.lead'), btn2: ['#list', t('prices.seePrices')], explore: '#list' })}

<section class="prices wrap" id="list" aria-labelledby="list-title">
  <div class="sec-head"><h2 id="list-title">${esc(t('prices.listA'))}<span class="o">${esc(t('prices.listB'))}</span></h2><p>${esc(t('prices.listIntro'))}</p></div>
  <div class="plist">
${rows}
  </div>
  <p class="pnote">${esc(t('prices.note'))}</p>
</section>

${P.steps(t('prices.stepsA'), t('prices.stepsB'), t('prices.stepsIntro'), t('prices.steps'))}

${P.cta(t('prices.ctaA'), t('prices.ctaB'))}`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('prices.seoTitle') }), desc: t('prices.desc'), cur: 'prices', main, three: true, extraHead: P.graph(P.crumbs(pg, [[t('prices.title'), L(pg.id)]])) });
  },

  about(loc, P, pg) {
    const { t, L } = P;
    const facts = t('about.facts').map(([v, l]) => [v.replace('{projects}', pad(projects.filter(p => !p.own).length)), l]);
    const main = `${P.hero({ shape: 'emblem', id: 'about-title', crumb: P.crumb(`<span>${esc(t('about.title'))}</span>`), h1: [t('about.h1A'), t('about.h1B')], lead: t('about.lead'), btn2: ['#intro', t('about.ourStory')], explore: '#intro' })}

<section class="statement wrap" id="intro" aria-label="${esc(t('about.ourStory'))}">
  <span class="label">${esc(t('about.ourStory'))}</span>
  <p>${esc(t('about.story'))}</p>
</section>

<section class="facts wrap" aria-label="${esc(t('about.factsAria'))}">
${facts.map(([v, l]) => `  <div class="fact"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('\n')}
</section>

${P.grid('values', `${esc(t('about.valuesTitleA'))}<span class="o">${esc(t('about.valuesTitleB'))}</span>`, t('about.valuesIntro'), t('about.values'))}

${P.fit(t('about.whoTitle'), t('about.who'))}

${P.steps(t('about.stepsTitleA'), t('about.stepsTitleB'), t('about.stepsIntro'), t('about.steps'))}

${P.nextLink(L('projects.html'), t('about.nextLabel'), t('about.nextTitle'))}

${P.cta()}`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('about.seoTitle') }), desc: t('about.desc'), cur: 'about', main, three: true, extraHead: P.graph(P.crumbs(pg, [[t('about.title'), L(pg.id)]])), extraScripts: '<script src="/js/emblem.js"></script>\n' });
  },

  blog(loc, P, pg) {
    const { t, L } = P;
    const list = sortedPosts.filter(p => has(loc.code, 'posts', p.slug));
    const cats = ['all', ...new Set(list.map(p => p.cat))];
    const [first, ...rest] = list;
    const card = (p, k, big) => { const c = t.entry('posts', p.slug); return `    <a class="pcard${big ? ' feat' : ''}" href="${L(`blog/${p.slug}.html`)}" data-cat="${p.cat}">
      ${cover(P, p, c, k, big)}
      <span class="pbody">${postMeta(P, p)}<span class="ptitle">${esc(c.title)}</span><span class="pex">${esc(c.excerpt)}</span><span class="pread"><i class="sh" aria-hidden="true"></i>${esc(t('blog.readArticle'))} ${icRight}</span></span>
    </a>`; };
    const main = `${P.hero({ shape: 'blog', id: 'blog-title', crumb: P.crumb(`<span>${esc(t('blog.title'))}</span>`), h1: [t('blog.h1A'), t('blog.h1B')], lead: t('blog.lead'), btn2: ['#posts', t('blog.allPosts')], explore: '#posts' })}

<section class="posts wrap" id="posts" aria-labelledby="posts-title">
  <div class="sec-head"><h2 id="posts-title">${esc(t('blog.latestA'))}<span class="o">${esc(t('blog.latestB'))}</span></h2>
    <div class="filters" role="group" aria-label="${esc(t('blog.filterAria'))}">${cats.map((c, k) => `<button type="button" class="fchip" data-f="${c}" aria-pressed="${k === 0}">${esc(c === 'all' ? t('blog.all') : t(`blog.cats.${c}`))}</button>`).join('')}</div>
  </div>
  <div class="pgrid">
${card(first, 0, true)}
${rest.map((p, k) => card(p, k + 1, false)).join('\n')}
  </div>
  <p class="pempty" hidden>${esc(t('blog.empty'))}</p>
</section>

${P.cta(t('blog.ctaA'), t('blog.ctaB'))}`;
    const filterJs = `<script>
document.querySelectorAll('.fchip').forEach(b => b.addEventListener('click', () => {
  const f = b.dataset.f; let shown = 0;
  document.querySelectorAll('.fchip').forEach(o => o.setAttribute('aria-pressed', o === b));
  document.querySelectorAll('.pcard').forEach(c => { const on = f === 'all' || c.dataset.cat === f; c.hidden = !on; if (on) shown++; });
  document.querySelector('.pempty').hidden = shown > 0;
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}));
</script>
`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('blog.seoTitle') }), desc: t('blog.desc'), cur: 'blog', main, three: true, extraHead: P.graph(P.crumbs(pg, [[t('blog.title'), L(pg.id)]])), extraScripts: filterJs });
  },

  post(loc, P, pg) {
    const { t, L } = P;
    const list = sortedPosts.filter(p => has(loc.code, 'posts', p.slug));
    const k = list.findIndex(p => p.slug === pg.slug), p = list[k], c = t.entry('posts', p.slug);
    const next = list[(k + 1) % list.length], nc = t.entry('posts', next.slug);
    const main = `<article class="post" aria-labelledby="post-title">
  <header class="post-hero wrap" id="top">
    <div class="crumb"><i class="dot"></i><a href="${L('blog.html')}">${esc(t('blog.title'))}</a><i class="sep"></i><span>${esc(t(`blog.cats.${p.cat}`))}</span></div>
    <h1 id="post-title">${esc(c.title)}</h1>
    <p class="post-lead">${esc(c.excerpt)}</p>
    <p class="post-meta"><span>${esc(t('blog.author'))}</span><i></i><time datetime="${p.date}">${esc(t.date(p.date))}</time><i></i><span>${esc(t('blog.readTime', { n: p.read }))}</span></p>
  </header>
  <div class="wrap">${cover(P, p, c, k, true)}</div>
  <div class="post-body wrap">
${c.body}  </div>
  <div class="post-foot wrap">${xb('ghost', L('blog.html'), t('blog.allPosts'), { icon: icLeft })}${xb('ghost', L(`services/${p.service}.html`), t('blog.relatedService', { name: P.svcT(p.service).name }), { icon: icRight })}</div>
</article>

${P.nextLink(L(`blog/${next.slug}.html`), t('blog.nextArticle'), nc.title)}

${P.cta()}`;
    const extra = `\n<meta property="article:published_time" content="${p.date}">` + P.graph(P.crumbs(pg, [[t('blog.title'), L('blog.html')], [c.title, L(pg.id)]]), { '@type': 'BlogPosting', '@id': SITE + L(pg.id) + '#article', headline: c.title, description: c.excerpt, datePublished: p.date, dateModified: p.date, inLanguage: loc.htmlLang, mainEntityOfPage: SITE + L(pg.id), image: SITE + OG_IMAGE.path, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID } });
    return P.layout(pg, { title: t('meta.pageTitle', { page: c.title }), desc: c.excerpt, cur: 'blog', main, extraHead: extra });
  },

  legal(loc, P, pg) {
    const { t, L } = P;
    const c = t.entry('legal', pg.doc), L10 = t.entry('legal', 'draftNote'), upd = t.entry('legal', 'updated');
    const fill = s => s.replace(/\{phone\}/g, `<a href="${contact.tel}">${esc(contact.phone)}</a>`);
    const main = `<article class="post legal" aria-labelledby="legal-title">
  <header class="post-hero wrap" id="top">
    <div class="crumb"><i class="dot"></i><span>${esc(c.title)}</span></div>
    <h1 id="legal-title">${esc(c.title)}</h1>
    <p class="post-lead">${esc(c.lead)}</p>
    <p class="post-meta"><time datetime="${legal.updated}">${esc(upd.replace('{date}', t.date(legal.updated)))}</time></p>
${pg.draft ? `    <p class="draft-note" role="note">${esc(L10)}</p>\n` : ''}  </header>
  <div class="post-body wrap">
${c.sections.map(([h, body]) => `    <section><h2>${esc(h)}</h2>${fill(body)}</section>`).join('\n')}
  </div>
</article>`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: c.title }), desc: c.desc, cur: pg.doc, main, extraHead: P.graph(P.crumbs(pg, [[c.title, L(pg.id)]])) });
  },

  404(loc, P, pg) {
    const { t, L } = P;
    const others = LOCALES.filter(o => o.code !== loc.code).map(o => `<a href="${pathFor(o, '404.html')}" hreflang="${o.htmlLang}" lang="${o.htmlLang}">${o.label}</a>`).join('<i class="sep"></i>');
    const main = `<section class="s-hero wrap" id="top" aria-labelledby="nf-title">
  <canvas id="svcGL" data-shape="emblem" aria-hidden="true"></canvas>
  <div class="copy" id="heroCopy">
    <div class="crumb"><i class="dot"></i><span>404</span></div>
    <h1 id="nf-title">${esc(t('notFound.h1A'))}<span class="o">${esc(t('notFound.h1B'))}</span></h1>
    <p class="lead">${esc(t('notFound.lead'))}</p>
    <div class="xbtns">${xb('primary', L(''), t('notFound.home'), { icon: icRight })}${xb('ghost', L('services.html'), t('notFound.services'), { icon: icRight })}</div>
    <p class="nf-other"><span>${esc(t('notFound.otherLangs'))}</span> ${others}</p>
  </div>
</section>`;
    return P.layout(pg, { title: t('meta.pageTitle', { page: t('notFound.title') }), desc: t('notFound.desc'), main, three: true, extraScripts: '<script src="/js/emblem.js"></script>\n' });
  },

  home(loc, P, pg) { return buildHome(loc, P, pg); },
};
const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date));
const cover = (P, p, c, k, big) => `<span class="cover${big ? ' big' : ''}" aria-hidden="true"><span class="cv-n">${pad(k + 1)}</span><span class="cv-w">${esc(c.cover)}</span><i class="cv-sh"></i><span class="cv-cat">${esc(P.t(`blog.cats.${p.cat}`))}</span></span>`;
const postMeta = (P, p) => `<span class="pmeta"><span>${esc(P.t(`blog.cats.${p.cat}`))}</span><i></i><time datetime="${p.date}">${esc(P.t.date(p.date))}</time><i></i><span>${esc(P.t('blog.readTime', { n: p.read }))}</span></span>`;

/* ---------- homepage: the original design, with its words taken from content/<locale>/home.mjs ---------- */
function buildHome(loc, P, pg) {
  const { t, L, svcT } = P;
  const H = content[loc.code].home;
  const need = (obj, key) => { const v = obj[key]; if (v == null || v === '') { missingKeys.add(`${loc.code}: home.${key}`); if (!DEV) throw new Error(`[i18n] missing "home.${key}" in ${loc.code}`); return `⟦missing:${loc.code}:home.${key}⟧`; } return v; };
  const hx = key => need(H, key);
  let h = home;
  const must = (from, to) => { if (!(from instanceof RegExp ? from.test(h) : h.includes(from))) throw new Error('home source changed, missing: ' + from); h = h.replace(from, to); };

  // head: language, title, description, canonical + hreflang, Open Graph, structured data
  const ld = P.graph(P.webNode(), P.orgNode());
  must(/^<!doctype html><html><head>/, `<!doctype html><html lang="${loc.htmlLang}"><head>`);
  must('</head><body>\n<title>StarNex Studio</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="StarNex Studio — web design and development in Tirana, Albania.">',
    `\n${P.head(pg, { title: t('meta.homeTitle'), desc: t('meta.homeDesc'), extra: ld })}`);
  must('\n<header class="hdr" id="hdr">', '\n<link rel="stylesheet" href="/css/menu.css">\n</head><body>\n<header class="hdr" id="hdr">');
  must('<style>\n/* Layout: a black studio.', '<link rel="stylesheet" href="/css/xbtn.css">\n<style>\n/* Layout: a black studio.');
  must('/* ---------- process: pinned headline', fs.readFileSync(path.join(HERE, 'home-extra.css'), 'utf8') + '\n/* ---------- process: pinned headline');

  // header, menu and footer
  must('<a class="logo" href="#top" aria-label="StarNex Studio, home">', `<a class="logo" href="#top" aria-label="${esc(t('header.homeAria'))}">`);
  must(/<div class="right">[\s\S]*?<\/button>\n  <\/div>/, `<div class="right">\n    ${P.langNav(pg)}\n    ${xb('primary', '#contact', t('header.letsTalk'), { sm: true })}\n    ${P.menuBtn}\n  </div>`);
  must(/<div class="overlay" id="overlay">[\s\S]*?<div class="side">[\s\S]*?<\/div>\n<\/div>/, () => P.overlay('home', '', true));
  must(/<footer class="foot wrap">[\s\S]*?<\/footer>/, P.footer('home', '', `<a class="logo" href="#top" aria-label="${esc(t('header.topAria'))}">${logoSvg}</a>`));

  // sections, generated with the original markup and put in a logical order
  const meta = hx('heroMeta');
  const sec = {
    top: `<section class="hero" id="top" aria-labelledby="hero-text">
  <canvas id="heroGL" aria-hidden="true"></canvas>
  <div class="copy wrap" id="heroCopy">
    <div class="hero-text"><h1 id="hero-text">${hx('heroHtml')}</h1> <p>${esc(hx('heroLead'))}</p></div>
    ${P.heroBtns('#process', hx('heroProcess'))}
    <div class="meta">
      <span><i class="dot"></i>${esc(meta[0])}</span><i class="sep"></i>
      <span>${esc(meta[1])}</span><i class="sep"></i>
      <span>${esc(meta[2])}</span>
    </div>
    <a class="explore" href="#services"><svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>${esc(t('hero.scroll'))}</a>
  </div>
</section>`,
    services: `<section class="services wrap" id="services" aria-label="${esc(hx('servicesAria'))}">
${services.slice(0, 5).map((s, i) => { const c = svcT(s.slug); return `  <a class="svc${i % 2 ? ' flip' : ''}" href="${L(`services/${s.slug}.html`)}"><h2 class="sl">${esc(c.name)}</h2><p class="sp">${esc(c.blurb)}<span class="go">${esc(t('home.viewService'))} ${goIc}</span></p></a>`; }).join('\n')}
  <div class="svc-all">${xb('ghost', L('services.html'), t('home.allServices'), { icon: icRight })}</div>
</section>`,
    why: `<section class="why glow wrap" id="why" aria-labelledby="why-title">
  <h2 class="sec-title" id="why-title">${esc(hx('whyTitle'))}</h2>
  <div class="grid">
    <div class="acc" id="acc">
${hx('why').map(([q, a], k) => `      <details${k ? '' : ' open'}><summary>${esc(q)}${accIc}</summary><div class="ans"><div><p>${esc(a)}</p></div></div></details>`).join('\n')}
    </div>
    <canvas id="whyGL" aria-hidden="true"></canvas>
  </div>
</section>`,
    work: `<section class="work wrap" id="work" aria-labelledby="work-title">
  <div class="whead"><h2 id="work-title">${esc(t('home.workTitleA'))}<span class="o">${esc(t('home.workTitleB'))}</span></h2>${xb('ghost', L('projects.html'), t('home.allProjects'), { icon: icRight })}</div>
  <div class="wgrid">
${projects.filter(p => !p.own).map(p => { const c = t.entry('projects', p.slug) || {}; return `    <a class="wcard${p.brand ? ' wide' : ''}" href="${L('projects.html')}#${p.slug}"><span class="shot">${projImg(p, p.brand ? c.altPhoto : t('home.cardAlt', { name: p.name }), '(max-width:760px) 90vw, 45vw')}</span><span class="wmeta"><span><b>${esc(p.name)}</b><span>${esc(c.type)} · ${esc(c.place)}</span></span><span class="wgo" aria-hidden="true">${icRight}</span></span></a>`; }).join('\n')}
  </div>
</section>`,
    reviews: P.reviewsBlock(),
    process: `<section class="process wrap" id="process" aria-labelledby="proc-title">
  <div class="stick"><h2 class="big" id="proc-title">${esc(hx('processTitleA'))}<span class="o">${esc(hx('processTitleB'))}</span></h2></div>
  <div class="cards">
${hx('process').map(([x, tag], k) => `    <article class="card"><canvas data-art="${['sketch', 'design', 'code', 'live'][k]}"></canvas><div class="cap"><h3>${esc(x)}</h3><p class="tag">${esc(tag)}</p></div></article>`).join('\n')}
  </div>
</section>`,
    faq: P.faq(hx('faqTitle'), hx('faqIntro'), hx('faq'), ' id="faq"'),
    contact: `<section class="cta glow wrap" id="contact" aria-labelledby="cta-title">
  <h2 id="cta-title">${esc(t('cta.titleA'))}<span class="o">${esc(t('cta.titleB'))}</span></h2>
  <p style="color:rgba(255,255,255,.8);max-width:44ch;position:relative">${esc(t('cta.text'))}</p>
  ${xb('primary', contact.whatsapp, t('cta.button'), { blank: true })}
  ${P.CALL}
</section>`,
  };
  const order = ['top', 'services', 'why', 'work', 'reviews', 'process', 'faq', 'contact'];
  const m0 = h.indexOf('<main>\n') + 7, m1 = h.indexOf('\n</main>');
  if (m0 < 7 || m1 < 0) throw new Error('home source changed: <main> not found');
  h = h.slice(0, m0) + order.map(k => sec[k]).join('\n\n') + h.slice(m1);

  // words drawn inside the animated process cards
  const art = hx('art');
  for (const [en, key] of [["'spotlit emblem'", 'sketchNote'], ["'Let’s Talk'", 'previewTalk'], ["'StarNex Studio is a web design and development studio in Tirana.'", 'previewHero'], ["'CONTACT'", 'previewContact'], ["'PROCESS'", 'previewProcess']]) must(`fillText(${en},`, `fillText(${JSON.stringify(need(art, key))},`);

  h = h.replace('</body>', () => `${P.langJs}\n${P.consent}\n</body>`);
  return h;
}

/* ---------- write every page in every language ---------- */
for (const d of ['en', 'de']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
const built = [], pageHash = {};
const STAMP_FILE = path.join(HERE, 'lastmod.json'), stamps = fs.existsSync(STAMP_FILE) ? JSON.parse(fs.readFileSync(STAMP_FILE, 'utf8')) : {}, today = new Date().toISOString().slice(0, 10);
for (const loc of LOCALES) {
  const P = parts(loc);
  for (const pg of pages) {
    if (!pg.locales.includes(loc.code)) continue;
    const html = builders[pg.kind](loc, P, pg);
    const file = loc.prefix + (pg.id || 'index.html');
    write(file, localize(html));
    built.push(file);
    pageHash[file] = crypto.createHash('sha1').update((html.match(/<title>[\s\S]*?<\/title>/) || [''])[0] + (html.match(/<main[\s\S]*<\/main>/) || [html])[0]).digest('hex');
  }
}

/* ---------- sitemap + robots ---------- */
// lastmod moves only when a page's own title or main content changes
for (const [file, hash] of Object.entries(pageHash)) if (stamps[file]?.hash !== hash) stamps[file] = { hash, date: today };
if (!DEV) fs.writeFileSync(STAMP_FILE, JSON.stringify(stamps, null, 0).replace(/\},/g, '},\n') + '\n');
const urlEntry = pg => pg.locales.map(c => {
  const o = LOCALES.find(x => x.code === c);
  const alts = [...pg.locales.map(a => { const x = LOCALES.find(y => y.code === a); return `    <xhtml:link rel="alternate" hreflang="${x.htmlLang}" href="${SITE + pathFor(x, pg.id)}"/>`; }),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + pathFor(LOCALES.find(x => x.code === DEFAULT_LOCALE), pg.id)}"/>`];
  return `  <url>\n    <loc>${SITE + pathFor(o, pg.id)}</loc>\n    <lastmod>${stamps[o.prefix + (pg.id || 'index.html')].date}</lastmod>\n${alts.join('\n')}\n  </url>`;
}).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.filter(pg => !pg.noindex && !pg.draft).map(urlEntry).join('\n')}
</urlset>
`);
fs.copyFileSync(path.join(HERE, 'robots.txt'), path.join(OUT, 'robots.txt'));
write('CNAME', new URL(SITE).hostname + '\n'); // keeps the custom domain attached on GitHub Pages
write('site.webmanifest', JSON.stringify({ name: 'StarNex Studio', short_name: 'StarNex', start_url: '/', scope: '/', display: 'standalone', background_color: '#000000', theme_color: '#000000', lang: 'sq', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2) + '\n');

console.log(`built ${built.length} pages (${LOCALES.map(l => `${l.code}: ${built.filter(f => (l.prefix ? f.startsWith(l.prefix) : !/^(en|de)\//.test(f))).length}`).join(', ')})`);
if (missingKeys.size) console.log(`missing translations (${missingKeys.size}):\n  ` + [...missingKeys].join('\n  '));
