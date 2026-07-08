import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Doctor who ordered or reviewed it
    },
    testName: {
      type: String,
      required: true,
    },
    testType: {
      type: String,
    },
    orderedDate: {
      type: Date,
      default: Date.now,
    },
    resultDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    resultSummary: String,
    referenceRange: String,
    attachments: [
      {
        filename: String,
        url: String,
        mimetype: String,
      },
    ],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

labReportSchema.index({ patient: 1 });

const LabReport = mongoose.model('LabReport', labReportSchema);
export default LabReport;
