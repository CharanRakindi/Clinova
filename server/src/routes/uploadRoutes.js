import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { upload } from '../utils/upload.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// @desc    Upload a file
// @route   POST /api/v1/upload
// @access  Private
router.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  // Cloudinary: absolute URL in path. Local: authenticated API download path.
  const isCloud = req.file.path && String(req.file.path).startsWith('http');
  const fileUrl = isCloud
    ? req.file.path
    : `/api/v1/upload/files/${req.file.filename}`;
  const fileName = req.file.originalname || req.file.filename;

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      filename: fileName,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// @desc    Upload multiple files
// @route   POST /api/v1/upload/multiple
// @access  Private
router.post('/multiple', authenticate, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Please upload files' });
  }

  const files = req.files.map((file) => {
    const isCloud = file.path && String(file.path).startsWith('http');
    return {
      url: isCloud ? file.path : `/api/v1/upload/files/${file.filename}`,
      filename: file.originalname || file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  res.status(200).json({
    success: true,
    data: files,
  });
});

// @desc    Authenticated download of a local upload (no public static PHI)
// @route   GET /api/v1/upload/files/:filename
// @access  Private
router.get('/files/:filename', authenticate, (req, res) => {
  const safeName = path.basename(req.params.filename);
  if (!safeName || safeName !== req.params.filename || safeName.includes('..')) {
    return res.status(400).json({ success: false, message: 'Invalid filename' });
  }

  const filePath = path.join(uploadsDir, safeName);
  if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  res.sendFile(filePath);
});

export default router;
