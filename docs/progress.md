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
- Backend tests (30) and frontend tests (8)
- Playwright happy-path spec
- Documentation and GitHub Actions CI
- DigitalOcean droplet deploy notes (`docs/deployment.md`)

## In progress

- First DigitalOcean Compose deploy (build/start on the droplet)

## Remaining

- Finish hardening the droplet (firewall, HTTPS, stop publishing Postgres)
- Playwright was not executed against a running stack

## Known issues

- Metadata fetching still has a residual DNS-rebinding race; redirects and private-range checks mitigate it
- Drag-and-drop folder/bookmark moving is not implemented; move dialogs are used instead

## Technical decisions

See `docs/decisions.md`.
