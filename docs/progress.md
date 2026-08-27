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
- Backend tests (37) and frontend tests (19)
- Playwright happy-path spec
- Documentation and GitHub Actions CI/CD (tests on every push; deploy to the droplet after `main` is green)
- DigitalOcean droplet: Ubuntu 24.04, 1 GB, Docker Compose at `/root/bookmarking_app`
- Live HTTPS app at `https://neshanak.ca` (public HTTP on port 8080 is closed)
- Host firewall (`ufw`): OpenSSH + 80/tcp + 443; 5432, 8000, and 8080 not public
- Domain `neshanak.ca` registered at Namespro / CIRA (3 years, to 2029-08-26)
- Namespro DNS Hosting - Free; A records `@` and `www` → `159.89.125.246` (ticket 790542899 confirmed 26 Aug 2026 21:15; htns1 and this laptop verified)
- HTTPS for `neshanak.ca` via Caddy / Let's Encrypt; `www` redirects to the apex; HSTS; Secure cookies; leftover HTTP cookies are expired on login
- Product rename: **Neshanak** in the UI, API title, and docs (Postgres user/db on the droplet remain `nook`)
- Remember Me on login: checked by default (persistent cookies, up to `REFRESH_TOKEN_EXPIRE_DAYS`). Unchecked uses session cookies. `GET /api/auth/me` refreshes an expired access cookie. Refresh rotation keeps that choice.
- Title Case on every word in UI chrome; user-entered titles, folders, tags, emails, and URLs are unchanged
- Change password and delete account on Settings; Show Password on password fields
- Copy URL on each bookmark card (clipboard + toast)
- Save the current page from a Settings bookmarklet or the unpacked `extension/` toolbar button; `/save` popup auto-fills URL, suggested title, and tags

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
