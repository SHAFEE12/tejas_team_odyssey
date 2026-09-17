const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  LOCAL_RESUMES_DIR,
  STORAGE_PROVIDER,
} = require('./storage.service');

const UPLOADS_DIR = LOCAL_RESUMES_DIR;

// Allowed MIME types and extensions (PDF, DOCX/DOC, Images, Text/RTF)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/webp',
  'text/plain',
  'text/rtf',
  'application/rtf',
  'application/octet-stream', // Generic binary stream fallback when extension matches
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
  '.rtf',
];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/');

  if (!isExtAllowed && !isMimeAllowed) {
    const error = new Error('Invalid file type. Supported formats: PDF, Word (DOCX/DOC), Images (PNG, JPG, WEBP), and Text (TXT, RTF) up to 10 MB.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

// Use memoryStorage so the buffer can be processed and forwarded to S3 or local storage safely
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter,
});

/**
 * Save resume buffer to storage service
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<{ filename: string, storageKey: string }>}
 */
const saveResumeFile = async (buffer, originalName, mimeType) => {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex') + ext;
  const storageKey = `resumes/${randomName}`;

  await uploadFile(buffer, storageKey, mimeType, false);

  return {
    filename: randomName,
    storageKey,
  };
};

/**
 * Delete a stored resume file safely from storage provider or legacy local disk
 */
const deleteResumeFile = async (storageKey) => {
  if (!storageKey) return;
  try {
    // Attempt deletion from storage service
    const key = storageKey.startsWith('resumes/') ? storageKey : `resumes/${path.basename(storageKey)}`;
    await deleteFile(key, false);

    // Also clean up legacy local file if it exists
    const legacyPath = path.join(UPLOADS_DIR, path.basename(storageKey));
    if (fs.existsSync(legacyPath)) {
      fs.unlinkSync(legacyPath);
    }
  } catch (err) {
    console.error('Failed to delete resume file:', err.message);
  }
};

/**
 * Get resume file stream from storage provider
 */
const getResumeStream = async (storageKey) => {
  if (!storageKey) return null;
  const key = storageKey.startsWith('resumes/') ? storageKey : `resumes/${path.basename(storageKey)}`;
  try {
    return await downloadFile(key, false);
  } catch (err) {
    // Check legacy local disk path
    const legacyPath = path.join(UPLOADS_DIR, path.basename(storageKey));
    if (fs.existsSync(legacyPath)) {
      return {
        stream: fs.createReadStream(legacyPath),
        contentLength: fs.statSync(legacyPath).size,
      };
    }
    return null;
  }
};

/**
 * Backward compatibility: get absolute file path if exists locally
 */
const getResumeFilePath = (storageKey) => {
  if (!storageKey) return null;
  const safePath = path.join(UPLOADS_DIR, path.basename(storageKey));
  return fs.existsSync(safePath) ? safePath : null;
};

module.exports = {
  upload,
  saveResumeFile,
  deleteResumeFile,
  getResumeStream,
  getResumeFilePath,
  UPLOADS_DIR,
};
