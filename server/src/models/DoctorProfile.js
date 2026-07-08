import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    doctorId: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    qualifications: [String],
    consultationFee: {
      type: Number,
      default: 0,
    },
    availability: [
      {
        dayOfWeek: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String, // '09:00'
        endTime: String, // '17:00'
      },
    ],
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PatientProfile',
      },
    ],
  },
  {
    timestamps: true,
  }
);

doctorProfileSchema.index({ doctorId: 1 });
doctorProfileSchema.index({ user: 1 });
doctorProfileSchema.index({ department: 1 });

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;
