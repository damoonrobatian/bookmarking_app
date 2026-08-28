# Architecture decisions

## Decision

Use HTTP-only cookies for authentication.

### Reason

Reduces exposure of long-lived credentials to browser JavaScript. The SPA and API share an origin in Docker and during Vite proxy development, so cookie auth works without a custom CSRF token for same-site requests.

### Alternatives considered

localStorage JWT access tokens.

### Date

2026-08-25

---

## Decision

Enforce uniqueness on `(user_id, normalized_url)` and return HTTP 409 with the existing bookmark.

### Reason

A personal library almost never needs the same URL twice. Blind rejection is unfriendly, so the API includes the existing record and the UI offers to open it.

### Alternatives considered

Allow duplicates and only warn in the UI.

### Date

2026-08-25

---

## Decision

Deleting a folder reparents its bookmarks and child folders rather than cascading deletes.

### Reason

Accidental folder deletion should not destroy a library. Confirmation is still required.

### Alternatives considered

Cascade-delete all nested bookmarks.

### Date

2026-08-25

---

## Decision

Use SQLite only in automated tests; PostgreSQL is the primary database.

### Reason

Tests should run in CI without a database container. Production and local Docker use PostgreSQL.

### Alternatives considered

Require PostgreSQL for every pytest run.

### Date

2026-08-25

---

## Decision

Login Remember Me controls cookie lifetime, not token expiry.

### Reason

An unchecked box should drop the session when the browser closes. The JWT still has an `exp` claim; persistence is only the cookie `Max-Age`. The refresh token payload stores `remember` so rotation does not silently upgrade a session cookie to a persistent one.

### Alternatives considered

Always persist cookies; store Remember Me only in localStorage.

### Date

2026-08-26

---

## Decision

Title Case is only for titles; other UI chrome uses sentence case. User content is not rewritten.

### Reason

Capitalizing every word made buttons, errors, and helper text look shouty. Page titles, dialog titles, settings section titles, and nav labels stay Title Case so they still read as headings. Descriptions, buttons, labels, empty states, and errors use sentence case. Bookmark titles, folder names, tags, emails, and URLs belong to the user and stay as entered.

### Alternatives considered

Title Case on every word in UI chrome; Title Case that leaves articles lowercase.

### Date

2026-08-27

---

## Decision

Terminate TLS with Caddy in a production Compose overlay, not in the local Compose file.

### Reason

Let's Encrypt HTTP-01 needs ports 80 and 443 on the public hostname. Local `docker compose up` should stay HTTP on 8080. `docker-compose.prod.yml` adds Caddy, sets Secure cookies, and unpublishes frontend 8080 on the droplet.

### Alternatives considered

Certbot on the host; Traefik; putting Caddy in the base Compose file; leaving public `:8080` next to HTTPS.

### Date

2026-08-27

---

## Decision

The login Remember Me box is checked by default. `GET /api/auth/me` may refresh an expired access cookie.

### Reason

A personal library should stay signed in across browser restarts unless the user opts out. Access cookies still expire in 30 minutes; without refreshing `/me`, a reload sent people back to login even with Remember Me on.

### Alternatives considered

Default off (shared-computer caution); lengthen the access cookie to 14 days.

### Date

2026-08-27

---

## Decision

Deploy the droplet from GitHub Actions after CI on `main`, using a dedicated SSH key in repository secrets.

### Reason

The live library is this one machine. A push should update https://neshanak.ca without a manual `git pull`. The laptop key stays off GitHub; Actions uses `DROPLET_SSH_KEY`.

### Alternatives considered

Manual SSH after every push; a webhook listener on the droplet; DigitalOcean App Platform.

### Date

2026-08-27

---

## Decision

Save the current page through a same-origin `/save` popup, installed as a bookmarklet or an unpacked toolbar extension.

### Reason

A click on another site cannot write to Neshanak directly; the popup must run on `https://neshanak.ca` so HTTP-only cookies are sent. A bookmarklet is enough for most use. Chrome and Edge refuse a custom icon on a dragged `javascript:` bookmark, so Settings also offers a Netscape HTML download with an `ICON` data URI. A small MV3 extension (`extension/`) adds a toolbar button without a store listing or a separate API key. Tag suggestions stay conservative (page keywords plus the user's own tags found in the page text) so the library is not filled with noisy auto-tags.

### Alternatives considered

A browser-store extension with its own OAuth client; a content-script overlay; creating the bookmark with no confirmation.

### Date

2026-08-27

---

## Decision

On Android, save a page through the system share sheet into `/save`, not a mobile toolbar button.

### Reason

Chrome on Android will not load the unpacked `extension/` or a bookmarks-bar bookmarklet the way a computer does. If the site is installed as a small PWA, `share_target` can receive the current URL and open the same `/save` form. iPhone Safari does not support share targets.

### Alternatives considered

An iOS Shortcut; a Safari bookmarklet; a Play Store wrapper.

### Date

2026-08-28

---

## Decision

Store theme on the account. Change accent color and the header mark only; keep the tab favicon and unpacked extension terracotta.

### Reason

The library is one person's, so the palette should follow the account, not only this browser. Six named marks in `frontend/public/themes/` are enough. Recoloring the tab icon and the toolbar extension per theme would mean a set of favicons and a rebuilt `extension/` for each palette, for little benefit on a tiny chrome control.

### Alternatives considered

Device-only `localStorage` with no API field; recolor the favicon and extension for every palette.

### Date

2026-08-27
