# Domain cutover plan

Nothing here has been done. The domain switches only after the owner approves it, and only after the hosted preview has been tested.

## State before the switch (read from public records on 2026-11-05)

| Item | Value |
| --- | --- |
| Live site | GitHub Pages, repository `starnexstudio/StarNex`, branch `main`, root |
| Live commit to return to | `0942efd1cbc58b6dcd69840d9baf1c9db9e4aaeb` |
| Nameservers | `ns63.domaincontrol.com`, `ns64.domaincontrol.com` (GoDaddy). Do not change. |
| Apex A records | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `www` | CNAME to `starnexstudio.github.io` |
| MX | `0 smtp.secureserver.net`, `10 mailstore1.secureserver.net` |
| SPF | `v=spf1 include:secureserver.net -all` |
| DMARC | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` |
| DKIM | No record found at the common selectors tried. Selectors cannot be listed from outside, so check the GoDaddy DNS page. |
| Search Console | `google-site-verification=BMCDb5RlMnKDayPpcrZMO9o6Qid9WwY-4HxNQ6N3y4Y` as a DNS TXT record |
| Analytics | GA4 `G-1RVYRLNBYY`, kept. The new site loads it only after consent. |

Before the switch, export the full GoDaddy DNS zone, since this table only covers what public lookups show.

## Why the host has to change

The new repository is private, and GitHub Pages does not serve a private repository on a free organisation plan. Render serves it for free as a static site, and it is the same host as the preview, so what was tested is what goes live.

## Proposed changes, in order

1. Create the production service on Render from `starnex-website-redesign`, branch `main`, using the build command in `README.md`, with `STARNEX_ENV` unset. Check its `onrender.com` URL: pages must carry no noindex mark.
2. Add `starnexstudio.com` and `www.starnexstudio.com` as custom domains on that service. Render shows the exact records to use and verifies them.
3. At GoDaddy, edit only these records, using the values Render shows:
   - Apex: replace the four GitHub A records with Render's.
   - `www`: point the CNAME at the Render service.
4. Wait for Render to verify the domain and issue the HTTPS certificate.

Leave alone: nameservers, MX, SPF, DKIM, DMARC, and the Search Console TXT record. The placeholder TXT record `google-site-verification=xxxxxxxxxxxx` is harmless and is a separate cleanup.

The DNS TTL is about 10 minutes, so most visitors move quickly. HTTPS can show errors for a short time until the certificate is issued.

The GoDaddy connector available here only checks domain names and cannot edit DNS, so step 3 is a manual step for the owner.

## URLs

The old site has only `/` and `/en/` in its sitemap, and both are kept. `/images/og-image.jpg`, `/site.webmanifest`, `/robots.txt` and `/sitemap.xml` also keep their paths. See the URL inventory in `LAUNCH.md`.

No redirects are needed for the old pages, and nothing is redirected to the homepage in bulk. `/en` to `/en/` must be confirmed on the preview, because this is automatic on GitHub Pages but depends on the host elsewhere.

Unverified: Search Console was not available, so other indexed URLs may exist. Check its Pages report before the switch.

## Backup

- Old code: repository `starnexstudio/StarNex` stays untouched, with the commit above. Its Pages setting stays on.
- Old site has no database or server, so there is no data to migrate or restore.
- DNS: this file plus the zone export.
- New site: the private repository.

## Checks after the switch

- `/`, `/en/`, `/de/`, a service, a project, a post, a missing URL (404), on desktop and on a phone.
- `http://` and `www` both reach `https://starnexstudio.com/` with a 301.
- Pages have no noindex mark and `robots.txt` lists the sitemap.
- Send and receive one email at contact@starnexstudio.com.
- Accept consent and see one visit in GA4 Realtime. Decline in a private window and see none.
- Search Console: submit `sitemap.xml`, and request indexing of `/`, `/en/`, `/de/`.

## Rollback

Triggers: the site or domain is down for more than 15 minutes, HTTPS fails, contact links fail, pages break on phones, or email is affected.

1. At GoDaddy, restore the four A records and the `www` CNAME from the table above.
2. Confirm the old site loads over HTTPS. GitHub may need time to reissue its certificate.

There is no data to roll back. Keep the old repository and its Pages setting until the new site has been verified, and do not delete them as part of this switch.
