# Deploying Nook on DigitalOcean

This is the path used to put Nook on a small DigitalOcean droplet so other machines can reach the same library. Docker runs **on the droplet**, not on your laptop.

You do not need Docker installed locally for this.

## This deployment (August 2026)

These are the choices and results from the first live deploy:

| Item | Result |
| --- | --- |
| Provider | DigitalOcean droplet |
| Hostname | `nook` |
| Image | Ubuntu 24.04 LTS |
| Size | Basic, 1 GB RAM (~$6/month) |
| Region | Chosen in the DigitalOcean UI (Toronto if listed) |
| Auth | Existing laptop SSH key (no root password) |
| Automated backups | Enabled (~20% extra) |
| Public IPv4 | `159.89.125.246` |
| App URL (until HTTPS) | http://159.89.125.246:8080 |
| Domain | `neshanak.ca` (CIRA; registrar Namespro Solutions Inc.) |
| API docs | http://159.89.125.246:8080/docs (via nginx; port 8000 is firewalled) |
| Docker | Official install script on the droplet (`Docker Compose` v2) |
| Repo path on droplet | `/root/bookmarking_app` |
| `.env` | `SECRET_KEY` only (gitignored; Compose interpolates it) |
| Compose | `docker compose up --build -d` — `db` healthy, `backend` 8000, `frontend` 8080 |
| Firewall | `ufw` active: OpenSSH + `8080/tcp` only |
| TLS | Not yet. Domain is registered; live DNS was still Namespro parking as of 26 Aug 2026 evening. HTTPS waits until `neshanak.ca` resolves to `159.89.125.246`. |

Verified: sign-in and save work from a laptop and a phone against that URL.

The droplet database is **empty until you register there**. Laptop PostgreSQL (`make backend` / `make frontend`) is a separate library.

## What you get

One Ubuntu server running PostgreSQL, the API, and the website via Docker Compose.

- Website: `http://YOUR.DROPLET.IP:8080`
- API docs: `http://YOUR.DROPLET.IP:8080/docs`

This deploy is **HTTP**, not HTTPS. Cookies work on that origin with `COOKIE_SECURE=false` (Compose default). Add a domain and TLS before treating this as a hardened public site.

## Cost (as of this write-up)

- **1 GB RAM** Basic droplet: about **$6/month**. This is the smallest size recommended for Nook.
- **512 MB** is too small for PostgreSQL + API + website in Docker.
- **2 GB** (~$12/month) is more comfortable, not required.
- DigitalOcean **automated backups** are optional; they usually add about **20%** of the droplet price (about $1.20/month on a $6 plan). They snapshot the whole disk, including the database volume.

## 1. Create the droplet

1. Sign in at [https://www.digitalocean.com](https://www.digitalocean.com).
2. **Create** → **Droplets**.
3. Settings used:

   - **Region:** Toronto if listed, otherwise New York
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic, **1 GB RAM**
   - **Authentication:** **SSH keys** (not a root password)
   - **Hostname:** `nook`
   - **Automated backups:** on if you accept the extra cost

4. If DigitalOcean already lists an SSH key from your laptop, select it. That is the public half of the key; SSH works if this computer has the matching private key.
5. If the SSH key list is empty, stop and add a key from this machine before creating the droplet.
6. Create the droplet and wait until it has an **IPv4** address.

## 2. SSH in

On your laptop:

```bash
ssh root@YOUR.DROPLET.IP
```

The first connection asks you to trust the host fingerprint. Type `yes`.

You should get a prompt like `root@nook:~#`.

## 3. Install Docker on the droplet

```bash
curl -fsSL https://get.docker.com | sh
```

Confirm Compose is available:

```bash
docker compose version
```

You should see Docker Compose v2.x. The install script also enables and starts the Docker daemon.

## 4. Clone this repository

```bash
apt-get install -y git
git clone https://github.com/damoonrobatian/bookmarking_app.git
ls bookmarking_app
```

`git` may already be installed. You should see `backend`, `frontend`, and `docker-compose.yml`.

## 5. Set `SECRET_KEY`

Do **not** use the example secret from the repo. On the droplet:

```bash
cd ~/bookmarking_app
openssl rand -base64 48
```

Create `~/bookmarking_app/.env` (Compose loads this file automatically):

```bash
nano .env
```

One line, no spaces around `=`:

```bash
SECRET_KEY=paste-the-openssl-output-here
```

Save: Ctrl+O, Enter, Ctrl+X.

Never commit `.env`. It is gitignored. If the secret is ever pasted into chat, email, or a screenshot, generate a new one, replace the line in `.env`, and recreate the backend container:

```bash
docker compose up -d --force-recreate backend
```

That invalidates existing sign-in cookies. Sign in again afterward.

## 6. Start the stack

```bash
cd ~/bookmarking_app
docker compose up --build -d
```

The first build downloads base images and can take several minutes. When the prompt returns:

```bash
docker compose ps
```

`db`, `backend`, and `frontend` should be running (the database may show as healthy).

If something failed:

```bash
docker compose logs --tail=80
```

## 7. Open the app

In a browser:

```text
http://YOUR.DROPLET.IP:8080
```

Register a new account on this server. This is a **different** database from the one on your laptop. Bookmarks you saved locally are not copied automatically. Using the same email and password as the laptop still creates a **new** user row on the droplet.

## 8. Host firewall (`ufw`)

Compose still publishes container ports on the droplet. `ufw` is what keeps PostgreSQL (**5432**) and the raw API (**8000**) off the public internet.

On the droplet:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 8080/tcp
ufw --force enable
ufw status
```

Expected status:

```text
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
8080/tcp                   ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
8080/tcp (v6)              ALLOW       Anywhere (v6)
```

Confirm the site still loads on port **8080** after enabling the firewall. `/docs` stays available through nginx at `http://YOUR.DROPLET.IP:8080/docs`. Direct access to `:8000` should fail from the internet.

Do not add `5432` or `8000` to `ufw` unless you have a short-term reason.

## 9. Domain (`neshanak.ca`) — in progress

HTTPS needs a **name** at CIRA, not only the droplet IP. Let's Encrypt will not issue a certificate for `159.89.125.246`.

### What was chosen

| Item | Result |
| --- | --- |
| Name | `neshanak.ca` (نشانک, bookmark) |
| Registry | CIRA (Ottawa), not Verisign `.com` |
| Registrar | [Namespro](https://www.namespro.ca) (CIRA-certified) |
| Term | 3 years, expiry **2029-08-26** |
| Web setting | **5) DNS Hosting - Free** (not parking, not paid Linux/Windows hosting) |
| Name servers | `htns1.namespro.ca`, `htns2.namespro.ca`, `htns3.namespro.ca` |
| Intended A records | `@` / `neshanak.ca` → `159.89.125.246`; `www` → `159.89.125.246` |

The site title in the app can stay **Nook**. The public hostname is `neshanak.ca`.

Until DNS and TLS are working, keep using **http://159.89.125.246:8080**.

### Registry vs shop list

CIRA will only hold **one** `neshanak.ca`. After two checkouts, Namespro’s domain list showed two rows with the **same** expiry (2029). That is a duplicate listing of one registration, not two names on the internet.

WHOIS (26 Aug 2026) showed a single CIRA object, Namespro as registrar, status `addPeriod`, expiry 2029-08-26.

The first Namespro checkout did not appear in the account or on the card for some time; a second checkout then went through. Two invoices exist (domain + WHOIS, then domain only). A sales ticket asked Namespro to **refund the second invoice** and **keep** the domain, WHOIS, and the first invoice. Do not ask them to delete `neshanak.ca`.

### DNS at Namespro (not the left-menu ad)

**HOSTING → DNS hosting** in the left sidebar is a marketing page (`your-domain.ca` samples). It is not the zone for this name.

1. **MANAGE → my domains** → click **`neshanak.ca`**.
2. **Web settings → type** → **5) DNS Hosting - Free**. Save. Skip paid Linux/Windows/unlimited hosting.
3. **click here to launch zone editing tool**.
4. Add **A** records as in the table above. For `www`, type only `www` in the host box (the form already appends `.neshanak.ca`).
5. Click **Update Zone** (not only Create).

Check the **source** nameserver, not only a browser:

```bash
dig @htns1.namespro.ca neshanak.ca A +short
```

You want `159.89.125.246`. `51.222.143.2` is Namespro parking.

**TTL** is how many seconds a resolver may cache an answer (here often 3600). If `htns1` itself still returns parking, waiting on TTL will not help; the published zone is wrong. If `htns1` is already the droplet IP, public resolvers can take up to one TTL to catch up.

As of the evening of 26 Aug 2026, the Namespro panel listed the droplet A records while `htns1` still answered parking. That is a publish lag or a Namespro bug (possibly related to the duplicate domain row). Recheck `dig`; if it stays parking for more than an hour, open a **technical** ticket asking them to publish the zone.

### After DNS matches the droplet

Still to do (not done yet):

- Allow **443/tcp** (and **80/tcp** for HTTP-01) on `ufw`; obtain a certificate for `neshanak.ca`.
- Serve the app on 443 so the URL is `https://neshanak.ca` without `:8080`.
- Set `COOKIE_SECURE=true` and point `FRONTEND_URL` / `BACKEND_URL` at `https://neshanak.ca`.

## Useful commands (on the droplet)

```bash
cd ~/bookmarking_app
docker compose ps
docker compose logs -f backend
docker compose restart
docker compose down          # stop containers; data volume is kept
```

To pull later code changes:

```bash
cd ~/bookmarking_app
git pull
docker compose up --build -d
```

## Security notes

Done on this droplet:

- `ufw` allows SSH and **8080** only. Public access to **5432** and **8000** is denied even though Compose still maps those ports on localhost.

Still open:

- There is no HTTPS yet. Do not turn on `COOKIE_SECURE=true` until `neshanak.ca` has TLS.
- `FRONTEND_URL` / `BACKEND_URL` in Compose are still `http://localhost:8080`. The browser talks to nginx on port 8080, which proxies `/api` to the backend, so login works over the droplet IP. Point those URLs at `https://neshanak.ca` when TLS is on.
- Compose still publishes `5432:5432`. Removing that publish from `docker-compose.yml` is extra hardening on top of `ufw`.
- A DigitalOcean cloud firewall (same ports: 22 and 8080) can sit in front of `ufw`.
- Apply Ubuntu security updates when you can: `apt update && apt upgrade`.

## Local PostgreSQL vs this droplet

Running Nook on your laptop (`make backend` / `make frontend`) uses your **local** database. The droplet is a **second** instance. Syncing across machines means everyone uses the droplet URL, not the laptop.
