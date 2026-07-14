import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /health', () => {
  it('returns ok status without auth', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('clinova-api');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.timestamp).toBeTruthy();
  });
});

describe('GET /', () => {
  it('returns API metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.name).toMatch(/Clinova/i);
  });
});
