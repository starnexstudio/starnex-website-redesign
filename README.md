# StarNex Studio website

Static site in three languages: Albanian at `/` (default), English at `/en/`, German at `/de/`. There is no server, database, form backend or runtime dependency. Enquiries go by email and WhatsApp.

## Setup

Node 22 or newer. Nothing to install: the build uses only Node's standard library, which is why there is no `package.json` or lockfile.

```bash
cd _build
node build.mjs
node serve.mjs
```

The preview runs at http://localhost:5178.

## Where things live

| Path | What it holds |
| --- | --- |
| `_build/content/{sq,en,de}/` | All the words. Every language must have the same keys. |
| `_build/data.mjs` | Facts: services, starting prices, projects, reviews, contact details. |
| `_build/build.mjs`, `home-source.html`, `home-extra.css` | Page templates. |
| `css/`, `js/`, `assets/`, `images/` | Hand-written styles and scripts, and the images. Not generated, except `assets/logo.svg` and `js/emblem.js`. |
| `_docs/` | Launch notes and the domain cutover plan. |

The pages at the root, `en/`, `de/`, `services/`, `blog/`, `sitemap.xml`, `robots.txt`, `site.webmanifest` and `CNAME` are generated and not committed. `_build/lastmod.json` is committed because it holds the sitemap dates.

## Publishing

`node _build/publish.mjs` collects only the public files into `dist/`. A host should serve `dist/`, never the repository root, because `_build` and `_docs` are not public.

| Setting | Value |
| --- | --- |
| Build command | `node _build/build.mjs && node _build/check-seo.mjs && node _build/publish.mjs` |
| Publish folder | `dist` |
| `STARNEX_ENV` | `preview` on a preview host, which marks every page noindex. Unset on production. |

See `.env.example`. Do not put secrets in this repository; none are needed.

## Checks

From `_build/`:

- `node check-i18n.mjs` and `node check-seo.mjs` need nothing installed and run on every push.
- `node check-layout.mjs`, `node check-flows.mjs` and `node check-speed.mjs` need `node serve.mjs` running, plus Playwright and Chrome. Point `PLAYWRIGHT_FROM` at a `package.json` from a project that has Playwright.
