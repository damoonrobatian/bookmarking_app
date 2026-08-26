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
- Backend tests (30) and frontend tests (9)
- Playwright happy-path spec
- Documentation and GitHub Actions CI
- DigitalOcean droplet: Ubuntu 24.04, 1 GB, Docker Compose at `/root/bookmarking_app`
- Live HTTP app at `http://159.89.125.246:8080` (laptop and phone verified)
- Host firewall (`ufw`): OpenSSH + 8080/tcp; 5432 and 8000 not public
- Domain `neshanak.ca` registered at Namespro / CIRA (3 years, to 2029-08-26)
- Namespro web setting: DNS Hosting - Free; intended A records to `159.89.125.246`

## Remaining

- Confirm live DNS for `neshanak.ca` is `159.89.125.246` (panel saved; `htns1` still parking as of 26 Aug 2026 evening)
- Namespro refund for the duplicate domain invoice (keep WHOIS and the first invoice)
- HTTPS for `neshanak.ca`; then `COOKIE_SECURE=true` and Compose URLs
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
