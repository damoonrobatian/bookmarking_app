# Development

## Prerequisites

- Python 3.12+ (the backend uses `uv`)
- Node.js 20+
- PostgreSQL 16, or Docker Compose for the full stack

## First-time setup

```bash
cp .env.example .env
# set SECRET_KEY to a long random string
make install
```

Your real bookmarks are at **https://neshanak.ca**. A local database is only for editing code.

Create a throwaway PostgreSQL database that matches `DATABASE_URL`, then:

```bash
make migrate
make backend    # terminal 1
make frontend   # terminal 2
```

The UI is at `http://localhost:5173`. API docs are at `http://localhost:8000/docs`. Do not use that URL as a second library.

## Docker

```bash
docker compose up --build
```

- App: `http://localhost:8080`
- API directly: `http://localhost:8000/docs`

DigitalOcean droplet setup (create the VM, SSH, install Docker, clone, secret, Compose, `ufw`) and the `neshanak.ca` / Namespro DNS notes are in [deployment.md](deployment.md). The live instance is `https://neshanak.ca`.

## Tests

```bash
make test
make test-backend
make test-frontend
```

Backend tests use an in-memory SQLite database and do not need PostgreSQL.

GitHub Actions runs the same backend and frontend checks on every push and pull request. A green `main` push then SSHs to the droplet and rebuilds Compose. See [deployment.md](deployment.md).

End-to-end tests live in `e2e/` and expect the app to already be running:

```bash
cd e2e && npm install && npx playwright install chromium && npm test
```

## Seed data

Never run this against production.

```bash
make seed
```

This creates `demo@example.com` / `demopassword` with sample folders and bookmarks.

## Folder deletion policy

Deleting a folder moves its bookmarks and subfolders to the parent folder. Root folders move their contents to the unfiled library. The UI asks for confirmation before this happens.

## Duplicate bookmarks

Normalized URLs are unique per user. Creating a duplicate returns HTTP 409 and the existing bookmark so the UI can open or update it instead of inserting a second copy.

## Account deletion

`DELETE /api/auth/account` requires the current password. It removes the user and every bookmark, folder, and tag they own. Folder deletion in the library still reparents contents; account deletion does not.
