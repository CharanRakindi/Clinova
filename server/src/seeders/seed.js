import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Department from '../models/Department.js';
import Appointment from '../models/Appointment.js';
import { connectDB } from '../config/db.js';

// Load env vars
dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await PatientProfile.deleteMany();
    await DoctorProfile.deleteMany();
    await Department.deleteMany();
    await Appointment.deleteMany();

    // 1. Create Admin (pre-save hook hashes the password automatically)
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@medivault.com',
      password: 'password123',
      role: 'admin',
    });

    // 2. Create Departments
    const cardiology = await Department.create({ name: 'Cardiology', description: 'Heart and cardiovascular care' });
    const neurology = await Department.create({ name: 'Neurology', description: 'Brain and nervous system care' });

    // 3. Create Doctors
    const doctorUsers = await User.create([
      { name: 'Dr. Sarah Jenkins', email: 'sarah@medivault.com', password: 'password123', role: 'doctor', gender: 'female' },
      { name: 'Dr. Michael Chen', email: 'michael@medivault.com', password: 'password123', role: 'doctor', gender: 'male' },
    ]);

    // 4. Create Patients
    const patientUsers = await User.create([
      { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'patient', gender: 'male' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'patient', gender: 'female' },
    ]);

    // 5. Create Doctor Profiles
    const doctorProfiles = await DoctorProfile.create([
      {
        user: doctorUsers[0]._id,
        doctorId: 'DOC-1',
        specialization: 'Cardiologist',
        department: cardiology._id,
        licenseNumber: 'LIC-001',
        experienceYears: 12,
        qualifications: ['MBBS', 'MD Cardiology'],
        consultationFee: 500,
      },
      {
        user: doctorUsers[1]._id,
        doctorId: 'DOC-2',
        specialization: 'Neurologist',
        department: neurology._id,
        licenseNumber: 'LIC-002',
        experienceYears: 8,
        qualifications: ['MBBS', 'DM Neurology'],
        consultationFee: 600,
      },
    ]);

    // 6. Create Patient Profiles with bidirectional doctor links
    const patientProfiles = await PatientProfile.create([
      {
        user: patientUsers[0]._id,
        patientId: 'PAT-1',
        bloodGroup: 'O+',
        assignedDoctors: [doctorProfiles[0]._id],
        emergencyContact: { name: 'Mary Doe', relationship: 'Spouse', phone: '555-0101' },
      },
      {
        user: patientUsers[1]._id,
        patientId: 'PAT-2',
        bloodGroup: 'A-',
        assignedDoctors: [doctorProfiles[1]._id],
        emergencyContact: { name: 'Bob Smith', relationship: 'Father', phone: '555-0202' },
      },
    ]);

    // 7. Update doctor profiles with assigned patients (bidirectional)
    doctorProfiles[0].assignedPatients = [patientProfiles[0]._id];
    doctorProfiles[1].assignedPatients = [patientProfiles[1]._id];
    await doctorProfiles[0].save();
    await doctorProfiles[1].save();

    // 8. Create appointments
    await Appointment.create([
      {
        patient: patientUsers[0]._id,
        doctor: doctorUsers[0]._id,
        appointmentDate: new Date(),
        timeSlot: '10:00 AM',
        reason: 'Routine checkup',
        status: 'confirmed',
        createdBy: patientUsers[0]._id,
      },
      {
        patient: patientUsers[1]._id,
        doctor: doctorUsers[1]._id,
        appointmentDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        timeSlot: '02:00 PM',
        reason: 'Migraine consultation',
        status: 'requested',
        createdBy: patientUsers[1]._id,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
