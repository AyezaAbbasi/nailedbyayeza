const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Uploads now go straight to Cloudinary instead of the local disk.
// req.file.path (and each req.files[i].path) will be the final https:// Cloudinary URL.
function makeUploader(subfolder, maxSizeMB) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `nailedbyayeza/${subfolder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      // keeps a readable-ish public_id; Cloudinary still guarantees uniqueness
      public_id: (req, file) => `${subfolder}_${Date.now()}_${Math.round(Math.random() * 1e9)}`
    }
  });

  return multer({
    storage,
    limits: { fileSize: (maxSizeMB || 5) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
      else cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));
    }
  });
}

module.exports = makeUploader;