import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { csrfProtection, issueCsrfToken } from './middleware/csrf.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import labReportRoutes from './routes/labReportRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();

if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    // Downloads are same-origin via /api/v1/upload/files
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = clientUrl
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .filter((o) => o !== '*');

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CLIENT_URL must list explicit origin(s) in production');
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Structured access log without query strings (reduce PHI leakage)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan((tokens, req, res) =>
      [
        tokens.method(req, res),
        // path only — no ?patientId=
        (tokens.url(req, res) || '').split('?')[0],
        tokens.status(req, res),
        tokens['response-time'](req, res),
        'ms',
      ].join(' ')
    )
  );
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  // Unauthenticated pages poll refresh via axios interceptor — don't hard-lock demos
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please wait a few minutes.',
  },
});

// Liveness — process up
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'clinova-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness — DB required
app.get('/ready', async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  if (!dbOk) {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    return res.status(200).json({
      status: 'ready',
      database: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: 'not_ready',
      database: 'ping_failed',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'Clinova API', version: '1.0.0', docs: '/health' });
});

// CSRF cookie bootstrap (SPA calls once on load)
app.get('/api/v1/auth/csrf', (req, res) => {
  const token = issueCsrfToken(res);
  res.status(200).json({ success: true, data: { csrfToken: token } });
});

// Mutating API requests require CSRF double-submit (disabled in test)
app.use('/api', csrfProtection);

app.use('/api/v1/auth', authRoutes);
// Apply tighter limit only on refresh — mounted inside auth routes better;
// keep global and document refresh limiter on route:
app.use('/api/v1/auth/refresh', refreshLimiter);

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/lab-reports', labReportRoutes);
app.use('/api/v1/admin/audit-logs', auditLogRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/export', exportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
