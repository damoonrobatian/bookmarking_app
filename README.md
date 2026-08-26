# Nook

A personal bookmark manager for saving, organizing, searching, and revisiting the pages you want to keep.

Nook is similar in spirit to a dedicated bookmarking tool: folders, tags, favorites, archive, import/export, and automatic page metadata — without social features.

## Screenshots

_Add screenshots of the library, folder sidebar, and add-bookmark dialog here after running the app locally._

## Features

- Account registration, login, and logout
- Save, edit, delete, favorite, archive, and restore bookmarks
- Nested folders with move and rename
- Tags with autocomplete
- Search across title, URL, domain, description, notes, and tags
- Sorting and pagination
- Recently added and recently visited views
- Visit counts
- Duplicate URL detection
- Automatic title/favicon retrieval with graceful failure
- Netscape HTML import and export
- Responsive layout for desktop, tablet, and mobile

## Architecture

The repository is a monorepo:

- `backend/` — FastAPI, SQLAlchemy, Alembic, PostgreSQL
- `frontend/` — React, TypeScript, Vite, Tailwind CSS
- `e2e/` — Playwright happy-path tests

See [docs/architecture.md](docs/architecture.md) for layering, auth, search, and SSRF notes.

## Technology stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic, Argon2, JWT cookies, httpx, BeautifulSoup

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Radix primitives, Lucide icons

**Tooling:** Docker Compose, GitHub Actions, pytest, Vitest, React Testing Library, ESLint, Prettier, Playwright

## Local installation

1. Copy environment defaults:

   ```bash
   cp .env.example .env
   ```

2. Set `SECRET_KEY` to a long random value. Point `DATABASE_URL` at a local PostgreSQL database.

3. Install dependencies and run migrations:

   ```bash
   make install
   make migrate
   ```

4. Start the API and UI:

   ```bash
   make backend
   make frontend
   ```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to `http://localhost:8000`.

Optional demo data (development only):

```bash
make seed
```

Then sign in as `demo@example.com` / `demopassword`.

## Docker installation

```bash
docker compose up --build
```

- Application: http://localhost:8080
- API docs: http://localhost:8080/docs or http://localhost:8000/docs

Docker Compose starts PostgreSQL, the API, and the nginx-hosted frontend. Do not use the bundled development `SECRET_KEY` in production.

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

## Project structure

```text
├── backend/          FastAPI application, Alembic, pytest
├── frontend/         React SPA
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
