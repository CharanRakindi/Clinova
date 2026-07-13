import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images and Documents Only!'));
  }
}

// Determine storage based on environment variables
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Determine folder and resource_type based on mimetype
      let resource_type = 'auto';
      if (file.mimetype === 'application/pdf') {
        resource_type = 'raw';
      }
      return {
        folder: 'clinova',
        resource_type: resource_type,
        public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
      };
    },
  });
} else {
  // Fallback to local disk storage
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function(req, file, cb) {
      crypto.randomBytes(16, function(err, raw) {
        if (err) return cb(err);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, raw.toString('hex') + ext);
      });
    }
  });
}

// Init Upload
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Increased to 10MB
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});
