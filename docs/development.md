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

## Save from the browser

This adds a clickable **Save To Neshanak** control on pages you want to keep. Settings → **Save From The Browser** lists three methods, easiest first. Pick **Chrome or Edge** or **Firefox** before methods 2 and 3; only that browser’s steps are shown.

### 1. Drag to the bookmarks bar (easiest, no icon)

A bookmarklet: a bookmark whose address is a small script. Drag **Save To Neshanak** onto the **bookmarks bar** (the strip under the address bar). The save action works. The bar button is text only; Chrome and Edge will not show the Neshanak icon on a dragged `javascript:` bookmark.

1. Sign in at https://neshanak.ca, open **Settings**, then **Save From The Browser**.
2. Show the bookmarks bar if it is hidden: **Ctrl+Shift+B** (Mac: **Command+Shift+B**).
3. Drag the control onto the bar.
4. Visit the page you want to save and click **Save To Neshanak**. A popup opens `https://neshanak.ca/save` with the address filled in. Title and tags are suggested from the tab title, the page heading, and your existing tags when they match.

If popups are blocked, allow popups for `neshanak.ca` and try again.

### 2. Button next to the address bar

Load the unpacked folder `extension/` from this repository:

- Chrome: `chrome://extensions` → Developer mode → Load unpacked → select the `extension` folder
- Edge: `edge://extensions`, then the same steps
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → select `extension/manifest.json`

The extension always opens `https://neshanak.ca/save`. You must already be signed in there. Firefox removes a temporary add-on when the browser restarts; load it again after a restart.

### 3. Bookmarks bar button with icon (hardest)

Download **Bar button**, then import the HTML file. Chrome and Edge: the three dots at the top right of the **browser window** (beside the profile), then **Bookmarks and lists** → **Import bookmarks and settings**. Pick **Bookmarks HTML file** if asked, and open `Save To Neshanak.html`. Drag **Save To Neshanak** from **Other bookmarks** onto the bar. Firefox: delete any blank copy first, then **Manage Bookmarks** (Ctrl+Shift+O) → **Import and Backup** → **Import Bookmarks from HTML** (not Settings → Import data). Firefox puts the item in the Bookmarks Menu; drag it onto the toolbar.
