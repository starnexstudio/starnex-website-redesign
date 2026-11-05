// Usage: node shot.mjs <out.png> <path> [w] [h] [scrollToSelector]
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/User/Downloads/LS_Transport/package.json');
const { chromium } = require('playwright');
const [out, p, w = 1440, h = 900, sel] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const mob = Number(w) < 700;
const pg = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: mob, hasTouch: mob });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://localhost:5178' + p, { waitUntil: 'networkidle' }); await pg.waitForTimeout(3200);
if (sel) { await pg.locator(sel).first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(1800); }
await pg.screenshot({ path: out });
console.log('errors', errs);
await b.close();
