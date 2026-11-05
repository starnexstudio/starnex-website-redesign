// Behaviour checks in a real browser (needs `node serve.mjs`). Nothing leaves this machine:
// starnexstudio.com is answered from the local server, and every request to Google or WhatsApp is stopped and only counted.
//   node check-flows.mjs
import { createRequire } from 'node:module';
const require = createRequire(process.env.PLAYWRIGHT_FROM || 'C:/Users/User/Downloads/LS_Transport/package.json');
const { chromium } = require('playwright');
const LOCAL = 'http://localhost:' + (process.env.PORT || 5178);
const browser = await chromium.launch({ channel: 'chrome' });
let fails = 0;
const ok = (c, m, extra = '') => { console.log(`${c ? 'pass' : 'FAIL'}  ${m}${extra ? '  ' + extra : ''}`); if (!c) fails++; };

async function session(opts = {}) {
  const ctx = await browser.newContext(opts);
  const seen = { gtag: 0, collect: 0, other: [] };
  await ctx.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'starnexstudio.com') {
      const r = await fetch(LOCAL + u.pathname + u.search, { redirect: 'manual' });
      return route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'text/plain' }, body: Buffer.from(await r.arrayBuffer()) });
    }
    if (u.hostname === 'localhost') return route.continue();
    if (u.hostname.endsWith('googletagmanager.com')) seen.gtag++;
    else if (/google-analytics|analytics\.google/.test(u.hostname)) seen.collect++;
    else seen.other.push(u.hostname);
    return route.abort();
  });
  return { ctx, seen, page: await ctx.newPage() };
}
const PROD = 'https://starnexstudio.com/';

/* consent */
{
  const { ctx, page, seen } = await session({ viewport: { width: 1280, height: 800 } });
  await page.goto(PROD, { waitUntil: 'load' });
  ok(await page.locator('#consent').isVisible(), 'consent bar shows on the first visit');
  ok(seen.gtag === 0, 'no Google request before a choice');
  ok(!(await ctx.cookies()).some(c => c.name.startsWith('_ga')), 'no analytics cookie before a choice');
  await page.click('[data-consent="denied"]');
  ok(!(await page.locator('#consent').isVisible()), 'decline closes the bar');
  await page.goto(PROD + 'en/', { waitUntil: 'load' });
  ok(!(await page.locator('#consent').isVisible()) && seen.gtag === 0, 'decline is remembered on the next page, still no Google request');
  await page.locator('.consent-open').scrollIntoViewIfNeeded();
  await page.click('.consent-open');
  ok(await page.locator('#consent').isVisible(), 'footer link reopens the choice');
  ok(await page.evaluate(() => document.activeElement.closest('#consent') !== null), 'focus moves into the bar');
  await page.click('[data-consent="granted"]');
  await page.waitForTimeout(200);
  ok(seen.gtag === 1, 'accept loads Google Analytics once', `requests: ${seen.gtag}`);
  const cfg = await page.evaluate(() => [...dataLayer].filter(a => a[0] === 'config').map(a => a[1]));
  ok(cfg.length === 1 && cfg[0] === 'G-1RVYRLNBYY', 'one config call for the existing property (one automatic page view)', JSON.stringify(cfg));
  await page.evaluate(() => document.querySelector('a[href^="https://wa.me/"]').addEventListener('click', e => e.preventDefault()));
  await page.evaluate(() => document.querySelector('a[href^="https://wa.me/"]').click());
  const ev = await page.evaluate(() => [...dataLayer].filter(a => a[0] === 'event').map(a => [a[1], a[2]]));
  ok(ev.length === 1 && ev[0][0] === 'contact_click' && JSON.stringify(ev[0][1]) === '{"method":"whatsapp"}', 'contact click sends only the method', JSON.stringify(ev));
  await page.goto(PROD + 'de/', { waitUntil: 'load' });
  ok(seen.gtag === 2 && !(await page.locator('#consent').isVisible()), 'accept is remembered on the next page');
  await ctx.close();
}
{
  const { ctx, page, seen } = await session({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(LOCAL + '/', { waitUntil: 'load' });
  await page.click('[data-consent="granted"]');
  ok(seen.gtag === 0, 'analytics stays off on any other host, even after accept');
  await ctx.close();
}

/* pages */
{
  const { ctx, page } = await session({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); else if (/GSAP target/.test(m.text())) errs.push(m.text()); });
  for (const u of ['/', '/en/', '/de/', '/services/development.html', '/de/services/development.html', '/projects.html', '/about.html', '/blog.html', '/blog/website-speed.html', '/privacy.html', '/imprint.html']) {
    await page.goto(LOCAL + u, { waitUntil: 'load' }); await page.waitForTimeout(600);
    const dead = await page.evaluate(() => [...document.querySelectorAll('.cta a.primary, section.cta a.xbtn')].filter(a => !/^https:\/\/wa\.me\//.test(a.href)).length);
    if (dead) ok(false, `${u}: contact button does not open WhatsApp`);
  }
  ok(errs.length === 0, 'no script errors or GSAP warnings on the sampled pages', errs.slice(0, 3).join(' | '));
  for (const [u, code] of [['/nope.html', 404], ['/de/nope.html', 404], ['/en/', 200], ['/sitemap.xml', 200], ['/robots.txt', 200], ['/favicon.ico', 200], ['/site.webmanifest', 200], ['/images/og-image.jpg', 200], ['/_build/data.mjs', 404]]) {
    const r = await fetch(LOCAL + u, { redirect: 'manual' });
    ok(r.status === code, `${u} answers ${code}`, r.status === code ? '' : `got ${r.status}`);
  }
  /* keyboard */
  await page.goto(LOCAL + '/en/', { waitUntil: 'load' });
  await page.click('[data-consent="denied"]');
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, cls: a.className, o: getComputedStyle(a).outlineStyle }; });
  ok(first.tag === 'A' || first.tag === 'BUTTON', 'Tab reaches a control first', JSON.stringify(first));
  const btn = page.locator('#menuBtn'); await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok((await btn.getAttribute('aria-expanded')) === 'true', 'menu opens from the keyboard');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const closed = (await btn.getAttribute('aria-expanded')) === 'false';
  ok(closed, 'Escape closes the menu');
  if (!closed) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
  const lang = page.locator('.lang-btn'); await lang.focus(); await page.keyboard.press('Enter');
  ok((await lang.getAttribute('aria-expanded')) === 'true', 'language list opens from the keyboard');
  await page.keyboard.press('Escape');
  await ctx.close();
}

/* without motion, without JavaScript */
{
  const { ctx, page } = await session({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(LOCAL + '/', { waitUntil: 'load' });
  ok(await page.locator('#hero-text').isVisible(), 'reduced motion: hero text visible');
  await ctx.close();
  const b = await session({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  for (const u of ['/', '/services/seo.html', '/blog/website-speed.html']) {
    await b.page.goto(LOCAL + u, { waitUntil: 'load' });
    const h = await b.page.locator('h1').first().boundingBox(), o = await b.page.evaluate(() => getComputedStyle(document.querySelector('h1')).opacity);
    ok(h && h.height > 0 && o === '1', `no JavaScript: ${u} shows its heading`);
  }
  ok(!(await b.page.locator('#consent').isVisible()), 'no JavaScript: no consent bar, and no analytics');
  await b.ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
