# Progress

## Completed

- Repository foundation: gitignore, env example, Docker Compose, Makefile, license
- Backend project layout, configuration, database, Alembic
- Authentication (register, login, logout, me, refresh, HTTP-only cookies)
- Core data model: users, folders, bookmarks, tags
- Bookmark, folder, and tag APIs
- Search, sort, pagination, favorites, archive, recent
- URL normalization, metadata extraction, SSRF protection, duplicate handling
- Netscape bookmark import and export
- Frontend application: auth, layout, bookmarks, folders, tags, settings
- Backend tests (34) and frontend tests (11)
- Playwright happy-path spec
- Documentation and GitHub Actions CI
- DigitalOcean droplet: Ubuntu 24.04, 1 GB, Docker Compose at `/root/bookmarking_app`
- Live HTTPS app at `https://neshanak.ca` (`http://neshanak.ca:8080` still published)
- Host firewall (`ufw`): OpenSSH + 80/tcp + 443 + 8080/tcp; 5432 and 8000 not public
- Domain `neshanak.ca` registered at Namespro / CIRA (3 years, to 2029-08-26)
- Namespro DNS Hosting - Free; A records `@` and `www` → `159.89.125.246` (ticket 790542899 confirmed 26 Aug 2026 21:15; htns1 and this laptop verified)
- HTTPS for `neshanak.ca` via Caddy / Let's Encrypt; `www` redirects to the apex; Secure cookies
- Product rename: **Neshanak** in the UI, API title, and docs (Postgres user/db on the droplet remain `nook`)
- Remember Me on login: unchecked uses session cookies; checked uses persistent cookies. Refresh keeps that choice.
- Title Case on every word in UI chrome; user-entered titles, folders, tags, emails, and URLs are unchanged
- Change password and delete account on Settings; Show Password on password fields

## Remaining

- Namespro refund for the duplicate domain invoice (keep WHOIS and the first invoice)
- Namespro domain list showed `neshanak.ca` twice (same expiry); CIRA has one object
- Stop publishing Postgres (`5432`) in `docker-compose.yml`
- Optional DigitalOcean cloud firewall in front of `ufw`
- Ubuntu package updates on the droplet (`apt upgrade`)
- Playwright was not executed against a running stack

## Known issues

- Metadata fetching still has a residual DNS-rebinding race; redirects and private-range checks mitigate it
- Drag-and-drop folder/bookmark moving is not implemented; move dialogs are used instead

## Technical decisions

See `docs/decisions.md`.
