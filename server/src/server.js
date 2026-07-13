import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);
initSocket(server);

const start = async () => {
  await connectDB();
  server.listen(PORT, HOST, () => {
    console.log(`Clinova API listening on ${HOST}:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err?.message || err}`);
  server.close(() => process.exit(1));
});
