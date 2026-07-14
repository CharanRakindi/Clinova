# Clinova

Full-stack **Electronic Health Record (EHR)** and clinic operations platform (MERN).  
Cinematic marketing site, role-based workspaces, JWT cookie auth, and Socket.io notifications.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Lightsail%20%2F%20EC2-FF9900?logo=amazon-aws&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![CD](https://img.shields.io/badge/CD-SSH%20Deploy-2088FF?logo=githubactions&logoColor=white)

**Repo:** [github.com/CharanRakindi/Clinova](https://github.com/CharanRakindi/Clinova)

### Live demo

> Deploy on **AWS Lightsail/EC2** (below), then replace this line:  
> **Live:** `http://YOUR_PUBLIC_IP` (or your HTTPS domain)  
> Demo login: `admin@clinova.com` / `password123`

**Local Docker:** [http://localhost](http://localhost) when compose is running.

### Screenshots

| Landing | Login | Admin dashboard |
|---------|-------|-----------------|
| ![Landing](docs/screenshots/01-landing.png) | ![Login](docs/screenshots/02-login.png) | ![Admin](docs/screenshots/03-admin-dashboard.png) |

---

## Features

### Platform
- **Roles** — Patient, Doctor, Receptionist, Lab Technician, Admin  
- **Auth** — JWT access + refresh in HttpOnly cookies, bcrypt  
- **Dashboards** — Role-specific queues, stats, and clinical views  
- **Landing** — Responsive marketing UI  

### Clinical
- Appointments, medical records, lab orders, prescriptions, file attachments  

### Product extras
- Socket.io notifications, command palette (`⌘K`), calendar, audit logs, onboarding tour  

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, React Router 7, Tailwind, TanStack Query, Framer Motion |
| Backend | Node.js 20, Express 5, Mongoose 9 |
| Auth | JWT (access + refresh), bcrypt, HttpOnly cookies |
| Realtime | Socket.io |
| Deploy | **Docker Compose on AWS Lightsail / EC2** |
| CI / CD | GitHub Actions (test + SSH deploy to AWS) |

---

## Local development

**Prerequisites:** Node.js 20+, MongoDB (local or Atlas)

```bash
git clone https://github.com/CharanRakindi/Clinova.git
cd Clinova

# API
cd server && npm install && cp .env.example .env
# edit MONGO_URI + JWT secrets
npm run seed && npm run dev    # :5001

# Web (other terminal)
cd client && npm install && npm run dev    # :5173
```

Vite proxies `/api` and `/socket.io` to the API.

### Demo credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@clinova.com` | `password123` |
| Doctor | `sarah@clinova.com` | `password123` |
| Receptionist | `receptionist@clinova.com` | `password123` |
| Lab tech | `labtech@clinova.com` | `password123` |
| Patient | `john@example.com` | `password123` |

Public registration cannot use `@clinova.com`. Staff accounts are admin-created.

---

## Local Docker

```bash
cp .env.docker.example .env.docker
# set JWT_ACCESS_SECRET + JWT_REFRESH_SECRET

docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker --profile seed run --rm seed
```

Open **http://localhost** · health: **http://localhost/health**

---

## Deploy on AWS (Lightsail or EC2)

**Full guide:** [docs/DEPLOY-AWS.md](docs/DEPLOY-AWS.md)

### 1. Create the server
- **Lightsail** (easiest) or **EC2**
- **Ubuntu 22.04+**, **1–2 GB RAM**
- Open ports **22** (SSH), **80** (HTTP), **443** (HTTPS later)
- Prefer a **static IP** (Lightsail)

### 2. SSH in and install Docker

```bash
sudo apt-get update -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# disconnect SSH and reconnect
```

Or:

```bash
curl -fsSL https://raw.githubusercontent.com/CharanRakindi/Clinova/main/scripts/aws-bootstrap.sh | bash
```

### 3. Clone, configure, run

```bash
git clone https://github.com/CharanRakindi/Clinova.git
cd Clinova
cp .env.docker.example .env.docker
nano .env.docker
```

```env
CLIENT_URL=http://YOUR_PUBLIC_IP
WEB_PORT=80
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

```bash
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker --profile seed run --rm seed
```

### 4. Open the app
**http://YOUR_PUBLIC_IP** → login with demo credentials above.

### 5. HTTPS (optional)
Point a domain A-record to the static IP, put **Caddy** (or ALB) in front, set:

```env
CLIENT_URL=https://app.yourdomain.com
COOKIE_SECURE=true
WEB_PORT=8080
```

Details: [docs/DEPLOY-AWS.md](docs/DEPLOY-AWS.md)

### Update the app later

**Automated (recommended):** after one-time GitHub secrets setup, every successful CI on `main` deploys via SSH.

See **[Continuous deploy](docs/DEPLOY-AWS.md#continuous-deploy-github-actions--ssh)** in `docs/DEPLOY-AWS.md`.

Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.

**Manual:**

```bash
cd ~/Clinova
git pull origin main
docker compose --env-file .env.docker up --build -d
```

---

## Tests

```bash
cd server && npm test
```

Health, JWT helpers, and auth register/login/`/me` (in-memory MongoDB).  
CI runs these on every push to `main`.

---

## Project structure

```
Clinova/
├── .github/workflows/
│   ├── ci.yml                 # Lint, test, Docker smoke
│   └── deploy.yml             # SSH deploy after CI (optional secrets)
├── docker-compose.yml
├── .env.docker.example
├── docs/
│   ├── DEPLOY.md              # Deploy overview (AWS)
│   ├── DEPLOY-AWS.md          # Lightsail / EC2 + continuous deploy
│   └── screenshots/
├── scripts/aws-bootstrap.sh
├── client/                    # React SPA + nginx Dockerfile
└── server/                    # Express API + Dockerfile + tests
```

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server` | `npm run dev` / `start` / `seed` / `test` | API, seed, tests |
| `client` | `npm run dev` / `build` / `lint` | SPA |
| root | `docker compose --env-file .env.docker up -d` | Full stack |

---

## Security notes

- HttpOnly cookies; CORS limited to `CLIENT_URL`  
- Role checks and patient-scoped clinical data where applicable  
- Helmet + rate limiting  
- Seed wipe blocked in production unless `ALLOW_SEED=true`  
- Never commit `.env` / `.env.docker`  

> Portfolio / educational project — **not** HIPAA certified.

---

## License

ISC © [Charan Rakindi](https://github.com/CharanRakindi)
