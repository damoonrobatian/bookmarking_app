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
