# Architecture

Neshanak is a personal bookmark manager split into a FastAPI backend and a React frontend.

## High-level shape

```text
Browser  →  frontend (Vite / nginx)  →  /api  →  FastAPI  →  PostgreSQL
```

In local development the Vite dev server proxies `/api` to the backend so authentication cookies stay first-party. Docker Compose uses nginx for the same purpose.

## Backend layers

- `app/api` — HTTP routes and request/response models
- `app/services` — business rules (folders, bookmarks, metadata, import)
- `app/repositories` — SQLAlchemy queries
- `app/models` — database tables
- `app/schemas` — Pydantic API schemas
- `app/security` — password hashing and JWT cookies
- `app/services/ssrf.py` + `app/services/metadata.py` — untrusted URL fetching

Routes never talk to SQLAlchemy directly. External HTTP is isolated so metadata retrieval can fail without blocking bookmark creation.

## Authentication

Access and refresh tokens are JWTs stored in HTTP-only cookies.

- Access cookie: short-lived, sent to all `/api` routes
- Refresh cookie: longer-lived, scoped to `/api/auth`
- Login `remember_me: false` (the default) sets **session** cookies that the browser drops when it closes
- Login `remember_me: true` sets **persistent** cookies (`Max-Age` from `ACCESS_TOKEN_EXPIRE_MINUTES` and `REFRESH_TOKEN_EXPIRE_DAYS`)
- The refresh JWT stores that choice so `POST /api/auth/refresh` reissues cookies the same way
- Register always uses persistent cookies
- Logout clears both cookies
- The frontend retries once with `POST /api/auth/refresh` after a 401

## Data model

Users own folders, bookmarks, and tags. Folders may nest. Bookmarks optionally belong to one folder and many tags. Duplicate detection uses `normalized_url` and is unique per user.

Folder deletion moves bookmarks and child folders to the parent folder (or to the root if there is no parent).

## Search

Search is implemented as PostgreSQL/SQLite `ILIKE` across title, URL, domain, description, notes, and tag names. The query lives in `BookmarkRepository` so it can later be replaced with full-text search.

## Metadata and SSRF

User-supplied URLs are treated as untrusted. Before fetching a page, the backend rejects non-HTTP schemes, credentials, non-standard ports, localhost, private/link-local ranges, and metadata-service addresses. Redirects are followed only after the same checks. Timeouts and response size limits apply. Bookmark creation still succeeds if metadata cannot be retrieved.

## Frontend

The SPA uses React Router for pages and TanStack Query for server state. Feature folders keep bookmark, folder, tag, and auth UI separate from shared layout and primitives.

Chrome copy (buttons, headings, labels, empty states, errors) uses Title Case on every word. User content — bookmark titles, folder names, tags, emails, and URLs — is shown as stored.
