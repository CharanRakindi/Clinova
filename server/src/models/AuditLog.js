import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'
      required: true,
    },
    resourceType: {
      type: String, // e.g., 'MedicalRecord', 'Appointment', 'User'
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    ipAddress: String,
    userAgent: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Store partial, safe info. Never passwords or full medical notes.
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }, // only care about when it happened
  }
);

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
