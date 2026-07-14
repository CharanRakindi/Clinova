import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Department from '../models/Department.js';
import Appointment from '../models/Appointment.js';
import UploadedFile from '../models/UploadedFile.js';

let mongo;

async function registerPatient(email = 'p1@example.com') {
  const res = await request(app).post('/api/v1/auth/register').send({
    name: 'Patient One',
    email,
    password: 'password12345',
  });
  return res;
}

async function createDoctor() {
  const dept = await Department.create({ name: 'General', description: 'General medicine' });
  const doctor = await User.create({
    name: 'Doc Test',
    email: 'doc@clinova.com',
    password: 'password12345',
    role: 'doctor',
  });
  await DoctorProfile.create({
    user: doctor._id,
    doctorId: `DOC-${Date.now()}`,
    specialization: 'General',
    department: dept._id,
    licenseNumber: `LIC-${Date.now()}`,
  });
  return doctor;
}

async function loginAs(email, password = 'password12345') {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  const cookies = res.headers['set-cookie'];
  return { res, cookies };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    PatientProfile.deleteMany({}),
    DoctorProfile.deleteMany({}),
    Department.deleteMany({}),
    Appointment.deleteMany({}),
    UploadedFile.deleteMany({}),
  ]);
});

describe('RBAC / clinical access', () => {
  it('blocks doctor from ordering lab for unrelated patient', async () => {
    await registerPatient('p1@example.com');
    const patient = await User.findOne({ email: 'p1@example.com' });
    await createDoctor();
    const { cookies } = await loginAs('doc@clinova.com');

    const res = await request(app)
      .post('/api/v1/lab-reports')
      .set('Cookie', cookies)
      .send({ patientId: patient._id.toString(), testName: 'CBC' });

    expect(res.status).toBe(403);
  });

  it('blocks doctor from prescribing for unrelated patient', async () => {
    await registerPatient('p2@example.com');
    const patient = await User.findOne({ email: 'p2@example.com' });
    await createDoctor();
    const { cookies } = await loginAs('doc@clinova.com');

    const res = await request(app)
      .post('/api/v1/prescriptions')
      .set('Cookie', cookies)
      .send({
        patientId: patient._id.toString(),
        medicines: [{ medicineName: 'Amoxicillin', dosage: '500mg', frequency: 'BID', duration: '7d' }],
      });

    expect(res.status).toBe(403);
  });

  it('allows doctor lab order after confirmed appointment establishes care link', async () => {
    await registerPatient('p3@example.com');
    const patient = await User.findOne({ email: 'p3@example.com' });
    const doctor = await createDoctor();
    await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date(),
      timeSlot: '09:00 AM',
      reason: 'Checkup',
      status: 'confirmed',
      createdBy: doctor._id,
    });

    const { cookies } = await loginAs('doc@clinova.com');
    const res = await request(app)
      .post('/api/v1/lab-reports')
      .set('Cookie', cookies)
      .send({ patientId: patient._id.toString(), testName: 'CBC', priority: 'Normal' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('blocks doctor lab order when only a cancelled appointment exists', async () => {
    await registerPatient('p3b@example.com');
    const patient = await User.findOne({ email: 'p3b@example.com' });
    const doctor = await createDoctor();
    await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date(),
      timeSlot: '10:00 AM',
      reason: 'Cancelled visit',
      status: 'cancelled',
      createdBy: doctor._id,
    });

    const { cookies } = await loginAs('doc@clinova.com');
    const res = await request(app)
      .post('/api/v1/lab-reports')
      .set('Cookie', cookies)
      .send({ patientId: patient._id.toString(), testName: 'CBC', priority: 'Normal' });

    expect(res.status).toBe(403);
  });

  it('blocks receptionist from reading medical records', async () => {
    await registerPatient('p4@example.com');
    const patient = await User.findOne({ email: 'p4@example.com' });
    await User.create({
      name: 'Front Desk',
      email: 'desk@clinova.com',
      password: 'password12345',
      role: 'receptionist',
    });
    const { cookies } = await loginAs('desk@clinova.com');

    const res = await request(app)
      .get(`/api/v1/patients/${patient._id}/medical-records`)
      .set('Cookie', cookies);

    expect(res.status).toBe(403);
  });

  it('denies download of upload without metadata/ACL', async () => {
    await registerPatient('p5@example.com');
    const { cookies } = await loginAs('p5@example.com');

    const res = await request(app)
      .get('/api/v1/upload/files/not-a-real-file.pdf')
      .set('Cookie', cookies);

    expect(res.status).toBe(404);
  });

  it('denies download when user is not uploader or care team', async () => {
    await registerPatient('owner@example.com');
    const owner = await User.findOne({ email: 'owner@example.com' });
    await registerPatient('other@example.com');

    await UploadedFile.create({
      storageKey: 'secretfile.pdf',
      originalName: 'secret.pdf',
      mimetype: 'application/pdf',
      size: 100,
      uploadedBy: owner._id,
      patient: owner._id,
    });

    const { cookies } = await loginAs('other@example.com');
    const res = await request(app)
      .get('/api/v1/upload/files/secretfile.pdf')
      .set('Cookie', cookies);

    expect(res.status).toBe(403);
  });

  it('normalizes email case on login', async () => {
    await registerPatient('CaseUser@Example.COM');
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'caseuser@example.com',
      password: 'password12345',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
