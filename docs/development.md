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

## Theme

Settings → **Theme** lists six palettes: Terracotta, Gray, Teal, Green, Purple, and Blue. The choice is saved on the account and used for buttons and the header mark. The browser tab icon and the unpacked `extension/` button stay terracotta.

Header marks are the PNGs in `frontend/public/themes/`. `extension/icons/` is only the toolbar button for Load unpacked.

## Library cards

The All Bookmarks, folder, favorites, archive, and search pages share list and grid layouts. Compact format is a separate toggle in the same control: it keeps the current layout and shows only the favicon and title on each card. Both choices stay in this browser (`localStorage`).

## Overlay menu

Below `1024px` wide, including a zoomed desktop window, the left menu is an overlay. Open it with the menu button. The account name sits under the logo; Log out is at the bottom. Choosing All Bookmarks, a folder, Settings, or another destination closes it. Expanding a folder or using folder actions leaves it open. Tap the dimmed page or the close control to dismiss it without navigating.

## Save from the browser

Settings → **Save From The Browser** lists three ways to add a save button on a computer. The first way is the easiest. Methods 2 and 3 each have their own Chrome/Edge or Firefox buttons. Method 4 is for Google Chrome on Android: add Neshanak to the home screen, then Share → Neshanak.

### 1. Drag to the bookmarks bar

This adds a **+Neshanak** button to the bookmarks bar (the strip under the address bar). It works in Google Chrome and Mozilla Firefox. In Settings, drag **Drag me to the bookmarks bar** onto the bar. On the bar the button is named **+Neshanak**.

1. Sign in at https://neshanak.ca, open **Settings**, then **Save From The Browser**.
2. If the bookmarks bar is hidden, press **Ctrl+Shift+B** (Mac: **Command+Shift+B**).
3. Drag the orange button onto the bar.
4. Open a page you want to save and click **+Neshanak**. A popup opens `https://neshanak.ca/save` with the address filled in. Title and tags are suggested from the tab title, the page heading, and your existing tags when they match.

If popups are blocked, allow popups for `neshanak.ca` and try again.

### 2. Button next to the address bar

This puts a Neshanak button next to the address bar. Load the `extension/` folder from this project:

- Chrome: `chrome://extensions` → Developer mode → Load unpacked → select the `extension` folder
- Edge: `edge://extensions`, then the same steps
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → select `extension/manifest.json`

The extension always opens `https://neshanak.ca/save`. You must already be signed in there. Firefox removes this button when the browser restarts; add it again after a restart.

### 3. Bookmarks bar button with icon

This adds a **+Neshanak** button to the bookmarks bar with the Neshanak picture. Download **Bar button**, then import the HTML file. Chrome and Edge: the three dots at the top right of the **browser window** (beside the profile), then **Bookmarks and lists** → **Import bookmarks and settings**. Pick **Bookmarks HTML file** if asked, and open `Save To Neshanak.html`. Drag **+Neshanak** from **Other bookmarks** onto the bar. Firefox: delete any blank copy first, then **Manage Bookmarks** (Ctrl+Shift+O) → **Import and Backup** → **Import Bookmarks from HTML** (not Settings → Import data). Firefox puts the item in the Bookmarks Menu; drag it onto the toolbar.

### 4. Share from Chrome on Android

This puts Neshanak in the Android share list. It does not work on iPhone.

1. If Neshanak is already on the home screen, long-press the icon and remove it. Uninstall it from Android **Settings → Apps** if it is listed there.
2. Open https://neshanak.ca in **Google Chrome** and sign in. Stay on **Settings → Save From The Browser**.
3. If **Add to this phone** appears, tap it. If not, tap the three dots, then **Cast, save and share**, then **Install app**. Do not use **Add to Home screen**; that only makes a shortcut, and Share will not include Neshanak.
4. Open a page you want to save, tap **Share**, then **Neshanak**.
