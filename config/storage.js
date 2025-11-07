const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl: s3GetSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');

// ENV configuration
const WASABI_ACCESS_KEY_ID = process.env.WASABI_ACCESS_KEY_ID || "RZKB7PWZ9S93A7WY4665";
const WASABI_SECRET_ACCESS_KEY = process.env.WASABI_SECRET_ACCESS_KEY || "6zuVlN3kOaWPSCv444tOz6qc253Ur1KvSAke1zfF";
const WASABI_REGION = process.env.WASABI_REGION || 'eu-central-1';
const WASABI_ENDPOINT = process.env.WASABI_ENDPOINT || 'https://s3.eu-central-1.wasabisys.com';
const WASABI_BUCKET = process.env.WASABI_BUCKET || 'adternative-apps';
const WASABI_PUBLIC_BASE_URL = process.env.WASABI_PUBLIC_BASE_URL || '';
const WASABI_FORCE_PATH_STYLE = String(process.env.WASABI_FORCE_PATH_STYLE || 'true').toLowerCase() !== 'false';

if (!WASABI_BUCKET) {
  // eslint-disable-next-line no-console
  console.warn('[storage] WASABI_BUCKET is not set. Uploads will fail until configured.');
}

let s3ClientSingleton = null;

const getS3Client = () => {
  if (s3ClientSingleton) return s3ClientSingleton;
  s3ClientSingleton = new S3Client({
    region: WASABI_REGION,
    endpoint: WASABI_ENDPOINT,
    forcePathStyle: WASABI_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: WASABI_ACCESS_KEY_ID,
      secretAccessKey: WASABI_SECRET_ACCESS_KEY
    }
  });
  return s3ClientSingleton;
};

const sanitizeFilename = (name) => {
  const base = String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
  return base.length > 200 ? base.slice(-200) : base;
};

const inferContentType = (filename, fallback) => {
  const guessed = mime.lookup(filename || '') || '';
  return guessed || fallback || 'application/octet-stream';
};

const buildKey = ({ prefix = 'uploads', originalName, extension, hint }) => {
  const ext = String(extension || path.extname(originalName || '') || '').toLowerCase().replace(/^\./, '');
  const safeBase = sanitizeFilename(path.basename(originalName || (hint || 'file'), `.${ext}`));
  const random = crypto.randomBytes(6).toString('hex');
  const ts = Date.now();
  const key = `${prefix.replace(/\/+$/,'')}/${safeBase}-${ts}-${random}${ext ? `.${ext}` : ''}`;
  return key.replace(/\/+/, '/');
};

const getPublicUrl = (key) => {
  const cleanKey = String(key || '').replace(/^\/+/, '');
  if (WASABI_PUBLIC_BASE_URL) {
    return `${WASABI_PUBLIC_BASE_URL.replace(/\/$/, '')}/${cleanKey}`;
  }
  const base = WASABI_ENDPOINT.replace(/\/$/, '');
  return `${base}/${WASABI_BUCKET}/${cleanKey}`;
};

const getSignedUrl = async (key, expiresInSeconds = 900) => {
  const client = getS3Client();
  const cmd = new HeadObjectCommand({ Bucket: WASABI_BUCKET, Key: key });
  // Use GET (GetObject) style URL to download; presign Head ensures object exists
  // We will generate a signed URL for GET
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const getCmd = new GetObjectCommand({ Bucket: WASABI_BUCKET, Key: key });
  return s3GetSignedUrl(client, getCmd, { expiresIn: expiresInSeconds });
};

const uploadBuffer = async ({ buffer, originalName, key, contentType, prefix = 'uploads', acl = 'private', metadata = {} }) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('uploadBuffer: buffer is required');
  }
  const finalKey = key || buildKey({ prefix, originalName });
  const finalContentType = contentType || inferContentType(originalName);
  const client = getS3Client();
  const cmd = new PutObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: finalKey,
    Body: buffer,
    ContentType: finalContentType,
    ACL: acl,
    Metadata: metadata
  });
  await client.send(cmd);
  return {
    key: finalKey,
    contentType: finalContentType,
    url: acl === 'public-read' ? getPublicUrl(finalKey) : null
  };
};

const uploadStream = async ({ stream, originalName, key, contentType, prefix = 'uploads', acl = 'private', metadata = {} }) => {
  if (!stream || typeof stream.pipe !== 'function') {
    throw new Error('uploadStream: stream is required');
  }
  const finalKey = key || buildKey({ prefix, originalName });
  const finalContentType = contentType || inferContentType(originalName);
  const client = getS3Client();
  const uploader = new Upload({
    client,
    params: {
      Bucket: WASABI_BUCKET,
      Key: finalKey,
      Body: stream,
      ContentType: finalContentType,
      ACL: acl,
      Metadata: metadata
    }
  });
  await uploader.done();
  return {
    key: finalKey,
    contentType: finalContentType,
    url: acl === 'public-read' ? getPublicUrl(finalKey) : null
  };
};

const deleteObject = async (key) => {
  const client = getS3Client();
  const cmd = new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: key });
  await client.send(cmd);
  return { key };
};

// Convenience helpers for common app use-cases
const uploadEntityLogo = async ({ buffer, originalName, entityId, publicRead = true }) => {
  const acl = publicRead ? 'public-read' : 'private';
  const prefix = `entities/${entityId}/branding`;
  return uploadBuffer({ buffer, originalName, prefix, acl });
};

const uploadBrandingAsset = async ({ buffer, originalName, entityId, publicRead = true }) => {
  const acl = publicRead ? 'public-read' : 'private';
  const prefix = `entities/${entityId}/assets`;
  return uploadBuffer({ buffer, originalName, prefix, acl });
};

const uploadUserAvatar = async ({ buffer, originalName, userId, publicRead = true }) => {
  const acl = publicRead ? 'public-read' : 'private';
  const prefix = `users/${userId}/avatar`;
  return uploadBuffer({ buffer, originalName, prefix, acl });
};

module.exports = {
  getS3Client,
  bucket: WASABI_BUCKET,
  endpoint: WASABI_ENDPOINT,
  getPublicUrl,
  getSignedUrl,
  uploadBuffer,
  uploadStream,
  deleteObject,
  uploadEntityLogo,
  uploadBrandingAsset,
  uploadUserAvatar
};


