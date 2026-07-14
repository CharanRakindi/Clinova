import mongoose from 'mongoose';

const uploadedFileSchema = new mongoose.Schema(
  {
    storageKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: String,
    mimetype: String,
    size: Number,
    isCloud: { type: Boolean, default: false },
    cloudUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional clinical scope for ACL
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['general', 'medical_record', 'lab_report', 'prescription', 'other'],
      default: 'general',
    },
  },
  { timestamps: true }
);

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);
export default UploadedFile;
