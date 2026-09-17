/**
 * storage.service.js — Unified Object Storage Provider Abstraction
 *
 * Implements persistent object storage abstraction supporting:
 * - 's3' (AWS S3, Cloudflare R2, MinIO, Wasabi, Backblaze B2, etc.)
 * - 'local' (disk fallback with full path traversal sanitization and backward compatibility)
 *
 * Required conceptual operations:
 * - upload(fileBuffer, key, mimeType, isPublic)
 * - download(key, isPublic)
 * - delete(key, isPublic)
 * - exists(key, isPublic)
 * - getPublicUrl(key)
 *
 * RESUME PRIVACY:
 * Resumes are NEVER stored in public buckets / paths. Download requires authenticated
 * backend ownership verification and is streamed directly by the API.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim();

// Local directory constants
const LOCAL_BASE_DIR = path.join(__dirname, '..', 'uploads');
const LOCAL_RESUMES_DIR = path.join(LOCAL_BASE_DIR, 'resumes');
const LOCAL_AVATARS_DIR = path.join(LOCAL_BASE_DIR, 'avatars');

// Ensure local directories exist if local or fallback is needed
[LOCAL_BASE_DIR, LOCAL_RESUMES_DIR, LOCAL_AVATARS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore if directory creation fails in read-only environments
    }
  }
});

let s3Client = null;

if (STORAGE_PROVIDER === 's3') {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');

    const s3Config = {
      region: process.env.S3_REGION || 'us-east-1',
    };

    if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      };
    }

    if (process.env.S3_ENDPOINT) {
      s3Config.endpoint = process.env.S3_ENDPOINT;
      s3Config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
    }

    s3Client = new S3Client(s3Config);
  } catch (err) {
    console.error('Storage Service: Failed to initialize S3Client:', err.message);
  }
}

/**
 * Get S3 bucket name
 */
function getS3Bucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket && STORAGE_PROVIDER === 's3') {
    console.warn('Storage Service: S3_BUCKET is not set in environment variables.');
  }
  return bucket || 'careerodyssey-storage';
}

/**
 * Sanitize storage key against path traversal
 */
function sanitizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  // Normalize forward/backward slashes and remove relative segments
  return key.replace(/\\/g, '/').replace(/\.\.+/g, '').replace(/^\/+/, '');
}

/**
 * Get local storage path for key
 */
function getLocalPath(key, isPublic = false) {
  const safeBase = path.basename(key);
  const targetDir = isPublic ? LOCAL_AVATARS_DIR : LOCAL_RESUMES_DIR;
  return path.join(targetDir, safeBase);
}

/**
 * Upload object to storage provider
 * @param {Buffer} buffer - File buffer
 * @param {string} key - Unique storage key (e.g. resumes/xyz.pdf or avatars/xyz.png)
 * @param {string} mimeType - File MIME type
 * @param {boolean} isPublic - Whether the object is an avatar or public asset (false for resumes)
 * @returns {Promise<{ key: string, location?: string }>}
 */
async function uploadFile(buffer, key, mimeType, isPublic = false) {
  const sanitized = sanitizeKey(key);
  if (!sanitized) {
    throw new Error('Invalid storage key provided');
  }

  if (STORAGE_PROVIDER === 's3' && s3Client) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const bucket = getS3Bucket();

    // Avatars can have public-read ACL if provider supports ACLs, resumes are strictly private
    const params = {
      Bucket: bucket,
      Key: sanitized,
      Body: buffer,
      ContentType: mimeType,
    };

    if (isPublic && process.env.S3_ENABLE_PUBLIC_ACL === 'true') {
      params.ACL = 'public-read';
    }

    await s3Client.send(new PutObjectCommand(params));

    let publicUrl = null;
    if (isPublic) {
      if (process.env.S3_PUBLIC_DOMAIN) {
        publicUrl = `https://${process.env.S3_PUBLIC_DOMAIN}/${sanitized}`;
      } else if (process.env.S3_ENDPOINT) {
        publicUrl = `${process.env.S3_ENDPOINT}/${bucket}/${sanitized}`;
      } else {
        const region = process.env.S3_REGION || 'us-east-1';
        publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${sanitized}`;
      }
    }

    return {
      key: sanitized,
      location: publicUrl,
    };
  }

  // Local filesystem storage
  const localTarget = getLocalPath(sanitized, isPublic);
  fs.writeFileSync(localTarget, buffer);

  return {
    key: sanitized,
    location: isPublic ? `/uploads/avatars/${path.basename(sanitized)}` : null,
  };
}

/**
 * Download object stream or buffer from storage provider
 * @param {string} key - Storage key
 * @param {boolean} isPublic - Category flag
 * @returns {Promise<{ stream?: import('stream').Readable, buffer?: Buffer, mimeType?: string, contentLength?: number }>}
 */
async function downloadFile(key, isPublic = false) {
  const sanitized = sanitizeKey(key);
  if (!sanitized) {
    throw new Error('Invalid storage key provided');
  }

  if (STORAGE_PROVIDER === 's3' && s3Client) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const bucket = getS3Bucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: sanitized,
    });

    const response = await s3Client.send(command);
    return {
      stream: response.Body,
      mimeType: response.ContentType,
      contentLength: response.ContentLength,
    };
  }

  // Local filesystem fallback
  const localTarget = getLocalPath(sanitized, isPublic);
  if (!fs.existsSync(localTarget)) {
    // Check root uploads directory or alternative
    const altTarget = path.join(LOCAL_BASE_DIR, sanitized);
    if (fs.existsSync(altTarget)) {
      return {
        stream: fs.createReadStream(altTarget),
        contentLength: fs.statSync(altTarget).size,
      };
    }
    throw new Error('File not found in local storage');
  }

  return {
    stream: fs.createReadStream(localTarget),
    contentLength: fs.statSync(localTarget).size,
  };
}

/**
 * Delete object from storage provider
 * @param {string} key - Storage key
 * @param {boolean} isPublic - Category flag
 * @returns {Promise<boolean>}
 */
async function deleteFile(key, isPublic = false) {
  if (!key) return false;
  const sanitized = sanitizeKey(key);
  if (!sanitized) return false;

  if (STORAGE_PROVIDER === 's3' && s3Client) {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const bucket = getS3Bucket();

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: sanitized,
        })
      );
      return true;
    } catch (err) {
      console.error('Storage Service: S3 Delete error:', err.message);
      return false;
    }
  }

  // Local filesystem delete
  try {
    const localTarget = getLocalPath(sanitized, isPublic);
    if (fs.existsSync(localTarget)) {
      fs.unlinkSync(localTarget);
      return true;
    }
    const altTarget = path.join(LOCAL_BASE_DIR, sanitized);
    if (fs.existsSync(altTarget)) {
      fs.unlinkSync(altTarget);
      return true;
    }
  } catch (err) {
    console.error('Storage Service: Local delete error:', err.message);
  }
  return false;
}

/**
 * Check if object exists in storage provider
 * @param {string} key - Storage key
 * @param {boolean} isPublic - Category flag
 * @returns {Promise<boolean>}
 */
async function fileExists(key, isPublic = false) {
  if (!key) return false;
  const sanitized = sanitizeKey(key);
  if (!sanitized) return false;

  if (STORAGE_PROVIDER === 's3' && s3Client) {
    try {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const bucket = getS3Bucket();

      await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: sanitized,
        })
      );
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      return false;
    }
  }

  // Local filesystem check
  const localTarget = getLocalPath(sanitized, isPublic);
  if (fs.existsSync(localTarget)) return true;
  const altTarget = path.join(LOCAL_BASE_DIR, sanitized);
  return fs.existsSync(altTarget);
}

/**
 * Get public URL for avatars (Never used for private resumes!)
 */
function getPublicAvatarUrl(key) {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:') || key.startsWith('blob:')) {
    return key;
  }
  if (STORAGE_PROVIDER === 's3') {
    const sanitized = sanitizeKey(key);
    const bucket = getS3Bucket();
    if (process.env.S3_PUBLIC_DOMAIN) {
      return `https://${process.env.S3_PUBLIC_DOMAIN}/${sanitized}`;
    }
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${bucket}/${sanitized}`;
    }
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${sanitized}`;
  }
  // Local fallback
  return key.startsWith('/uploads/avatars/') ? key : `/uploads/avatars/${path.basename(key)}`;
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  getPublicAvatarUrl,
  sanitizeKey,
  STORAGE_PROVIDER,
  LOCAL_RESUMES_DIR,
  LOCAL_AVATARS_DIR,
};
