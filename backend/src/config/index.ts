import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  server: {
    port: parseInt(optional('PORT', '3000'), 10),
    nodeEnv: optional('NODE_ENV', 'development'),
  },
  storage: {
    uploadsDir: path.resolve(optional('UPLOADS_DIR', './uploads')),
    tempDir: path.resolve(optional('TEMP_DIR', './temp')),
    maxFileSizeMB: parseInt(optional('MAX_FILE_SIZE_MB', '500'), 10),
  },
  assemblyai: {
    apiKey: required('ASSEMBLYAI_API_KEY'),
  },
  shotstack: {
    apiKey: required('SHOTSTACK_API_KEY'),
    env: optional('SHOTSTACK_ENV', 'stage') as 'stage' | 'v1',
  },
  mux: {
    tokenId: required('MUX_TOKEN_ID'),
    tokenSecret: required('MUX_TOKEN_SECRET'),
  },
  jobs: {
    maxProcessingTimeMs: parseInt(optional('MAX_PROCESSING_TIME_MS', '1200000'), 10),
    cleanupTempFilesAfterMs: parseInt(optional('CLEANUP_TEMP_FILES_AFTER_MS', '3600000'), 10),
  },
} as const;
