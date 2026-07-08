import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    chiefComplaint: {
      type: String,
      required: true,
    },
    symptoms: [String],
    diagnosis: [String],
    clinicalNotes: String,
    treatmentPlan: String,
    vitals: {
      height: Number, // cm
      weight: Number, // kg
      temperature: Number, // C or F
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      pulse: Number,
      oxygenSaturation: Number,
    },
    followUpDate: Date,
    attachments: [
      {
        filename: String,
        url: String,
        mimetype: String,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'amended'],
      default: 'active',
    },
    version: {
      type: Number,
      default: 1,
    },
    amendedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ doctor: 1 });
medicalRecordSchema.index({ visitDate: -1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
