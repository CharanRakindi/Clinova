import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { upload } from '../utils/upload.js';
import { authenticate } from '../middleware/authMiddleware.js';
import UploadedFile from '../models/UploadedFile.js';
import { assertClinicalAccess } from '../utils/careAccess.js';
import { logAction } from '../utils/auditLogger.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

async function persistUploadMeta(req, file) {
  const isCloud = file.path && String(file.path).startsWith('http');
  const storageKey = isCloud
    ? String(file.filename || file.path)
    : file.filename;

  const patient = req.body?.patientId || req.query?.patientId || undefined;

  const doc = await UploadedFile.create({
    storageKey,
    originalName: file.originalname || file.filename,
    mimetype: file.mimetype,
    size: file.size,
    isCloud: !!isCloud,
    cloudUrl: isCloud ? file.path : undefined,
    uploadedBy: req.user._id,
    patient: patient || undefined,
    resourceType: req.body?.resourceType || 'general',
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
    // lab tech may access if they have a lab report with this attachment path later;
    // for now allow lab_technician only if they uploaded it (covered above) or admin
    if (user.role === 'lab_technician' && meta.resourceType === 'lab_report') {
      return true;
    }
  }

  return false;
}

// @desc    Upload a file
// @route   POST /api/v1/upload
// @access  Private
router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const data = await persistUploadMeta(req, req.file);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload multiple files
// @route   POST /api/v1/upload/multiple
// @access  Private
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
    next(error);
  }
});

// @desc    Authenticated download of a local upload (ACL enforced)
// @route   GET /api/v1/upload/files/:filename
// @access  Private
router.get('/files/:filename', authenticate, async (req, res, next) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (!safeName || safeName !== req.params.filename || safeName.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const meta = await UploadedFile.findOne({ storageKey: safeName });
    // Deny unknown files (no free-for-all by filename guess)
    if (!meta) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const allowed = await canAccessUpload(req.user, meta);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: no access to this file' });
    }

    if (meta.isCloud && meta.cloudUrl) {
      return res.redirect(meta.cloudUrl);
    }

    const filePath = path.join(uploadsDir, safeName);
    if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    await logAction(
      req.user._id,
      req.user.role,
      'READ',
      'UploadedFile',
      meta._id,
      req.ip,
      req.headers['user-agent'],
      { storageKey: safeName, patient: meta.patient }
    );

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
