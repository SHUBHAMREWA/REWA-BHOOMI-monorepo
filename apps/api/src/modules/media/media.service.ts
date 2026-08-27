import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import crypto from 'crypto';
import sharp from 'sharp';
import path from 'path';
import https from 'https';

import { env } from '../../config/env';

const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'dummy-access-key';
const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'dummy-secret-key';
const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'rewa-bhoomi-media';
const publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || 'http://localhost';
const endpoint = env.CLOUDFLARE_R2_ENDPOINT || 'https://dummy.r2.cloudflarestorage.com';

// Custom HTTPS agent that forces TLSv1.2 — fixes EPROTO sslv3 handshake
// failures seen on some Render/Linux environments with Cloudflare R2
const httpsAgent = new https.Agent({
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  rejectUnauthorized: true,
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Cloudflare R2 requires path-style URLs to prevent SSL handshake errors on sub-subdomains
  // @ts-ignore
  requestChecksumCalculation: 'WHEN_REQUIRED',
  requestHandler: new NodeHttpHandler({
    httpsAgent,
    connectionTimeout: 15_000,
    requestTimeout: 60_000,
  }),
});


export const processImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

export const generateUniqueFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}.webp`; // we always convert to webp
};

export const uploadToR2 = async (buffer: Buffer, key: string, contentType = 'image/webp'): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);
  return `${publicUrl}/${key}`;
};

export const deleteFromR2 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3.send(command);
};
