// Opens every page in every language on desktop and phone (needs `node serve.mjs` running) and reports:
// script errors, sideways page scroll, text that overflows its box, and a broken language switch.
//   node check-layout.mjs [screenshotDir]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { LOCALES, pathFor } from './lib/i18n.mjs';
import { services, posts } from './data.mjs';
const require = createRequire('C:/Users/User/Downloads/LS_Transport/package.json'); // Playwright lives in another local project
const { chromium } = require('playwright');
const BASE = 'http://localhost:' + (process.env.PORT || 5178), SHOTS = process.argv[2];
const ids = ['', ...services.map(s => `services/${s.slug}.html`), 'projects.html', 'about.html', 'blog.html', ...posts.map(p => `blog/${p.slug}.html`), 'imprint.html', 'privacy.html', '404.html'];
const problems = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [vp, w, h, mob] of [['desktop', 1440, 900, false], ['phone', 360, 780, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const page = await ctx.newPage();
  let errs = []; page.on('pageerror', e => errs.push(e.message));
  for (const l of LOCALES) for (const id of ids) {
    const url = pathFor(l, id); errs = [];
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    // walk the page so scroll-triggered sections reveal, then measure
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const out = [];
      const sx = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      if (sx > 1) out.push(`page scrolls sideways by ${sx}px`);
      const sel = 'h1, h2, h3, .xbtn, .lang a, .fchip, .tag, .chips li, .crumb, .next .t, .pread, .cv-w, .wmeta b, .menu-btn .lbl, .step h3, .inc h3';
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.overlay,[hidden],.cover')) continue;
        const b = el.getBoundingClientRect(); if (!b.width) continue;
        const txt = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible') out.push(`clipped: ${el.tagName.toLowerCase()}.${el.className} "${txt}"`);
        // titles that GSAP slides sideways on scroll sit inside rows that clip them, so skip moving elements
        const moving = el.style.transform && el.style.transform !== 'none';
        if (!moving && (b.right > innerWidth + 1 || b.left < -1)) out.push(`off-screen: ${el.tagName.toLowerCase()}.${el.className} "${txt}" (${Math.round(b.left)}–${Math.round(b.right)})`);
        // a single word wider than its line (would be cut by overflow:hidden parents)
        if (/^H[1-3]$/.test(el.tagName)) { const range = document.createRange(); range.selectNodeContents(el); if (!(el.style.transform && el.style.transform !== 'none')) for (const rc of range.getClientRects()) if (rc.right > innerWidth + 1) { out.push(`heading line past the edge: "${txt}"`); break; } }
      }
      return [...new Set(out)];
    });
    for (const p of r) problems.push(`${vp} ${url}: ${p}`);
    for (const e of errs) problems.push(`${vp} ${url}: script error ${e}`);
    if (SHOTS && (id === '' || id === 'services/cms-automation.html' || id === 'services/digital-menus.html' || id === 'blog.html')) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/${vp}-${l.code}-${(id || 'home').replace(/[/.]/g, '_')}.png` });
    }
  }
  // switching language from a nested page keeps the page and the #section
  for (const [from, to] of [['/services/seo.html#faq', 'de'], ['/de/blog/website-speed.html', 'en'], ['/en/projects.html', 'sq']]) {
    await page.goto(BASE + from, { waitUntil: 'networkidle' });
    const want = pathFor(LOCALES.find(l => l.code === to), from.replace(/^\/(en|de)\//, '/').slice(1).split('#')[0]) + (from.includes('#') ? '#' + from.split('#')[1] : '');
    await Promise.all([page.waitForURL('**' + want.split('#')[0] + '*'), (async () => { await page.click('.lang-btn'); await page.locator(`.lang a[lang="${to}"]`).first().click(); })()]);
    const got = new URL(page.url()); if (got.pathname + got.hash !== want) problems.push(`${vp} switch ${from} -> ${to}: landed on ${got.pathname + got.hash}, expected ${want}`);
    const lang = await page.getAttribute('html', 'lang'); if (lang !== to) problems.push(`${vp} switch to ${to}: html lang is ${lang}`);
  }
  // the menu opens and closes, and its label changes language
  await page.goto(BASE + '/de/', { waitUntil: 'networkidle' });
  await page.click('#menuBtn'); await page.waitForTimeout(500);
  if (await page.getAttribute('#menuBtn', 'aria-expanded') !== 'true') problems.push(`${vp} /de/: menu did not open`);
  await page.click('#menuBtn'); await page.waitForTimeout(500);
  if (await page.getAttribute('#menuBtn', 'aria-expanded') !== 'false') problems.push(`${vp} /de/: menu did not close`);
  // keyboard: Tab reaches the switcher and the focused link is visibly outlined
  await page.goto(BASE + '/en/about.html', { waitUntil: 'networkidle' });
  let found = false;
  for (let k = 0; k < 6 && !found; k++) { await page.keyboard.press('Tab'); found = await page.evaluate(() => document.activeElement.classList.contains('lang-btn') && getComputedStyle(document.activeElement).outlineStyle !== 'none'); }
  if (found) { await page.keyboard.press('Enter'); await page.keyboard.press('Tab'); const inMenu = await page.evaluate(() => !!document.activeElement.closest('.lang-menu') && getComputedStyle(document.querySelector('.lang-menu')).visibility === 'visible'); if (!inMenu) problems.push(`${vp}: Enter on the globe did not open the language list`); await page.keyboard.press('Escape'); const closed = await page.evaluate(() => !document.querySelector('.hdr .lang').classList.contains('open') && document.activeElement.classList.contains('lang-btn')); if (!closed) problems.push(`${vp}: Escape did not close the language list`); }
  if (!found) problems.push(`${vp}: switcher not reachable by keyboard with a visible focus ring`);
  await ctx.close();
}
await browser.close();
console.log(`opened ${ids.length * LOCALES.length * 2} page views`);
console.log(problems.length ? `problems (${problems.length}):\n  ` + problems.join('\n  ') : 'no layout, script or switching problems');
process.exit(problems.length ? 1 : 0);
