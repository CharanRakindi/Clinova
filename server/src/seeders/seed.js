import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Department from '../models/Department.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Allergy from '../models/Allergy.js';
import MedicalCondition from '../models/MedicalCondition.js';
import AuditLog from '../models/AuditLog.js';
import { connectDB } from '../config/db.js';

// Load env vars
dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Cleaning existing data...');
    // Clear existing data
    await User.deleteMany();
    await PatientProfile.deleteMany();
    await DoctorProfile.deleteMany();
    await Department.deleteMany();
    await Appointment.deleteMany();
    await Prescription.deleteMany();
    await LabReport.deleteMany();
    await Allergy.deleteMany();
    await MedicalCondition.deleteMany();
    await AuditLog.deleteMany();

    console.log('Seeding core users...');
    // 1. Create Admins, Receptionists, Lab Techs
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@clinova.com',
      password: 'password123',
      role: 'admin',
      gender: 'other',
    });

    const receptionistUser = await User.create({
      name: 'Emily Rose',
      email: 'receptionist@clinova.com',
      password: 'password123',
      role: 'receptionist',
      gender: 'female',
      phone: '555-9876'
    });

    const labtechUser = await User.create({
      name: 'Alex Vance',
      email: 'labtech@clinova.com',
      password: 'password123',
      role: 'lab_technician',
      gender: 'male',
      phone: '555-4321'
    });

    // 2. Create Departments
    const cardiology = await Department.create({ name: 'Cardiology', description: 'Heart and cardiovascular care' });
    const neurology = await Department.create({ name: 'Neurology', description: 'Brain and nervous system care' });
    const pediatrics = await Department.create({ name: 'Pediatrics', description: 'Children care' });

    // 3. Create Doctors
    const doctorUsers = await User.create([
      { name: 'Dr. Sarah Jenkins', email: 'sarah@clinova.com', password: 'password123', role: 'doctor', gender: 'female', phone: '555-1111' },
      { name: 'Dr. Michael Chen', email: 'michael@clinova.com', password: 'password123', role: 'doctor', gender: 'male', phone: '555-2222' },
    ]);

    // 4. Create Patients
    const patientUsers = await User.create([
      { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'patient', gender: 'male', phone: '555-0001', address: { street: '123 Main St', city: 'Metropolis', state: 'NY', zipCode: '10001', country: 'USA' } },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'patient', gender: 'female', phone: '555-0002', address: { street: '456 Elm St', city: 'Gotham', state: 'NJ', zipCode: '07001', country: 'USA' } },
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

    console.log('Seeding appointments...');
    // 8. Create appointments
    const appointments = await Appointment.create([
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

    console.log('Seeding prescriptions...');
    // 9. Create Prescriptions
    await Prescription.create([
      {
        patient: patientUsers[0]._id,
        doctor: doctorUsers[0]._id,
        medicines: [
          { medicineName: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take in the morning with water' },
          { medicineName: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: '90 days', route: 'Oral', instructions: 'Take before bedtime' }
        ],
        instructions: 'Avoid eating grapefruit or drinking grapefruit juice while taking Atorvastatin.',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: 'active'
      },
      {
        patient: patientUsers[1]._id,
        doctor: doctorUsers[1]._id,
        medicines: [
          { medicineName: 'Sumatriptan', dosage: '50mg', frequency: 'As needed for migraine', duration: '10 days', route: 'Oral', instructions: 'Take one tablet at onset of migraine' }
        ],
        instructions: 'Do not exceed 100mg in a 24-hour period.',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        status: 'active'
      }
    ]);

    console.log('Seeding lab reports...');
    // 10. Create Lab Reports
    await LabReport.create([
      {
        patient: patientUsers[0]._id,
        doctor: doctorUsers[0]._id,
        testName: 'Lipid Panel',
        testType: 'Blood Test',
        orderedDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        resultDate: new Date(),
        status: 'completed',
        resultSummary: 'Total Cholesterol: 180 mg/dL (Normal), Triglycerides: 140 mg/dL (Normal), HDL: 50 mg/dL (Good), LDL: 102 mg/dL (Borderline)',
        referenceRange: 'LDL < 100 mg/dL is optimal'
      },
      {
        patient: patientUsers[1]._id,
        doctor: doctorUsers[1]._id,
        testName: 'Brain MRI',
        testType: 'Imaging',
        orderedDate: new Date(),
        status: 'pending'
      }
    ]);

    console.log('Seeding allergies & conditions...');
    // 11. Create Allergies
    await Allergy.create([
      {
        patient: patientUsers[0]._id,
        allergen: 'Penicillin',
        type: 'Drug',
        severity: 'Severe',
        reaction: 'Anaphylaxis and rash',
        recordedBy: doctorUsers[0]._id
      },
      {
        patient: patientUsers[0]._id,
        allergen: 'Peanuts',
        type: 'Food',
        severity: 'Moderate',
        reaction: 'Swelling of lips and hives',
        recordedBy: doctorUsers[0]._id
      }
    ]);

    // 12. Create Medical Conditions
    await MedicalCondition.create([
      {
        patient: patientUsers[0]._id,
        conditionName: 'Essential Hypertension',
        diagnosisDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
        status: 'Active',
        severity: 'Moderate',
        notes: 'Controlled well with Lisinopril',
        diagnosedBy: doctorUsers[0]._id
      },
      {
        patient: patientUsers[1]._id,
        conditionName: 'Migraine without Aura',
        diagnosisDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        status: 'Active',
        severity: 'Severe',
        notes: 'Sumatriptan prescribed for acute episodes',
        diagnosedBy: doctorUsers[1]._id
      }
    ]);

    console.log('Seeding audit logs...');
    // 13. Create Audit Logs
    await AuditLog.create([
      {
        actor: adminUser._id,
        actorRole: 'admin',
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: adminUser._id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: { success: true }
      },
      {
        actor: doctorUsers[0]._id,
        actorRole: 'doctor',
        action: 'CREATE',
        resourceType: 'MedicalRecord',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
        metadata: { patientName: 'John Doe', chiefComplaint: 'Routine checkup' }
      }
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
