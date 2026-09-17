const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
  uploadFile,
  deleteFile,
  getPublicAvatarUrl,
  LOCAL_AVATARS_DIR,
} = require('./storage.service');

const AVATAR_DIR = LOCAL_AVATARS_DIR;

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images (up to 5 MB) are supported.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

// Use memoryStorage for seamless S3 + local streaming
const storage = multer.memoryStorage();

const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

/**
 * Save avatar buffer to persistent storage provider
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<{ url: string, key: string }>}
 */
const saveAvatarFile = async (buffer, originalName, mimeType) => {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = `avatar_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const storageKey = `avatars/${randomName}`;

  const result = await uploadFile(buffer, storageKey, mimeType, true);

  return {
    key: result.key,
    url: result.location || getPublicAvatarUrl(result.key),
  };
};

/**
 * Delete a stored avatar file safely from storage provider or disk
 */
const deleteAvatarFile = async (avatarPath) => {
  if (!avatarPath) return;
  try {
    const fileName = path.basename(avatarPath);
    const storageKey = `avatars/${fileName}`;

    // Delete from storage abstraction
    await deleteFile(storageKey, true);

    // Also clean up local filesystem if present
    const localTarget = path.join(AVATAR_DIR, fileName);
    if (fs.existsSync(localTarget)) {
      fs.unlinkSync(localTarget);
    }
  } catch (err) {
    console.error('Error deleting avatar file:', err.message);
  }
};

module.exports = {
  uploadAvatar,
  saveAvatarFile,
  deleteAvatarFile,
  AVATAR_DIR,
};
