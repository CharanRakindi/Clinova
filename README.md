# Clinova

A full-stack **Electronic Health Record (EHR)** and medical operations platform built with the MERN stack. Includes a cinematic marketing site, role-based workspaces for patients, doctors, reception, lab technicians, and admins, and JWT cookie authentication.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## Features

### Platform
- **Role-based access** — Patient, Doctor, Receptionist, Lab Technician, Admin
- **Secure auth** — JWT access + refresh tokens in HttpOnly cookies, bcrypt passwords
- **Dashboards** — Role-specific stats, queues, and clinical views
- **Premium landing** — Responsive marketing UI with About, Services, Doctors, Blog

### Clinical
- Appointments (book, confirm, cancel, complete)
- Medical records with vitals, diagnosis, amendments
- Lab order pipeline and re-order from the doctor workspace
- Prescriptions and file attachments (local disk or Cloudinary)

### Product extras
- Socket.io notifications (cookie-authenticated)
- Command palette (`⌘K` / `Ctrl+K`)
- Interactive calendar, audit logs (admin), onboarding tour

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 3, TanStack Query 5, Framer Motion |
| Backend | Node.js, Express 5, Mongoose 9 |
| Auth | JWT (access + refresh), bcrypt, HttpOnly cookies |
| Realtime | Socket.io |
| Uploads | Multer (+ optional Cloudinary) |

---

## Prerequisites

- Node.js **18+**
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Optional: [Cloudinary](https://cloudinary.com/) for cloud file storage

---

## Setup

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
```

Edit `server/.env`:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Strong random secrets |
| `CLIENT_URL` | Frontend origin (default `http://localhost:5173`) |
| `PORT` | API port (default `5001`) |
| `CLOUDINARY_*` | Optional cloud uploads |

### 3. Frontend

```bash
cd ../client
npm install
cp .env.example .env
```

`client/.env` (optional overrides):

```env
VITE_API_URL=http://localhost:5001/api/v1
```

---

## Run

### Seed demo data (first time)

```bash
cd server
npm run seed
```

> Seeding is blocked when `NODE_ENV=production` unless `ALLOW_SEED=true`.

### Dev servers

**API** → `http://localhost:5001`

```bash
cd server
npm run dev
```

**Web** → `http://localhost:5173`

```bash
cd client
npm run dev
```

---

## Demo credentials

After seeding:

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
- Public self-registration **cannot** use `@clinova.com` (hospital domain).
- Staff (doctor / lab tech / receptionist) must be created by an **admin** with a `@clinova.com` email.

---

## Project structure

```
Clinova/
├── client/                 # React (Vite) frontend
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios client + refresh interceptor
│   │   ├── components/
│   │   ├── contexts/       # Auth, Socket, Theme
│   │   ├── layouts/
│   │   ├── pages/          # Landing + role dashboards
│   │   └── utils/
│   └── .env.example
├── server/                 # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seeders/
│   │   ├── services/       # Socket.io
│   │   ├── utils/
│   │   └── validators/
│   ├── uploads/            # Local files (gitignored contents)
│   └── .env.example
└── README.md
```

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server` | `npm run dev` | API with nodemon |
| `server` | `npm start` | Production API |
| `server` | `npm run seed` | Seed demo data |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Production build |
| `client` | `npm run preview` | Preview production build |

---

## Security notes

- HttpOnly cookies for tokens; CORS limited to `CLIENT_URL`
- Role checks and patient-scoped clinical data where applicable
- Local uploads served only via authenticated download routes
- Helmet + rate limiting on the API
- Seed wipe disabled in production by default

> **Compliance:** This is a portfolio / educational project and is **not** HIPAA or GDPR certified. Real clinical use needs proper BAAs, audits, encryption-at-rest, and operational controls.

---

## License

ISC © [Charan Rakindi](https://github.com/CharanRakindi)
