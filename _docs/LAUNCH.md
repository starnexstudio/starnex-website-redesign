# StarNex Studio: launch notes

This folder starts with an underscore, so GitHub Pages (Jekyll) does not publish it. The same applies to `_build`. Do not add a `.nojekyll` file: it would publish both folders.

## How the site works

- Static HTML in three languages: Albanian at `/`, English at `/en/`, German at `/de/`. No server, database, forms, CMS or environment variables, so there is no `.env` file.
- Edit the sources in `_build/`, then run `node build.mjs`. The built pages go to the repository root and are committed, because GitHub Pages serves them as they are.
- Checks, from `_build/`:
  - `node check-i18n.mjs` and `node check-seo.mjs` need nothing installed and also run on GitHub.
  - `node serve.mjs` starts the local preview at http://localhost:5178.
  - `node check-layout.mjs`, `node check-flows.mjs` and `node check-speed.mjs` need the preview running, plus Playwright and Chrome. They borrow Playwright from another local project; set `PLAYWRIGHT_FROM` to change the path.
- Assets: `node make-assets.mjs` makes the icons and resized images, `node make-og.mjs` the sharing image.
- To use a supplied favicon: `node make-assets.mjs path/to/icon.png`.

## Hosting limits (GitHub Pages)

| Topic | What applies |
| --- | --- |
| Redirects | No server redirects. `/en` to `/en/` is automatic. |
| Security headers | Custom headers are not possible (CSP, HSTS settings, frame options). HTTPS works today; check "Enforce HTTPS" in repository Settings > Pages. |
| Compression and cache | Gzip is automatic. The cache time is fixed at about 10 minutes. |
| 404 page | Only the root `404.html` is served, so a missing `/de/...` page shows the Albanian 404, which links to the other languages. |

Adding headers later would mean a proxy or another host, which means a DNS change. That is not part of this launch.

## URL inventory and redirect map

The live site is a one-page site. Only these URLs exist and are in its sitemap:

| Old URL | New URL | Action |
| --- | --- | --- |
| `https://starnexstudio.com/` | same | Kept, redesigned |
| `https://starnexstudio.com/en/` | same | Kept, redesigned |
| `https://starnexstudio.com/en` | `/en/` | 301, automatic on GitHub Pages |
| `http://` and `www.` versions | `https://starnexstudio.com/` | 301, already live; do not change |
| `/images/og-image.jpg` | same path, new image | Kept so old shares keep working |
| `/site.webmanifest`, `/robots.txt`, `/sitemap.xml` | same paths | Kept, regenerated |
| Other `/images/*`, `/tools`, old `/css` and `/js` files | none | 404 is correct: page assets, not pages |

Old hash links `#about #pricing #portfolio #final-cta` load the homepage at the top. They never were separate URLs, so nothing is lost for search. `#home #services #process #faq #contact` still work where those sections exist.

No blanket redirects to the homepage. Do not use Search Console's Change of Address tool: the domain is not changing.

**Unverified:** Search Console and GA4 were not available, so check the Pages report and backlinks for other indexed URLs before launch. If a URL with traffic or links appears, add it to this table and give it a real page. GitHub Pages cannot redirect, so a small HTML page with a canonical and a meta refresh is the only option there.

## Keyword-to-page map

These are hypotheses to test in Search Console. No search volumes were available and none are implied.

| Search term | Intent | Page | Title | H1 | Supporting terms | Internal links | Main action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shërbime web Tiranë | Compare | `/services.html` | Shërbime Web, Branding dhe SEO në Tiranë \| StarNex Studio | Të gjitha shërbimet | branding, SEO, dyqane online | All service pages | WhatsApp |
| krijim website Tiranë | Hire, local | `/` | StarNex Studio \| Krijim Website në Tiranë | StarNex Studio është një studio për krijim website në Tiranë. | studio web, dizajn website | All services, projects | WhatsApp |
| agjenci web Shqipëri | Compare providers | `/`, `/about.html` | as above; Rreth Studios në Tiranë \| StarNex Studio | as above; Studioja | studio dizajni web | Projects | WhatsApp |
| krijim faqe interneti | Hire | `/services/development.html` | Krijim Faqesh Interneti me Porosi \| StarNex Studio | Krijim website | faqe interneti me porosi, zhvillim web | Home, 2 projects, guide post | WhatsApp |
| krijim dyqani online | Hire | `/services/online-stores.html` | Krijim Dyqani Online në Shqipëri \| StarNex Studio | Dyqane online | dyqan online, pagesa, transport | Instagram post, projects | WhatsApp |
| zhvillim aplikacionesh web | Hire, specific | `/services/web-apps.html` | Aplikacione Web dhe Sisteme Rezervimi \| StarNex Studio | Aplikacione web | panele, mjete të brendshme | CMS service, projects | WhatsApp |
| sisteme rezervimi për biznese | Hire, specific | `/services/web-apps.html` | same | same | rezervime online, hotel | Projects | WhatsApp |
| shërbime SEO Shqipëri | Hire | `/services/seo.html` | Shërbime SEO në Shqipëri \| StarNex Studio | Gjendu në Google | SEO lokale, Search Console | Speed post | WhatsApp |
| mirëmbajtje website | Hire, ongoing | **No page** | | | | | Decision below |

The same structure applies in English and German through the matching pages. German pages say "aus Tirana" and do not imply an office in Germany.

**Decision for you:** you removed "hosting and care" from the services, so no page targets "mirëmbajtje website". Add a page only if you sell it.

## Google Business Profile

Observed publicly only; the account was not accessed and nothing was changed. Whether a profile exists, and its reviews, are unverified.

1. Google requires a real location where you meet customers, or a service-area setup with a hidden address. A post office box does not qualify. Use a service-area profile if your home address stays private.
2. Use the real name "StarNex Studio". Do not add keywords to the name.
3. Choose the main category closest to your work, for example "Website designer".
4. Keep the phone identical to the site: +355 68 234 8060. Link to `https://starnexstudio.com/`.
5. Hours, photos and service list: only what is true. The structured data leaves out hours and street address because the site does not state them as a place to visit.
6. Ask real clients for reviews, individually, after finished work. No paid or swapped reviews.

## GitHub steps (only when you decide to publish)

Live repository: `starnexstudio/StarNex`, branch `main`. Confirm in Settings > Pages that the source is `main`, root. Pushing a branch other than `main` changes nothing on the live site.

```bash
git clone https://github.com/starnexstudio/StarNex.git starnex-live
cd starnex-live
git tag pre-redesign
git push origin pre-redesign
git switch -c redesign
```

Then delete everything in `starnex-live` except `.git`, copy in the contents of `starfinaldesign`, and:

```bash
git add -A
git commit -m "Redesign: three-language site"
git push -u origin redesign
```

Open a pull request and wait for the Checks run. The repository is public, so `_build` will be readable there, though not published on the site. The old `.claude`, `.vscode`, `tools` and `README.md` go away with this copy; `README.md` at the root would otherwise be published.

There is no staging site: GitHub Pages serves one branch per repository. Review locally with `node serve.mjs`, or through a separate host if you want a shared preview.

## Launch checklist

Before merging:

- [ ] Fill in the starting prices in `_build/data.mjs` (`from`). Only Development has one, 299€ from the old site. The rest show "on request".
- [ ] Send a test message to contact@starnexstudio.com yourself and confirm it arrives.
- [ ] Send yourself a WhatsApp message through the site button.
- [ ] Decide on the dropped content: pricing, testimonials, Booking as its own service, Google Reviews, maintenance.
- [ ] Have a native reader review the Albanian and German. Have legal text checked once the business is registered.
- [ ] Check the Search Console Pages report for extra indexed URLs. Export Performance data as the "before" baseline.
- [ ] Note the current GA4 numbers: consent will lower measured traffic.

Launch:

- [ ] Merge the pull request into `main`.
- [ ] Do not touch DNS at GoDaddy. Nameservers, A and www CNAME records stay. MX, SPF, DKIM and DMARC stay, so email is not affected.
- [ ] Settings > Pages: the custom domain still shows `starnexstudio.com` and "Enforce HTTPS" is on.

Within an hour:

- [ ] `/`, `/en/`, `/de/`, one service, one project anchor, one post and a missing URL (404) open correctly, also on a phone.
- [ ] `robots.txt`, `sitemap.xml`, `favicon.ico`, `site.webmanifest` and `images/og-image.jpg` open.
- [ ] Accept the consent bar and see one visit in GA4 Realtime. Decline in a private window and see none.
- [ ] Send and receive one email to confirm mail still flows.
- [ ] Search Console: submit `sitemap.xml`, and request indexing for `/`, `/en/`, `/de/`.
- [ ] Rich Results Test on `/` and one post. Schema Markup Validator on one service page. Valid markup does not guarantee rich results.
- [ ] PageSpeed Insights on the home, a service, projects and a post, for Lighthouse and any field data.

Optional cleanup at GoDaddy, when you choose: the TXT record `google-site-verification=xxxxxxxxxxxx` is a leftover placeholder. Keep the other verification record.

## Rollback

Triggers: the site or domain is down for more than 15 minutes, the contact buttons fail, HTTPS fails, pages appear blank or broken on phones, or email stops.

There is no database, so rollback means restoring files:

```bash
git switch main
git pull
git revert -m 1 <merge-commit>
git push origin main
```

Pages republishes within minutes. The tag `pre-redesign` keeps the old state; `git diff pre-redesign main` should come back empty afterwards, apart from intended changes. If mail or the domain is affected, the cause is not this release, because it changes no DNS: check GoDaddy and Settings > Pages.

## Measurement

- GA4 `G-1RVYRLNBYY` is kept, so history continues. It loads only after consent, only on `starnexstudio.com`, with one automatic page view.
- Event `contact_click` with `method` (`whatsapp`, `phone`, `email`, `instagram`). There are no forms, and no personal data is sent.
- Mark `contact_click` as a key event in GA4 after launch.
- In Search Console, filter queries containing "starnex" as branded and everything else as non-branded, and watch them separately.

## 30/60/90 days

**First 30 days:** watch indexing of all 60 URLs. Fix errors in Search Console. Compare clicks to the baseline. Set up the Business Profile if eligible. Add the site to the Instagram, TikTok, LinkedIn and Facebook profiles. Add client-approved results to the project text where real numbers exist.

**By day 60:** check which queries bring impressions and adjust titles on those pages only. Expand one or two service pages where searches show up but clicks do not. Write one or two posts from questions clients really ask. Ask finished clients for reviews and for a link from their site where natural.

**By day 90:** compare branded and non-branded clicks and contact clicks against the baseline. Review field Core Web Vitals if Search Console has enough data. Decide whether German deserves more work, based on actual enquiries.

Avoid: bought backlinks, mass pages per town, fake reviews, keyword stuffing. Rankings cannot be promised.
