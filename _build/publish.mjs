// Collects the public files into dist/, the only folder a host should serve. _build, _docs and .github stay out.
//   node build.mjs && node publish.mjs
// STARNEX_ENV=preview also marks every page noindex and opens robots.txt so crawlers can read that mark.
// Anything else, including unset, is production: the pages go out exactly as built.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PREVIEW = process.env.STARNEX_ENV === 'preview';
const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

const dirs = ['assets', 'blog', 'css', 'de', 'en', 'images', 'js', 'services'];
const files = ['favicon.ico', 'robots.txt', 'sitemap.xml', 'site.webmanifest'];
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
if (!pages.includes('index.html')) throw new Error('index.html is missing: run build.mjs first');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
for (const d of dirs) fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true });
for (const f of [...files, ...pages]) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));

let marked = 0;
if (PREVIEW) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(DIST).filter(x => x.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8').replace(/<meta name="robots"[^>]*>\s*/gi, '');
    if (!/<head[^>]*>/i.test(html)) throw new Error('no <head> in ' + f);
    fs.writeFileSync(f, html.replace(/<head[^>]*>/i, m => m + NOINDEX));
    marked++;
  }
  fs.writeFileSync(path.join(DIST, 'robots.txt'), '# Preview: every page carries noindex, so crawlers must be able to read it.\nUser-agent: *\nAllow: /\n');
}
console.log(`dist ready: ${pages.length} root pages, ${PREVIEW ? `preview, ${marked} pages marked noindex` : 'production'}`);
