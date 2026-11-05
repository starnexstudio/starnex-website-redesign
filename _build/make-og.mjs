// One-off: the sharing image at /images/og-image.jpg, taken from the real homepage hero (needs `node serve.mjs`).
// Playwright and sharp are borrowed from another local project, as in make-assets.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(process.env.PLAYWRIGHT_FROM || 'C:/Users/User/Downloads/LS_Transport/package.json');
const { chromium } = require('playwright'), sharp = require('sharp');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await page.addInitScript(() => { try { localStorage.setItem('sn_consent', 'denied'); } catch (e) {} });
await page.goto(`http://localhost:${process.env.PORT || 5178}/`, { waitUntil: 'load' });
await page.addStyleTag({ content: '#heroCopy,.hdr,#consent{visibility:hidden!important}' });
await page.waitForTimeout(5000);
const buf = await page.screenshot({ type: 'png' });
await browser.close();
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
await sharp(buf).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'images/og-image.jpg'));
console.log('og-image.jpg', Math.round(fs.statSync(path.join(OUT, 'images/og-image.jpg')).size / 1024) + 'KB');
