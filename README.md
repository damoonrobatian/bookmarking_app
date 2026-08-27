# Neshanak

A personal bookmark manager for saving, organizing, searching, and revisiting the pages you want to keep.

Neshanak is similar in spirit to a dedicated bookmarking tool: folders, tags, favorites, archive, import/export, and automatic page metadata — without social features.

## Screenshots

_Add screenshots of the library, folder sidebar, and add-bookmark dialog here after running the app locally._

## Features

- Account registration, login with Remember Me (on by default), and logout
- Change password and delete account from Settings (one section at a time)
- Show Password on password fields
- Save, edit, delete, favorite, archive, restore, and copy a bookmark URL
- Nested folders with move and rename
- Tags grouped by folder on a Tags page, with autocomplete when saving
- Search across title, URL, domain, description, notes, and tags
- Sorting and pagination
- Recently added and recently visited views
- Visit counts
- Duplicate URL detection
- Automatic title, favicon, and tag suggestions when a page is saved
- Save the current tab from a bookmarks-bar button or a small toolbar extension
- Netscape HTML import and export
- Responsive layout for desktop, tablet, and mobile

## Architecture

The repository is a monorepo:

- `backend/` — FastAPI, SQLAlchemy, Alembic, PostgreSQL
- `frontend/` — React, TypeScript, Vite, Tailwind CSS
- `extension/` — Unpacked Chrome/Firefox toolbar button
- `e2e/` — Playwright happy-path tests

See [docs/architecture.md](docs/architecture.md) for layering, auth, search, and SSRF notes.

## Technology stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic, Argon2, JWT cookies, httpx, BeautifulSoup

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Radix primitives, Lucide icons

**Tooling:** Docker Compose, GitHub Actions, pytest, Vitest, React Testing Library, ESLint, Prettier, Playwright

## Use the app

Your bookmark library is **https://neshanak.ca** only. Do not run `make backend` / `make frontend` or local Docker as a second copy of your bookmarks.

To save a page you are looking at:

1. Sign in at https://neshanak.ca, open **Settings**, then **Save From The Browser**.
2. Show the browser bookmarks bar if it is hidden: Chrome, Edge, and Firefox use Ctrl+Shift+B (Mac: Command+Shift+B). You can also right-click under the address bar and enable Bookmarks Bar / Bookmarks Toolbar.
3. Drag the orange **Save To Neshanak** button onto that bar. Clicking it on the Settings page does nothing; it only works from the bar.
4. On any site, click **Save To Neshanak** on the bar. A popup opens with the address filled in and a suggested title and tags.

For a button next to the address bar instead, load the unpacked `extension/` folder (Chrome: Load Unpacked; Firefox: Load Temporary Add-On). Full steps are in [docs/development.md](docs/development.md).

## Changing the code

Backend tests use SQLite and do not need PostgreSQL:

```bash
make test
```

A local Postgres database is optional and is **not** your library. If you need it while editing code:

1. Copy environment defaults: `cp .env.example .env`
2. Set `SECRET_KEY`. Point `DATABASE_URL` at a throwaway local database, not the droplet.
3. `make install` then `make migrate`
4. `make backend` and `make frontend` → `http://localhost:5173` (dev server only)

Optional throwaway demo user: `make seed` → `demo@example.com` / `demopassword`.

## Docker installation

```bash
docker compose up --build
```

- Application: http://localhost:8080
- API docs: http://localhost:8080/docs or http://localhost:8000/docs

Docker Compose starts PostgreSQL, the API, and the nginx-hosted frontend. That local stack is for development only. Do not use the bundled development `SECRET_KEY` in production. Your bookmarks stay at **https://neshanak.ca**.

The first DigitalOcean deploy is live at **https://neshanak.ca**. **`neshanak.ca`** is registered at Namespro / CIRA. TLS is terminated by Caddy. Steps, firewall, domain, and DNS notes are in [docs/deployment.md](docs/deployment.md).

## Environment variables

See `.env.example` for the full list. Important variables:

| Variable | Purpose |
| --- | --- |
| `ENVIRONMENT` | `development`, `production`, or `test` |
| `DATABASE_URL` | SQLAlchemy URL (`postgresql+psycopg://...`) |
| `SECRET_KEY` | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access cookie lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh cookie lifetime |
| `FRONTEND_URL` | Allowed CORS origin |
| `BACKEND_URL` | Public API origin |
| `COOKIE_SECURE` | Force the Secure cookie flag |
| `IMPORT_MAX_BYTES` | Maximum bookmark HTML import size |
| `METADATA_TIMEOUT_SECONDS` | Outbound fetch timeout |
| `METADATA_MAX_BYTES` | Maximum metadata response size |

## Database migrations

```bash
make migrate
# or
cd backend && uv run alembic upgrade head
```

Never change a live schema by hand. Add an Alembic revision for every schema change.

## Testing

```bash
make test
make test-backend
make test-frontend
make lint
```

Backend tests use SQLite and do not require PostgreSQL.

Pushes to `main` run the **CI/CD** workflow (`.github/workflows/ci-cd.yml`): lint, tests, frontend build, then deploy to the droplet. Pull requests run the checks without deploying.

## Project structure

```text
├── backend/          FastAPI application, Alembic, pytest
├── frontend/         React SPA
├── extension/        Unpacked Chrome/Firefox toolbar button
├── e2e/              Playwright
├── docs/             Architecture and API notes
├── docker-compose.yml
└── Makefile
```

## API documentation

FastAPI serves `/docs` and `/redoc`. A short endpoint map is in [docs/api.md](docs/api.md).

## Contribution notes

- Keep user data isolated in every query (`user_id` filters on the server).
- Treat metadata fetches as untrusted input.
- Prefer explicit move dialogs over unfinished drag-and-drop.
- Do not commit `.env`, secrets, or database dumps.

## License

MIT. See [LICENSE](LICENSE).
