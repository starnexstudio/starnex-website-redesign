// Local preview server that behaves like GitHub Pages: /en/ -> /en/index.html, /x -> /x.html, unknown paths -> /404.html with status 404.
import zlib from 'node:zlib'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 5178);
const file = p => { try { return fs.statSync(p).isFile() ? p : null; } catch { return null; } };
http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0].split('#')[0]);
  const base = path.join(root, p);
  if (!base.startsWith(root) || p.startsWith('/_build')) { s.writeHead(404); return s.end(); }
  if (!p.endsWith('/') && file(path.join(base, 'index.html'))) { s.writeHead(301, { location: p + '/' }); return s.end(); }
  const hit = file(base) || file(path.join(base, 'index.html')) || file(base + '.html');
  const f = hit || path.join(root, '404.html');
  const type = types[path.extname(f)] || 'application/octet-stream';
  const zip = /gzip/.test(q.headers['accept-encoding'] || '') && /text|javascript|json|svg|xml/.test(type);
  s.writeHead(hit ? 200 : 404, { 'content-type': type, ...(zip ? { 'content-encoding': 'gzip' } : {}) });
  zip ? fs.createReadStream(f).pipe(zlib.createGzip()).pipe(s) : fs.createReadStream(f).pipe(s);
}).listen(port, () => console.log(`http://localhost:${port}`));
