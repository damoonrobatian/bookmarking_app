# Deploying Neshanak on DigitalOcean

This is the path used to put Neshanak on a small DigitalOcean droplet so other machines can reach the same library. Docker runs **on the droplet**, not on your laptop.

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
| App URL | https://neshanak.ca |
| Domain | `neshanak.ca` (CIRA; registrar Namespro Solutions Inc.) |
| API docs | https://neshanak.ca/docs (via Caddy → nginx; port 8000 is firewalled) |
| Docker | Official install script on the droplet (`Docker Compose` v2) |
| Repo path on droplet | `/root/bookmarking_app` |
| `.env` | `SECRET_KEY` only (gitignored; Compose interpolates it) |
| Compose | `docker-compose.yml` + `docker-compose.prod.yml` — Caddy 80/443; frontend 8080 is not published on the droplet |
| Firewall | `ufw` active: OpenSSH + `80/tcp` + `443/tcp` + `443/udp` |
| TLS | Caddy (Let's Encrypt) for `neshanak.ca`; `www` redirects to the apex |

Verified: sign-in and save work from a laptop and a phone against that URL.

The only bookmark library is **https://neshanak.ca**. Do not keep a second copy on the laptop.

## What you get

One Ubuntu server running PostgreSQL, the API, and the website via Docker Compose.

- Website: `https://neshanak.ca`
- API docs: `https://neshanak.ca/docs`

Local `docker compose up` (no prod overlay) still serves HTTP at `http://localhost:8080`. The droplet uses `docker-compose.prod.yml` so Caddy terminates TLS and the API sets `COOKIE_SECURE`.

## Cost (as of this write-up)

- **1 GB RAM** Basic droplet: about **$6/month**. This is the smallest size recommended for Neshanak.
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

## 9. Domain (`neshanak.ca`) — DNS live; HTTPS not yet

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

The product name in the app is **Neshanak**. The public hostname is `neshanak.ca`. The Ubuntu droplet hostname and PostgreSQL user/database remain `nook` from the first deploy; renaming those would break the running volume.

Until TLS is on, the app is **http://neshanak.ca:8080** (port **8080** only; `ufw` does not allow 80 or 443 yet). `http://neshanak.ca` without a port is not the app.

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

Namespro support ticket **790542899** (26 Aug 2026, 21:15) confirmed the zone is pointed at `159.89.125.246`. Rechecked the same evening:

- `dig @htns1.namespro.ca neshanak.ca A` → `159.89.125.246`
- `www.neshanak.ca` → `159.89.125.246`
- After flushing the laptop resolver cache, `http://neshanak.ca:8080` served Neshanak
- Some public resolvers (Google anycast) can still answer parking for a few minutes while TTL burns down

`http://neshanak.ca` without a port used to time out (or show Namespro parking if DNS was stale). With Caddy it redirects to HTTPS.

### HTTPS (Caddy + Let's Encrypt)

Production overlay: `docker-compose.prod.yml` plus `Caddyfile`. Local Compose does **not** load that overlay.

On the droplet:

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
cd ~/bookmarking_app
grep -q '^COMPOSE_FILE=' .env || echo 'COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml' >> .env
git pull
docker compose up --build -d
docker compose logs caddy
```

Caddy obtains certificates for `neshanak.ca` and `www.neshanak.ca`, redirects `www` to the apex, and proxies to the frontend container. The prod overlay sets `ENVIRONMENT=production`, `COOKIE_SECURE=true`, and `FRONTEND_URL` / `BACKEND_URL` to `https://neshanak.ca`.

Public **8080** is closed. Use **https://neshanak.ca** only. Sign-in cookies are Secure.

## Continuous deployment

A push to `main` runs `.github/workflows/ci-cd.yml`: tests, then SSH to the droplet and rebuild Compose. Pull requests run tests only.

The droplet is reset to `origin/main` on each deploy (`git reset --hard`). Keep secrets in the droplet `.env` (gitignored), not in the repo. The deploy key is the GitHub Actions secret `DROPLET_SSH_KEY`; it is not the laptop SSH key.

The 1 GB droplet uses a 2 GB `/swapfile`. Without it, `docker compose --build` can exhaust RAM and the machine stops answering SSH and HTTPS. After a new droplet:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
printf 'vm.swappiness=10\n' > /etc/sysctl.d/99-swap.conf
sysctl -p /etc/sysctl.d/99-swap.conf
```


Manual deploy (if the Action fails):

```bash
cd ~/bookmarking_app
git fetch origin main
git reset --hard origin/main
docker compose up --build -d
```

To rotate the deploy key: generate a new ed25519 key, append the public half to `/root/.ssh/authorized_keys` on the droplet, set repository secret `DROPLET_SSH_KEY` to the private half, then remove the old public key from `authorized_keys`.

```bash
cd ~/bookmarking_app
docker compose ps
docker compose logs -f backend
docker compose restart
docker compose down          # stop containers; data volume is kept
```

The droplet `.env` must include `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` so Caddy is included.

Routine updates go through GitHub Actions on `main`. The commands above are for the droplet shell if you need to inspect or recover.

## Security notes

Done on this droplet:

- `ufw` allows SSH, **80**, and **443**. Public access to **5432**, **8000**, and **8080** is denied.
- Caddy serves HTTPS for `neshanak.ca`. Auth cookies are Secure.

Still open:

- Compose still publishes `5432:5432` and `8000:8000`. Removing those publishes from `docker-compose.yml` is extra hardening on top of `ufw`.
- A DigitalOcean cloud firewall (22, 80, 443) can sit in front of `ufw`.
- Apply Ubuntu security updates when you can: `apt update && apt upgrade`.

## One library

Bookmarks, accounts, and passwords live only on this droplet. Use **https://neshanak.ca**. `make backend` / `make frontend` on the laptop is for editing code, not for the real library.
