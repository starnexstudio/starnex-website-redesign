# Domain cutover plan

Nothing here has been done. The domain switches only after the owner approves it.

The new site stays on GitHub Pages, so the domain moves from one repository to another and **DNS does not change**.

## State before the switch (read from public records on 2026-11-05)

| Item | Value |
| --- | --- |
| Live site | GitHub Pages, repository `starnexstudio/StarNex`, branch `main`, root, HTTPS enforced |
| Live commit to return to | `0942efd1cbc58b6dcd69840d9baf1c9db9e4aaeb` |
| New site | Repository `starnexstudio/starnex-website-redesign`, Pages source GitHub Actions |
| Preview | https://starnexstudio.github.io/starnex-website-redesign/ (noindex) |
| Nameservers | `ns63.domaincontrol.com`, `ns64.domaincontrol.com` (GoDaddy) |
| Apex A records | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `www` | CNAME to `starnexstudio.github.io` |
| MX | `0 smtp.secureserver.net`, `10 mailstore1.secureserver.net` |
| SPF | `v=spf1 include:secureserver.net -all` |
| DMARC | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` |
| Search Console | `google-site-verification=BMCDb5RlMnKDayPpcrZMO9o6Qid9WwY-4HxNQ6N3y4Y` as a DNS TXT record, unchanged |
| Analytics | GA4 `G-1RVYRLNBYY`, kept. The new site loads it only after consent, and only on starnexstudio.com. |

None of the DNS records above are touched, so email and Search Console verification are not affected.

## Proposed changes, in order

1. **New repository:** in `.github/workflows/deploy.yml`, remove `STARNEX_ENV` and `STARNEX_BASE`, then push. The site builds in production mode without noindex. The preview URL stops rendering correctly from this point, which does not affect the live site.
2. Confirm the Deploy run succeeded and that `dist` carries no noindex.
3. **Old repository:** Settings > Pages, remove the custom domain `starnexstudio.com`. On a branch-published site GitHub does this by committing the removal of the `CNAME` file. This is the only change to the old repository, and the live site is down from here until step 4.
4. **New repository:** Settings > Pages, add the custom domain `starnexstudio.com` and save.
5. Wait for the DNS check and the certificate, then turn on Enforce HTTPS.

Expect a few minutes of downtime between steps 3 and 4, and possibly longer before HTTPS works, because GitHub issues the certificate after the domain is attached.

## URLs

The old site has only `/` and `/en/` in its sitemap, and both are kept. `/images/og-image.jpg`, `/site.webmanifest`, `/robots.txt` and `/sitemap.xml` also keep their paths. See the URL inventory in `LAUNCH.md`. No redirects are needed, and nothing is redirected to the homepage in bulk. `/en` to `/en/` is automatic and was confirmed on the preview.

Unverified: Search Console was not available, so other indexed URLs may exist. Check its Pages report before the switch.

## Backup

- Old code: repository `starnexstudio/StarNex` stays, with the commit above. It is not deleted after the switch.
- The old site has no database or server, so there is no data to migrate or restore.
- DNS is not changed. Export the GoDaddy zone anyway as a record.
- New site: its repository.

## Checks after the switch

- `/`, `/en/`, `/de/`, a service, a project, a post, a missing URL (404), on desktop and on a phone.
- `http://` and `www` both reach `https://starnexstudio.com/` with a 301.
- Pages have no noindex mark and `robots.txt` lists the sitemap.
- Send and receive one email at contact@starnexstudio.com.
- Accept consent and see one visit in GA4 Realtime. Decline in a private window and see none.
- Search Console: submit `sitemap.xml`, and request indexing of `/`, `/en/`, `/de/`.

## Rollback

Triggers: the site or domain is down for more than 15 minutes, HTTPS fails, contact links fail, or pages break on phones.

1. New repository: Settings > Pages, remove the custom domain.
2. Old repository: Settings > Pages, add `starnexstudio.com` again, which restores its `CNAME` file. Turn on Enforce HTTPS once the certificate is ready.

There is no data and no DNS to roll back. Keep the old repository and its Pages setting until the new site has been verified.
