import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { upload } from '../utils/upload.js';
import { authenticate } from '../middleware/authMiddleware.js';
import UploadedFile from '../models/UploadedFile.js';
import LabReport from '../models/LabReport.js';
import { assertClinicalAccess } from '../utils/careAccess.js';
import { logAction } from '../utils/auditLogger.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

const ALLOWED_RESOURCE_TYPES = new Set([
  'general',
  'medical_record',
  'lab_report',
  'prescription',
  'other',
]);

async function resolvePatientScope(req) {
  const raw = req.body?.patientId || req.query?.patientId;
  if (!raw) return undefined;

  // Only roles with clinical write rights may bind a patient scope
  if (!['doctor', 'admin', 'lab_technician'].includes(req.user.role)) {
    const err = new Error('Forbidden: cannot attach patient scope to upload');
    err.statusCode = 403;
    throw err;
  }

  if (req.user.role === 'doctor' || req.user.role === 'admin') {
    const denied = await assertClinicalAccess(req.user, raw);
    if (denied) {
      const err = new Error(denied.message);
      err.statusCode = denied.status;
      throw err;
    }
  }

  // Lab tech: may only scope to patients on open lab orders they are processing
  if (req.user.role === 'lab_technician') {
    const open = await LabReport.findOne({
      patient: raw,
      status: { $in: ['ordered', 'sample_collected', 'processing'] },
    }).select('_id');
    if (!open) {
      const err = new Error('Forbidden: no open lab order for this patient');
      err.statusCode = 403;
      throw err;
    }
  }

  return raw;
}

async function persistUploadMeta(req, file) {
  const isCloud = file.path && String(file.path).startsWith('http');
  const storageKey = isCloud ? String(file.filename || file.path) : file.filename;

  const patient = await resolvePatientScope(req);
  let resourceType = String(req.body?.resourceType || 'general');
  if (!ALLOWED_RESOURCE_TYPES.has(resourceType)) resourceType = 'general';
  // Clients cannot self-elevate to lab_report without patient scope
  if (resourceType === 'lab_report' && !patient) resourceType = 'general';

  const doc = await UploadedFile.create({
    storageKey,
    originalName: file.originalname || file.filename,
    mimetype: file.mimetype,
    size: file.size,
    isCloud: !!isCloud,
    cloudUrl: isCloud ? file.path : undefined,
    uploadedBy: req.user._id,
    patient: patient || undefined,
    resourceType,
  });

  return {
    url: isCloud ? file.path : `/api/v1/upload/files/${file.filename}`,
    filename: file.originalname || file.filename,
    storageKey: doc.storageKey,
    mimetype: file.mimetype,
    size: file.size,
    id: doc._id,
  };
}

async function canAccessUpload(user, meta) {
  if (!meta) return false;
  if (user.role === 'admin') return true;
  if (meta.uploadedBy?.toString() === user._id.toString()) return true;

  if (meta.patient) {
    const denied = await assertClinicalAccess(user, meta.patient.toString());
    if (!denied) return true;

    // Lab technician: only if this file is attached to an open lab report for that patient
    if (user.role === 'lab_technician') {
      const key = meta.storageKey;
      const linked = await LabReport.findOne({
        patient: meta.patient,
        status: { $in: ['ordered', 'sample_collected', 'processing', 'completed', 'reviewed'] },
        $or: [
          { 'attachments.url': { $regex: key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } },
          { 'attachments.filename': key },
        ],
      }).select('_id');
      if (linked) return true;
    }
  }

  return false;
}

router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const data = await persistUploadMeta(req, req.file);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.post('/multiple', authenticate, upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload files' });
    }
    const files = [];
    for (const file of req.files) {
      files.push(await persistUploadMeta(req, file));
    }
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.get('/files/:filename', authenticate, async (req, res, next) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (!safeName || safeName !== req.params.filename || safeName.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const meta = await UploadedFile.findOne({ storageKey: safeName });
    if (!meta) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const allowed = await canAccessUpload(req.user, meta);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: no access to this file' });
    }

    await logAction(
      req.user._id,
      req.user.role,
      'READ',
      'UploadedFile',
      meta._id,
      req.ip,
      req.headers['user-agent'],
      { storageKey: safeName, patient: meta.patient },
      { critical: false }
    );

    if (meta.isCloud && meta.cloudUrl) {
      return res.redirect(meta.cloudUrl);
    }

    const filePath = path.join(uploadsDir, safeName);
    if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
