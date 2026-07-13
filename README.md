# Clinova

Full-stack **Electronic Health Record (EHR)** and clinic operations platform (MERN).  
Cinematic marketing site, role-based workspaces, JWT cookie auth, and Socket.io notifications.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

**Repo:** [github.com/CharanRakindi/Clinova](https://github.com/CharanRakindi/Clinova)

---

## Features

### Platform
- **Roles** — Patient, Doctor, Receptionist, Lab Technician, Admin
- **Auth** — JWT access + refresh in HttpOnly cookies, bcrypt passwords
- **Dashboards** — Role-specific queues, stats, and clinical views
- **Landing** — Responsive marketing UI (About, Services, Doctors, Blog)

### Clinical
- Appointments (book, confirm, cancel, complete)
- Medical records (vitals, diagnosis, amendments)
- Lab order pipeline and re-order from the doctor workspace
- Prescriptions and file attachments (local disk or Cloudinary)

### Product extras
- Socket.io notifications (cookie-authenticated)
- Command palette (`⌘K` / `Ctrl+K`)
- Interactive calendar, admin audit logs, onboarding tour

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 3, TanStack Query 5, Framer Motion |
| Backend | Node.js 20, Express 5, Mongoose 9 |
| Auth | JWT (access + refresh), bcrypt, HttpOnly cookies |
| Realtime | Socket.io |
| Uploads | Multer (+ optional Cloudinary) |
| Deploy | Docker multi-stage builds, nginx reverse proxy, Docker Compose, GitHub Actions CI |

---

## Quick start (local development)

### Prerequisites
- Node.js **20+**
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Optional: Docker Desktop for full-stack compose

### 1. Clone

```bash
git clone https://github.com/CharanRakindi/Clinova.git
cd Clinova
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# edit MONGO_URI, JWT_* secrets
npm run seed   # first time only
npm run dev    # http://localhost:5001
```

### 3. Frontend

```bash
cd client
npm install
# optional: cp .env.example .env  (defaults use relative /api/v1)
npm run dev    # http://localhost:5173
```

Vite proxies `/api`, `/socket.io`, and `/health` to the API (`127.0.0.1:5001`), so the SPA and API share the same origin in the browser for cookies.

---

## Demo credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@clinova.com` | `password123` |
| Doctor | `sarah@clinova.com` | `password123` |
| Doctor | `michael@clinova.com` | `password123` |
| Receptionist | `receptionist@clinova.com` | `password123` |
| Lab technician | `labtech@clinova.com` | `password123` |
| Patient | `john@example.com` | `password123` |
| Patient | `jane@example.com` | `password123` |

**Domain rules**
- Public self-registration **cannot** use `@clinova.com`.
- Staff must be created by an **admin** with a `@clinova.com` email.
- Seeding is blocked when `NODE_ENV=production` unless `ALLOW_SEED=true`.

---

## Deploy with Docker (DevOps)

Production-style layout:

```
Browser  →  web (nginx :80)  →  static SPA
                         ↳ /api/* , /socket.io/* , /health  →  api :5001
                                                              →  mongo :27017
```

### One-time env

```bash
cp .env.docker.example .env.docker
# set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (long random strings)
# set CLIENT_URL to the URL users open in the browser (e.g. http://localhost or https://app.example.com)
```

### Build & run

```bash
docker compose --env-file .env.docker up --build -d
```

Open **http://localhost** (or `http://localhost:$WEB_PORT`).

### Seed demo data (optional)

```bash
docker compose --env-file .env.docker --profile seed run --rm seed
```

### Useful commands

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f api
docker compose --env-file .env.docker down          # stop
docker compose --env-file .env.docker down -v       # stop + wipe volumes
```

### Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | API liveness (JSON) |
| Docker `HEALTHCHECK` | API + web containers |
| Compose `depends_on` | mongo healthy → api → web |

### Production HTTPS notes

1. Terminate TLS at a reverse proxy (Cloudflare, AWS ALB, Caddy, nginx) in front of `web`.
2. Set `CLIENT_URL=https://your-domain.com`.
3. Set `COOKIE_SECURE=true` (and keep `COOKIE_SAMESITE=lax` for same-site cookies).
4. Ensure `X-Forwarded-Proto` is forwarded so Express `trust proxy` works (enabled in production).

Images are multi-stage:
- **api** — `node:20-alpine`, non-root user, `/health` probe
- **web** — Vite build → `nginx:alpine` with SPA fallback + API/Socket proxy

---

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | yes | Access token secret (≥32 chars recommended) |
| `JWT_REFRESH_SECRET` | yes | Refresh token secret |
| `CLIENT_URL` | yes | Frontend origin(s), comma-separated |
| `PORT` | no | Default `5001` |
| `HOST` | no | Default `0.0.0.0` |
| `NODE_ENV` | no | `development` / `production` |
| `COOKIE_SECURE` | no | Override cookie Secure flag |
| `COOKIE_SAMESITE` | no | Default `lax` |
| `TRUST_PROXY` | no | Auto `1` in production |
| `RATE_LIMIT_MAX` | no | Max API requests / 15 min / IP |
| `CLOUDINARY_*` | no | Cloud uploads |
| `ALLOW_SEED` | no | Allow seed when `NODE_ENV=production` |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | no | Default `/api/v1` (relative — recommended) |
| `VITE_SOCKET_URL` | no | Defaults to `window.location.origin` |

---

## Project structure

```
Clinova/
├── .github/workflows/ci.yml   # GitHub Actions CI (lint, build, Docker smoke)
├── docker-compose.yml         # web + api + mongo (+ seed profile)
├── .env.docker.example
├── client/
│   ├── Dockerfile             # multi-stage Vite → nginx
│   ├── nginx.conf             # SPA + reverse proxy
│   ├── public/
│   └── src/
│       ├── api/               # Axios client (relative /api/v1)
│       ├── components/
│       ├── contexts/          # Auth, Socket
│       ├── layouts/
│       ├── pages/
│       └── utils/
├── server/
│   ├── Dockerfile
│   ├── uploads/               # local files (volume in compose)
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── seeders/
│       ├── services/          # Socket.io
│       ├── utils/
│       └── validators/
└── README.md
```

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server` | `npm run dev` | API with nodemon |
| `server` | `npm start` | Production API |
| `server` | `npm run seed` | Seed demo data |
| `server` | `npm test` | Vitest (when tests exist) |
| `client` | `npm run dev` | Vite dev + API proxy |
| `client` | `npm run build` | Production SPA build |
| `client` | `npm run lint` | Oxlint |
| `client` | `npm run preview` | Preview production build |
| root | `docker compose … up` | Full stack deploy |

---

## CI/CD

**Stack:** **GitHub Actions** (CI) + **Docker Compose** (run / deploy).

Why this pair (best fit for Clinova):

| Option | Verdict for this project |
|--------|---------------------------|
| **GitHub Actions** | Best — repo is on GitHub, free PR checks, no server to maintain |
| **Docker Compose** | Best for local + single-host deploy of web + api + mongo |
| Jenkins | Better for large orgs that already run Jenkins; extra overhead here |

### Pipeline (`.github/workflows/ci.yml`)

Runs on every push / PR to `main`:

1. **Client** — `npm ci` → lint → production build  
2. **Server** — `npm ci` → syntax check → tests if present  
3. **Docker** — build API + web images → smoke test `GET /health`

View runs: **GitHub → Actions** tab after you push.

### Local / server deploy

```bash
cp .env.docker.example .env.docker   # set JWT_ACCESS_SECRET + JWT_REFRESH_SECRET
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker --profile seed run --rm seed   # optional demo data
```

Open **http://localhost**. Stop with `docker compose --env-file .env.docker down`.

---

## Security notes

- HttpOnly cookies; CORS limited to `CLIENT_URL`
- Role checks and patient-scoped clinical data where applicable
- Local uploads only via authenticated download routes
- Helmet + rate limiting on the API
- Seed wipe disabled in production by default
- Non-root API container user; secrets via env (never commit `.env` / `.env.docker`)

> **Compliance:** Portfolio / educational project — **not** HIPAA or GDPR certified. Real clinical use needs BAAs, audits, encryption-at-rest, and operational controls.

---

## License

ISC © [Charan Rakindi](https://github.com/CharanRakindi)
