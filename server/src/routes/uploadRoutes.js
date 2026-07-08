import express from 'express';
import { upload } from '../utils/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Upload a file
// @route   POST /api/v1/upload
// @access  Private
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }
  
  // Cloudinary stores the URL in req.file.path, local multer uses req.file.filename
  const fileUrl = req.file.path || `/uploads/${req.file.filename}`;
  const fileName = req.file.originalname || req.file.filename;
  
  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      filename: fileName,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

// @desc    Upload multiple files
// @route   POST /api/v1/upload/multiple
// @access  Private
router.post('/multiple', protect, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Please upload files' });
  }
  
  const files = req.files.map(file => ({
    url: file.path || `/uploads/${file.filename}`,
    filename: file.originalname || file.filename,
    mimetype: file.mimetype,
    size: file.size
  }));
  
  res.status(200).json({
    success: true,
    data: files
  });
});

export default router;
