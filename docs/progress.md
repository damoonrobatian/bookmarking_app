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

## Remaining

- HTTPS and a domain; then `COOKIE_SECURE=true`
- Stop publishing Postgres (`5432`) in `docker-compose.yml`
- Optional DigitalOcean cloud firewall in front of `ufw`
- Ubuntu package updates on the droplet (`apt upgrade`)
- Playwright was not executed against a running stack

## Known issues

- Metadata fetching still has a residual DNS-rebinding race; redirects and private-range checks mitigate it
- Drag-and-drop folder/bookmark moving is not implemented; move dialogs are used instead

## Technical decisions

See `docs/decisions.md`.
