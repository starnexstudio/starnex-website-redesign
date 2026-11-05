// Lab speed check on a throttled phone profile (needs `node serve.mjs`). Not real-user data.
//   node check-speed.mjs
// Profile: 412×823 phone, 4× CPU slowdown, 1.6 Mbps down, 750 Kbps up, 150 ms latency, empty cache.
// serve.mjs compresses like GitHub Pages, but runs on this machine: treat these numbers as a comparison, not as real-user data.
import { createRequire } from 'node:module';
const require = createRequire(process.env.PLAYWRIGHT_FROM || 'C:/Users/User/Downloads/LS_Transport/package.json');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:' + (process.env.PORT || 5178);
const pages = ['/', '/services/development.html', '/projects.html', '/blog/before-you-start-a-website.html', '/de/'];
const browser = await chromium.launch({ channel: 'chrome' });
console.log('page'.padEnd(42), 'FCP'.padStart(6), 'LCP'.padStart(6), 'CLS'.padStart(6), 'TBT'.padStart(6), 'KB'.padStart(6), 'reqs'.padStart(5), 'tap'.padStart(6), ' LCP element');
for (const url of pages) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0, reqs = 0;
    cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; });
    await page.addInitScript(() => {
      try { localStorage.setItem('sn_consent', 'denied'); } catch (e) {}
      window.__v = { lcp: 0, el: '', cls: 0, tbt: 0 };
      new PerformanceObserver(l => { for (const e of l.getEntries()) { __v.lcp = e.startTime; __v.el = e.element ? e.element.tagName + (e.element.id ? '#' + e.element.id : '') : ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) __v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) __v.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
      __v.tap = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId) __v.tap = Math.max(__v.tap, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    await page.goto(BASE + url, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(6000);
    const tbtLoad = await page.evaluate(() => __v.tbt);
    await page.tap('#menuBtn'); await page.waitForTimeout(1200);
    const v = await page.evaluate(() => ({ ...__v, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0 }));
    runs.push({ ...v, tbt: tbtLoad, bytes, reqs });
    await ctx.close();
  }
  const med = k => runs.map(r => r[k]).sort((a, b) => a - b)[1];
  console.log(url.padEnd(42), String(Math.round(med('fcp'))).padStart(6), String(Math.round(med('lcp'))).padStart(6), med('cls').toFixed(3).padStart(6), String(Math.round(med('tbt'))).padStart(6), String(Math.round(med('bytes') / 1024)).padStart(6), String(med('reqs')).padStart(5), String(Math.round(med('tap'))).padStart(6), ' ' + runs[1].el);
}
await browser.close();
