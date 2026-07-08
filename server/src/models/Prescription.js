import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
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
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    medicines: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        route: { type: String }, // e.g., Oral, IV
        instructions: String,
      },
    ],
    instructions: String, // General instructions for the whole prescription
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
