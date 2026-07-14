import AuditLog from '../models/AuditLog.js';

/**
 * Log an action to the audit log database.
 * @param {object} [options]
 * @param {boolean} [options.critical] — if true, rethrow on failure so caller can fail closed
 */
export const logAction = async (
  actorId,
  role,
  action,
  resourceType,
  resourceId,
  ipAddress,
  userAgent,
  metadata = {},
  options = {}
) => {
  try {
    await AuditLog.create({
      actor: actorId,
      actorRole: role,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'System',
      metadata,
    });
  } catch (error) {
    console.error('Audit Log failed to write:', error.message);
    if (options.critical) {
      const err = new Error('Audit trail unavailable — operation aborted');
      err.statusCode = 503;
      throw err;
    }
  }
};

/** Convenience for clinical READ access logging (HIPAA-adjacent accounting). */
export const logAccess = async (req, resourceType, resourceId, metadata = {}) => {
  if (!req.user) return;
  await logAction(
    req.user._id,
    req.user.role,
    'READ',
    resourceType,
    resourceId,
    req.ip,
    req.headers['user-agent'],
    {
      ...metadata,
      path: req.originalUrl?.split('?')[0],
      method: req.method,
    },
    { critical: false }
  );
};
