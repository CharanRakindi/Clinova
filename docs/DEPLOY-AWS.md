# Deploy Clinova on AWS

**Recommended path for this project:** **Amazon Lightsail or EC2 + Docker Compose**  
Same stack as your Mac (`web` + `api` + `mongo`). No ECS/EKS required for a portfolio demo.

| Option | Effort | Cost (approx) | Best for |
|--------|--------|---------------|----------|
| **Lightsail** | Lowest | ~$5–12/mo | Portfolio, demos |
| **EC2** | Low | Free tier / ~$8–15/mo | Learning AWS EC2 |
| ECS Fargate + ALB | High | Higher | Production multi-service |
| Elastic Beanstalk | Medium | Variable | Less control |

---

## Architecture (Lightsail / EC2)

```
Internet
   │
   ▼
:80 / :443  ──►  web (nginx SPA)
                    │  /api, /socket.io, /health
                    ▼
                 api (Express :5001)
                    │
                    ▼
                 mongo (Docker volume)
```

Cookies stay **same-site** (one public URL). Use HTTPS in production (`COOKIE_SECURE=true`).

---

## Option 1 — Amazon Lightsail (easiest)

### 1. Create instance

1. AWS Console → **Lightsail** → **Create instance**
2. Platform: **Linux/Unix**
3. Blueprint: **OS Only** → **Ubuntu 22.04** (or 24.04)
4. Plan: **$5–10/mo** (1–2 GB RAM) — 512 MB is tight for build; **1 GB+** recommended
5. Name: `clinova-prod`
6. Create instance

### 2. Networking

**Networking** tab → open:

| Port | Protocol | Application |
|------|----------|-------------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS (after cert) |

Optional: create a **static IP** and attach it (so the IP does not change).

### 3. SSH in

Lightsail → instance → **Connect using SSH**, or:

```bash
ssh -i ~/LightsailDefaultKey-*.pem ubuntu@YOUR_PUBLIC_IP
```

### 4. Install Docker

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# disconnect and reconnect SSH so docker group applies
```

### 5. Deploy Clinova

```bash
git clone https://github.com/CharanRakindi/Clinova.git
cd Clinova
cp .env.docker.example .env.docker
nano .env.docker
```

Set at least:

```env
CLIENT_URL=http://YOUR_PUBLIC_IP
WEB_PORT=80
JWT_ACCESS_SECRET=paste_a_long_random_string_here_32plus
JWT_REFRESH_SECRET=paste_another_long_random_string_here
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

> Use `COOKIE_SECURE=true` and `CLIENT_URL=https://your-domain.com` only after HTTPS is working.

```bash
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker --profile seed run --rm seed
```

### 6. Open the app

**http://YOUR_PUBLIC_IP**

| Role | Login |
|------|--------|
| Admin | `admin@clinova.com` / `password123` |
| Doctor | `sarah@clinova.com` / `password123` |
| Patient | `john@example.com` / `password123` |

Health check: `http://YOUR_PUBLIC_IP/health`

### 7. HTTPS with a domain (recommended)

1. Point DNS **A record** → static IP  
2. Install Caddy:

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

3. Change compose so web listens on **localhost only** (Caddy terminates TLS):

In `.env.docker`:

```env
CLIENT_URL=https://app.yourdomain.com
WEB_PORT=8080
COOKIE_SECURE=true
```

```bash
docker compose --env-file .env.docker up -d
```

`/etc/caddy/Caddyfile`:

```caddy
app.yourdomain.com {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo systemctl reload caddy
```

4. Open firewall **443** in Lightsail networking.

---

## Option 2 — Amazon EC2

### 1. Launch instance

1. **EC2** → **Launch instance**
2. Name: `clinova-prod`
3. AMI: **Ubuntu Server 22.04 LTS**
4. Type: **t2.micro** (free tier) or **t3.small** (smoother builds)
5. Key pair: create/download `.pem`
6. Security group inbound:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

7. Storage: 20 GB gp3  
8. Launch

### 2. Connect

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@EC2_PUBLIC_DNS
```

### 3. Same Docker steps as Lightsail

Use the **Install Docker** + **Deploy Clinova** sections above (identical).

Or run the bootstrap script from the repo:

```bash
curl -fsSL https://raw.githubusercontent.com/CharanRakindi/Clinova/main/scripts/aws-bootstrap.sh | bash
# then clone, configure .env.docker, compose up (see script output)
```

---

## Option 3 — ECS Fargate (advanced outline)

Use this only if you need fully managed containers without SSH:

1. **ECR** — push `clinova-api` and `clinova-web` images  
2. **ECS cluster** + **Fargate** services for `api` and `web`  
3. **MongoDB Atlas** (easier than DocumentDB for Mongoose)  
4. **ALB** path rules: `/api/*`, `/socket.io/*`, `/health` → api; `/*` → web  
5. **Secrets Manager** for JWT + `MONGO_URI`  
6. Set `CLIENT_URL` to the ALB HTTPS URL; `COOKIE_SECURE=true`

This is significantly more setup than Lightsail/EC2 compose. Prefer compose unless you specifically need Fargate.

---

## Useful commands (on the server)

```bash
cd ~/Clinova   # or your clone path

docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f api
docker compose --env-file .env.docker pull   # if using remote images
docker compose --env-file .env.docker up --build -d

# re-seed (wipes demo data in the mongo volume)
docker compose --env-file .env.docker --profile seed run --rm seed

docker compose --env-file .env.docker down
```

### Update after a git push (manual)

```bash
cd ~/Clinova
git pull origin main
docker compose --env-file .env.docker up --build -d
```

Or use **Continuous deploy** (below) so every successful CI on `main` updates the server automatically.

---

## Continuous deploy (GitHub Actions → SSH)

After the **first** manual deploy (clone + `.env.docker` + compose up), you can automate updates.

**Flow:** push to `main` → **CI** (lint/test/Docker) → on success → **Deploy** SSHs to AWS → `git reset --hard origin/main` → `docker compose up --build -d` → health check.

You can also run **Actions → Deploy → Run workflow** for a manual deploy.

### 1. Create an SSH deploy key (on your Mac)

```bash
ssh-keygen -t ed25519 -C "clinova-github-deploy" -f ~/.ssh/clinova_deploy -N ""
```

### 2. Install the **public** key on the server

In AWS **Connect** (or SSH):

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo 'PASTE_CONTENTS_OF_clinova_deploy.pub_HERE' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Or from your Mac (if your existing key already works):

```bash
ssh-copy-id -i ~/.ssh/clinova_deploy.pub ubuntu@YOUR_PUBLIC_IP
```

### 3. Allow GitHub Actions to reach SSH

Security group / Lightsail firewall: **TCP 22** must accept connections from the internet  
(or at least from GitHub-hosted runners). If SSH is locked to “My IP” only, CD will fail.

### 4. GitHub repository secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Example | Required |
|--------|---------|----------|
| `DEPLOY_HOST` | `18.61.157.101` | Yes |
| `DEPLOY_USER` | `ubuntu` | Yes |
| `DEPLOY_SSH_KEY` | Full private key (`-----BEGIN …` through `END …`) from `~/.ssh/clinova_deploy` | Yes |

Optional **variable** (not secret):

| Variable | Example | Default |
|----------|---------|---------|
| `DEPLOY_PATH` | `/home/ubuntu/Clinova` | `$HOME/Clinova` |

### 5. Server prerequisites (one-time)

Already done if the app is live:

- Repo cloned at `DEPLOY_PATH` (default `~/Clinova`)
- `.env.docker` present with secrets + `CLIENT_URL`
- Docker installed; deploy user can run `docker` (or `sudo docker`)
- App was started once with compose

Prefer HTTPS clone for public repos so `git fetch` needs no credentials:

```bash
cd ~/Clinova
git remote -v
# if needed:
git remote set-url origin https://github.com/CharanRakindi/Clinova.git
```

### 6. Verify

1. Push a small change to `main`, or **Actions → Deploy → Run workflow**
2. Open **Actions** → **Deploy** → confirm green
3. Hit `http://YOUR_PUBLIC_IP/health`

### Troubleshooting CD

| Problem | Fix |
|---------|-----|
| Missing secret error | Add `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` |
| SSH timeout / connection refused | Open port **22**; check host/user; public key on server |
| Permission denied (publickey) | Private key secret must match `authorized_keys` entry; paste full key including headers |
| `~/Clinova` not found | Set `DEPLOY_PATH` variable or clone into `$HOME/Clinova` |
| `.env.docker` missing | Create it once on the server (never commit it) |
| Docker permission denied | `sudo usermod -aG docker ubuntu` then reconnect once; workflow falls back to `sudo docker` |
| Deploy skipped after push | Only runs when **CI** succeeds; fix CI first |
| Build OOM on instance | Use ≥2 GB RAM or build less often |

Workflow file: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

---

## Environment reference (AWS production)

| Variable | Example | Notes |
|----------|---------|--------|
| `CLIENT_URL` | `http://3.x.x.x` or `https://app.example.com` | Must match browser origin |
| `WEB_PORT` | `80` or `8080` (behind Caddy) | Host port for nginx |
| `JWT_ACCESS_SECRET` | long random | Required |
| `JWT_REFRESH_SECRET` | long random | Required |
| `COOKIE_SECURE` | `false` on HTTP IP; `true` on HTTPS | Required for Secure cookies |
| `COOKIE_SAMESITE` | `lax` | Use `none` only for cross-site API |
| `TRUST_PROXY` | set by compose to `1` | Needed behind reverse proxy |

Mongo runs **inside** compose (`mongodb://mongo:27017/clinova`). Data lives in Docker volume `mongo_data`.

Optional later: replace with **MongoDB Atlas** by changing `MONGO_URI` in `docker-compose.yml` / env and removing the `mongo` service.

---

## Security checklist

- [ ] Change demo passwords (or re-seed only for private demos)  
- [ ] Prefer HTTPS + domain for anything public  
- [ ] Prefer a dedicated **deploy SSH key** (not your personal laptop key) for GitHub Actions  
- [ ] If not using CD, restrict SSH to your IP; if using CD, port 22 must allow runners (or use a bastion/self-hosted runner later)  
- [ ] Never commit `.env.docker` or private keys  
- [ ] Enable Lightsail/EC2 automatic snapshots if you care about data  

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Page won’t load | Security group / Lightsail firewall: open 80 |
| `JWT_ACCESS_SECRET` error on compose | Fill secrets in `.env.docker` |
| Build OOM killed | Use 2 GB instance or build images elsewhere and pull |
| Login cookies fail on HTTPS | `COOKIE_SECURE=true` and correct `CLIENT_URL` |
| 502 / API down | `docker compose logs api` — check Mongo healthy |
| Free disk full | `docker system prune -a` carefully |

---

## After deploy — README live demo

Update the root README:

```md
**Live:** http://YOUR_PUBLIC_IP   (or https://your-domain.com)
```

Then commit/push when ready.
