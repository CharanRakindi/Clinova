import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    patientId: {
      type: String,
      required: true,
      unique: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      // null / unset = not documented (never invent "Unknown" as clinical fact)
      default: undefined,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    insuranceProvider: String,
    insuranceNumber: String,
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorProfile',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);
export default PatientProfile;
