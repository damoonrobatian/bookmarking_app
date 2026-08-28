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
- Login `remember_me: false` sets **session** cookies that the browser drops when it closes
- Login `remember_me: true` sets **persistent** cookies (`Max-Age` from `ACCESS_TOKEN_EXPIRE_MINUTES` and `REFRESH_TOKEN_EXPIRE_DAYS`)
- The login form sends `remember_me: true` unless the box is cleared
- The refresh JWT stores that choice so `POST /api/auth/refresh` reissues cookies the same way
- Register always uses persistent cookies
- Logout clears both cookies
- After a 401, the frontend retries once with `POST /api/auth/refresh`, including for `GET /api/auth/me`. It does not refresh after login, register, password change, account deletion, logout, or refresh itself
- In production, login also expires leftover non-Secure cookies so an old HTTP `:8080` session cannot shadow HTTPS cookies
- `POST /api/auth/password` updates the password hash after checking the current password
- `DELETE /api/auth/account` verifies the password, deletes the user (cascading bookmarks, folders, and tags), and clears cookies

## Data model

Users own folders, bookmarks, and tags. Folders may nest. Bookmarks optionally belong to one folder and many tags. Duplicate detection uses `normalized_url` and is unique per user.

Folder deletion moves bookmarks and child folders to the parent folder (or to the root if there is no parent).

## Search

Search is implemented as PostgreSQL/SQLite `ILIKE` across title, URL, domain, description, notes, and tag names. The query lives in `BookmarkRepository` so it can later be replaced with full-text search.

## Metadata and SSRF

User-supplied URLs are treated as untrusted. Before fetching a page, the backend rejects non-HTTP schemes, credentials, non-standard ports, localhost, private/link-local ranges, and metadata-service addresses. Redirects are followed only after the same checks. Timeouts and response size limits apply. Bookmark creation still succeeds if metadata cannot be retrieved.

## Frontend

The SPA uses React Router for pages and TanStack Query for server state. Feature folders keep bookmark, folder, tag, and auth UI separate from shared layout and primitives.

`/save` is a compact page (no app chrome) used as a popup. Query parameters supply the page URL and `document.title`. The form keeps a reasonable tab title and only replaces it when that title looks like an SEO keyword list. `POST /api/bookmarks/preview` can still fill a heading-based title, a description, and suggested tags. Signed-out visitors are sent to `/login?next=/save?...`; `safeInternalPath` keeps that return path on this origin.

The Settings bookmarklet and the unpacked extension in `extension/` open that popup on `https://neshanak.ca` so existing login cookies apply (`SameSite=Lax`). The bookmarklet `href` is a `javascript:` URL so it can read the current tab. Chrome and Edge will not show a custom icon on a script you drag onto the bar; Settings therefore also downloads a Netscape HTML file with an `ICON` data URI for Bookmark Manager import.

Settings is a menu of one action at a time (`/settings/password`, and so on) so password fields are not mounted until that action is chosen. Theme is one of those actions: six named palettes change the accent color and the header mark for that account.

Tags live on `/app/tags`, grouped by folder. The sidebar lists folders only.

Page titles, dialog titles, settings section titles, and nav labels use Title Case. Other chrome copy (buttons, labels, descriptions, empty states, errors) uses sentence case. User content — bookmark titles, folder names, tags, emails, and URLs — is shown as stored. Password fields include a show-password control.
