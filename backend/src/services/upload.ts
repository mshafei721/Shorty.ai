import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import type { UploadedVideo } from '../types';

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_FILE_SIZE_BYTES = config.storage.maxFileSizeMB * 1024 * 1024;

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureDir(config.storage.uploadsDir);
    cb(null, config.storage.uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export async function processUploadedFile(file: Express.Multer.File): Promise<UploadedVideo> {
  const video: UploadedVideo = {
    id: uuidv4(),
    originalName: file.originalname,
    storedPath: file.path,
    sizeBytes: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
  };

  return video;
}

export async function deleteUploadedFile(storedPath: string): Promise<void> {
  try {
    await fs.unlink(storedPath);
  } catch (error) {
    console.error(`Failed to delete file ${storedPath}:`, error);
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
