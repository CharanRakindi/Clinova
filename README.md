# 🏥 Clinova

A premium, full-featured **Electronic Health Record (EHR) and Medical Record Management System** built with the MERN stack. Designed with a modern healthcare SaaS aesthetic inspired by Linear, Stripe, and Apple HIG.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## ✨ Features

### Core Platform
- **Role-Based Access Control** — Separate interfaces and permissions for Patients, Doctors, and Admins
- **Secure Authentication** — JWT access/refresh tokens in HttpOnly cookies, bcrypt hashing, rate limiting
- **Dashboard Analytics** — Real-time stats with Recharts visualizations and animated counters

### Clinical
- **Patient Management** — Doctors can view and manage assigned patients' records
- **Appointment Scheduling** — Book, confirm, cancel, and complete appointments with conflict prevention
- **Medical Records** — Full CRUD with amendment/versioning, vitals tracking, diagnosis tags, and treatment plans
- **File Attachments** — Upload lab results, X-rays, and documents (local storage or Cloudinary)

### Enterprise Features
- **Real-Time Notifications** — Socket.io powered notification system with live updates
- **Interactive Calendar** — Full-featured calendar view (react-big-calendar) for appointments
- **Command Palette** — `⌘K` / `Ctrl+K` quick navigation (cmdk)
- **Dark Mode** — System-aware theme switching via next-themes
- **File Upload System** — Drag-and-drop uploads with Cloudinary integration

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 3, TanStack React Query 5 |
| **UI/UX** | Lucide Icons, Sonner (toasts), cmdk (command palette), react-big-calendar |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Auth** | JWT (access + refresh), bcrypt, HttpOnly cookies |
| **Real-time** | Socket.io |
| **File Storage** | Multer + Cloudinary (with local disk fallback) |
| **Security** | Helmet, CORS, express-rate-limit |

---

## 💻 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local instance or Atlas URI)
- (Optional) [Cloudinary](https://cloudinary.com/) account for cloud file storage

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/CharanRakindi/Clinova.git
cd Clinova
```

### 2. Setup the Backend
```bash
cd server
npm install

# Create environment file from example
cp .env.example .env
```

Edit `server/.env` and update:
- `MONGO_URI` — your MongoDB connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — strong random strings
- (Optional) `CLOUDINARY_*` — for cloud file uploads

### 3. Setup the Frontend
```bash
cd ../client
npm install
```

---

## 🚦 Running the Application

### Seed the Database (First Time)
Populate the database with demo users, roles, and departments:
```bash
cd server
npm run seed
```

### Start Development Servers

**Backend** (runs on `http://localhost:5001`):
```bash
cd server
npm run dev
```

**Frontend** (runs on `http://localhost:5173`):
```bash
cd client
npm run dev
```

---

## 🔑 Demo Credentials

After seeding, log in with:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@clinova.com` | `password123` |
| **Doctor** | `sarah@clinova.com` | `password123` |
| **Patient** | `john@example.com` | `password123` |

---

## 📁 Project Structure

```
clinova/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # Axios instance & interceptors
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # Auth, Socket, Theme providers
│   │   ├── layouts/           # Root & dashboard layouts
│   │   ├── pages/             # Route pages (admin, doctor, patient)
│   │   └── utils/             # Utility functions
│   └── tailwind.config.js
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API route definitions
│   │   ├── seeders/           # Database seeder
│   │   ├── services/          # Socket.io service
│   │   ├── utils/             # Upload config, token helpers
│   │   └── validators/        # Zod validation schemas
│   └── .env.example
└── README.md
```

---

## 🔒 Security

- **ABAC**: Doctors can only access patients they are assigned to or have appointment history with
- **HttpOnly Cookies**: Tokens stored securely — immune to XSS
- **Record Versioning**: Medical records are never hard-deleted; amendments create new versions
- **Helmet + CORS + Rate Limiting**: Production-ready API protection
- **Input Validation**: Zod schemas on all endpoints

> **⚠️ Compliance Note**: This is a portfolio/educational project and is **not automatically HIPAA or GDPR compliant**. Production deployment would require BAAs, security audits, encrypted-at-rest storage, and comprehensive access logging.

---

## 📝 License

ISC License © [Charan Rakindi](https://github.com/CharanRakindi)
