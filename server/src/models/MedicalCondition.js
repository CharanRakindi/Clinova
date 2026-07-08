import mongoose from 'mongoose';

const medicalConditionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conditionName: {
      type: String,
      required: true,
    },
    diagnosisDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Managed', 'Unknown'],
      default: 'Active',
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Unknown'],
      default: 'Unknown',
    },
    notes: String,
    diagnosedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

medicalConditionSchema.index({ patient: 1 });

const MedicalCondition = mongoose.model('MedicalCondition', medicalConditionSchema);
export default MedicalCondition;
