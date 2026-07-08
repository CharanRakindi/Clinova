import mongoose from 'mongoose';

const allergySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allergen: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Drug', 'Food', 'Environmental', 'Other'],
      default: 'Other',
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Unknown'],
      default: 'Unknown',
    },
    reaction: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

allergySchema.index({ patient: 1 });

const Allergy = mongoose.model('Allergy', allergySchema);
export default Allergy;
