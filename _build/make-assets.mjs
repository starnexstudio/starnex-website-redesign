// One-off asset generator. The results are committed, so a normal `node build.mjs` does not need it.
//   node make-assets.mjs                  icons from the logo geometry in home-source.html, plus resized project images
//   node make-assets.mjs path/to/icon.png icons from a supplied square image instead (keeps it exactly as supplied)
// Needs sharp. It is borrowed from another local project: set SHARP_FROM to any package.json whose project has sharp.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(process.env.SHARP_FROM || 'C:/Users/User/Downloads/LS_Transport/package.json');
const sharp = require('sharp');
const HERE = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(HERE, '..');
const ICONS = path.join(OUT, 'assets/icons'), PROJ = path.join(OUT, 'assets/projects');
fs.mkdirSync(ICONS, { recursive: true });

/* ---------- icons ---------- */
const home = fs.readFileSync(path.join(HERE, 'home-source.html'), 'utf8');
const G = JSON.parse(home.match(/const GEO = (\{.*?\});\n/)[1]);
const d = pl => 'M' + pl.map(p => p.join(' ')).join('L') + 'Z';
// the emblem from the logo, white with its red tip on black, the dark version on the brand sheet
const emblemSvg = (size, pad, radius) => {
  const k = (size - pad * 2) / Math.max(G.W, G.H), x = (size - G.W * k) / 2, y = (size - G.H * k) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#000"/><g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})"><path fill="#fff" fill-rule="evenodd" d="${d(G.outer)}${d(G.hole)}"/><path fill="#E0002B" d="${d(G.tip)}"/></g></svg>`;
};
const supplied = process.argv[2];
const icon = async (size, pad, radius) => supplied
  ? sharp(supplied).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer()
  : sharp(Buffer.from(emblemSvg(size, pad, radius)), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
const png = {
  48: await icon(48, 5, 9), 180: await icon(180, 20, 0), 192: await icon(192, 22, 34), 512: await icon(512, 60, 90),
};
fs.writeFileSync(path.join(ICONS, 'favicon-48.png'), png[48]);
fs.writeFileSync(path.join(ICONS, 'apple-touch-icon.png'), png[180]);
fs.writeFileSync(path.join(ICONS, 'icon-192.png'), png[192]);
fs.writeFileSync(path.join(ICONS, 'icon-512.png'), png[512]);
if (!supplied) fs.writeFileSync(path.join(ICONS, 'icon.svg'), emblemSvg(96, 10, 18));
else fs.rmSync(path.join(ICONS, 'icon.svg'), { force: true });
// favicon.ico holding one 48px PNG, valid for every browser and for crawlers asking for /favicon.ico
const dir = Buffer.alloc(22);
dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4); dir[6] = 48; dir[7] = 48; dir.writeUInt16LE(1, 10); dir.writeUInt16LE(32, 12);
dir.writeUInt32LE(png[48].length, 14); dir.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(OUT, 'favicon.ico'), Buffer.concat([dir, png[48]]));
console.log('icons written' + (supplied ? ' from ' + supplied : ' from the logo geometry'));

/* ---------- project images: webp at the sizes the layouts really use ---------- */
const jobs = [];
for (const s of ['auto-xheviti', 'ls-entruempelung', 'lb-gebaeude', 'villa-johannes']) {
  jobs.push([`${s}-d.jpg`, `${s}-d`, [720, 1200]], [`${s}-m.jpg`, `${s}-m`, [360]]);
}
jobs.push(['teka-packaging.webp', 'teka-packaging', [720, 1200]], ['starnex-stationery.webp', 'starnex-stationery', [720, 1200]], ['teka-logo.webp', 'teka-logo', [480]], ['starnex-logo.webp', 'starnex-logo', [480]]);
const SRC = path.join(HERE, 'src-img'); // originals live here, outside the published folder
for (const [file, base, widths] of jobs) for (const w of widths) {
  const to = path.join(PROJ, `${base}-${w}.webp`);
  await sharp(path.join(SRC, file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 6 }).toFile(to);
}
const sum = fs.readdirSync(PROJ).filter(f => /-\d+\.webp$/.test(f)).map(f => [f, fs.statSync(path.join(PROJ, f)).size]);
console.log(sum.map(([f, b]) => `${f} ${Math.round(b / 1024)}KB`).join('\n'));
