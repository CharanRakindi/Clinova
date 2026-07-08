# MediVault

A secure web-based Medical Record Management System for patients, doctors, and administrators built with the MERN stack.

## 🚀 Features

- **Role-Based Access Control**: Separate interfaces and permissions for Patients, Doctors, and Admins.
- **Secure Authentication**: JWT-based auth with HttpOnly cookies, bcrypt password hashing, and rate limiting.
- **Dashboard Analytics**: Visual data representations using Recharts for daily appointments and system stats.
- **Patient Management**: Authorized doctors can view and manage assigned patients' records.
- **Appointment Scheduling**: Book, confirm, and cancel appointments with conflict prevention.
- **Medical Records & History**: Robust medical record tracking with amendment/version history.
- **Modern UI**: Built with React, Tailwind CSS, and Radix/Lucide icons for a premium look and feel.

## 🛠️ Tech Stack

**Frontend**:
- React (Vite)
- React Router
- Tailwind CSS
- TanStack React Query (Server State)
- React Hook Form + Zod (Validation)
- Recharts (Analytics)
- Axios

**Backend**:
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- bcrypt, Helmet, CORS, express-rate-limit

---

## 💻 Prerequisites

To run this project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017` or a MongoDB Atlas URI)

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd medivault
```

### 2. Setup the Backend
```bash
cd server
npm install

# Create environment file from example
cp .env.example .env
```
Ensure your MongoDB instance is running, or update the `MONGO_URI` in `server/.env` to point to your cloud instance.

### 3. Setup the Frontend
```bash
cd ../client
npm install
```

---

## 🚦 Running the Application

### Seed the Database (Important)
Before starting the app for the first time, you should populate the database with mock roles, users, and departments.
From the `server` directory, run:
```bash
npm run seed
```

### Start the Development Servers

**Run Backend**:
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000`

**Run Frontend**:
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

---

## 🔑 Demo Credentials

Once the database is seeded, you can log in using the following accounts:

- **Admin**: 
  - Email: `admin@medivault.com`
  - Password: `password123`
- **Doctor**: 
  - Email: `sarah@medivault.com`
  - Password: `password123`
- **Patient**: 
  - Email: `john@example.com`
  - Password: `password123`

---

## 🔒 Security Considerations

- **ABAC (Attribute-Based Access Control)**: Doctors cannot view random patient profiles. They must either be explicitly assigned to the patient or have an existing appointment history with them.
- **HttpOnly Cookies**: Access and refresh tokens are stored safely to prevent XSS attacks.
- **Data Integrity**: Medical records are never "hard deleted" by doctors. Instead, amendments create a new version of the record while retaining the previous archived version.
- **API Protection**: Helmet headers, rate limiting, and CORS allowlists are enforced on the server.

> **Note on Compliance**: This is an educational portfolio project and is **not automatically HIPAA or GDPR compliant**. Real-world deployment would require BAA agreements, third-party security audits, encrypted at-rest storage in compliant cloud environments, and extensive logging of all access events.
