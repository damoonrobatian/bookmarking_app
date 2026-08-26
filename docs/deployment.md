# Deploying Nook on DigitalOcean

This is the path used to put Nook on a small DigitalOcean droplet so other machines can reach the same library. Docker runs **on the droplet**, not on your laptop.

You do not need Docker installed locally for this.

## What you get

One Ubuntu server running PostgreSQL, the API, and the website via Docker Compose.

- Website: `http://YOUR.DROPLET.IP:8080`
- API docs: `http://YOUR.DROPLET.IP:8000/docs`

This first deploy is **HTTP**, not HTTPS. Cookies work on that origin with `COOKIE_SECURE=false` (Compose default). Add a domain and TLS before treating this as a hardened public site.

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

Never commit `.env`. It is gitignored.

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

Register a new account on this server. This is a **different** database from the one on your laptop. Bookmarks you saved locally are not copied automatically.

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

## Security notes for this first deploy

- PostgreSQL is published on port **5432** in `docker-compose.yml`. On a public IP that is a risk. Restrict it with a DigitalOcean firewall (allow 22, 8080, and optionally 8000; do not allow 5432 from the internet) as a follow-up.
- There is no HTTPS yet. Do not turn on `COOKIE_SECURE=true` until you have TLS.
- `FRONTEND_URL` in Compose is still `http://localhost:8080`. The browser talks to nginx on port 8080, which proxies `/api` to the backend, so login still works over the droplet IP. Point those URLs at your real origin when you add a domain.
- Apply Ubuntu security updates when you can: `apt update && apt upgrade`.

## Local PostgreSQL vs this droplet

Running Nook on your laptop (`make backend` / `make frontend`) uses your **local** database. The droplet is a **second** instance. Syncing across machines means everyone uses the droplet URL, not the laptop.
