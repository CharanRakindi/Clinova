import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await PatientProfile.deleteMany({});
});

describe('POST /api/v1/auth/register', () => {
  it('registers a patient and sets auth cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Patient',
        email: 'patient@example.com',
        password: 'password123',
        phone: '555-0100',
        gender: 'male',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('patient@example.com');
    expect(res.body.data.role).toBe('patient');

    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);

    const user = await User.findOne({ email: 'patient@example.com' });
    expect(user).toBeTruthy();
    const profile = await PatientProfile.findOne({ user: user._id });
    expect(profile).toBeTruthy();
  });

  it('rejects @clinova.com public registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Staff Attempt',
      email: 'doctor@clinova.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    // Zod validator blocks @clinova.com before the controller message
    const body = JSON.stringify(res.body);
    expect(body).toMatch(/clinova\.com|reserved|staff|Validation/i);
  });

  it('rejects invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('login@example.com');

    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
  });

  it('rejects wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login User',
      email: 'wrongpw@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'wrongpw@example.com',
      password: 'not-the-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    });

    const cookies = reg.headers['set-cookie'];
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/auth/profile', () => {
  it('allows patients to update their email', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Email Changer',
      email: 'old@example.com',
      password: 'password123',
    });
    const cookies = reg.headers['set-cookie'];

    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Cookie', cookies)
      .send({ email: 'new@example.com', name: 'Email Changer' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('new@example.com');

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);
    expect(me.body.data.email).toBe('new@example.com');
  });

  it('rejects patient email that is already taken', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Taken',
      email: 'taken@example.com',
      password: 'password123',
    });
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Other',
      email: 'other@example.com',
      password: 'password123',
    });
    const cookies = reg.headers['set-cookie'];

    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Cookie', cookies)
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects reserved @clinova.com emails for patients', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Patient',
      email: 'patient-mail@example.com',
      password: 'password123',
    });
    const cookies = reg.headers['set-cookie'];

    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Cookie', cookies)
      .send({ email: 'someone@clinova.com' });

    expect(res.status).toBe(400);
  });
});
