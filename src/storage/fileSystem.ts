import * as FileSystem from 'expo-file-system/legacy';
import {
  generateRawVideoFilename,
  generateProcessedVideoFilename,
  validateUUID,
} from '../utils/fileNaming';

const BASE_DIR = FileSystem.documentDirectory || '';
const VIDEOS_DIR = `${BASE_DIR}videos/`;
const RAW_DIR = `${VIDEOS_DIR}raw/`;
const PROCESSED_DIR = `${VIDEOS_DIR}processed/`;
const TEMP_DIR = `${VIDEOS_DIR}temp/`;

const MIN_STORAGE_THRESHOLD = 500 * 1024 * 1024;

export interface SaveVideoResult {
  path: string;
  size: number;
  warning?: string;
}

export interface DeleteResult {
  deleted: number;
  errors: number;
}

export interface CleanupResult {
  deleted: number;
}

export function getRawVideoDir(projectId: string): string {
  if (!validateUUID(projectId)) {
    throw new Error(`Invalid projectId UUID: ${projectId}`);
  }
  return `${RAW_DIR}${projectId}/`;
}

export function getProcessedVideoDir(): string {
  return PROCESSED_DIR;
}

export function getTempVideoDir(): string {
  return TEMP_DIR;
}

export function getRawVideoPath(projectId: string, timestamp?: number): string {
  if (!validateUUID(projectId)) {
    throw new Error(`Invalid projectId UUID: ${projectId}`);
  }
  const filename = timestamp
    ? `raw_${projectId}_${timestamp}.mp4`
    : generateRawVideoFilename(projectId);
  return `${getRawVideoDir(projectId)}${filename}`;
}

export function getProcessedVideoPath(videoId: string, timestamp?: number): string {
  if (!validateUUID(videoId)) {
    throw new Error(`Invalid videoId UUID: ${videoId}`);
  }
  const filename = timestamp
    ? `processed_${videoId}_${timestamp}.mp4`
    : generateProcessedVideoFilename(videoId);
  return `${PROCESSED_DIR}${filename}`;
}

export function getTempVideoPath(videoId: string): string {
  if (!validateUUID(videoId)) {
    throw new Error(`Invalid videoId UUID: ${videoId}`);
  }
  return `${TEMP_DIR}${videoId}.mp4`;
}

export async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(path);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  } catch (error) {
    console.error(`Failed to create directory ${path}:`, error);
    throw new Error(`Directory creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveRawVideo(
  projectId: string,
  sourceUri: string
): Promise<SaveVideoResult> {
  try {
    const dir = getRawVideoDir(projectId);
    await ensureDirectoryExists(dir);

    const destPath = getRawVideoPath(projectId);
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });

    const fileInfo = await FileSystem.getInfoAsync(destPath);
    if (!fileInfo.exists || !fileInfo.size) {
      throw new Error('File copy verification failed');
    }

    const availableStorage = await getAvailableStorage();
    const warning = availableStorage < MIN_STORAGE_THRESHOLD
      ? `Low storage: ${Math.round(availableStorage / 1024 / 1024)} MB remaining`
      : undefined;

    return {
      path: destPath,
      size: fileInfo.size,
      warning,
    };
  } catch (error) {
    console.error('Failed to save raw video:', error);
    throw new Error(`Save raw video failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveProcessedVideo(
  videoId: string,
  sourceUri: string
): Promise<SaveVideoResult> {
  try {
    await ensureDirectoryExists(PROCESSED_DIR);

    const destPath = getProcessedVideoPath(videoId);
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });

    const fileInfo = await FileSystem.getInfoAsync(destPath);
    if (!fileInfo.exists || !fileInfo.size) {
      throw new Error('File copy verification failed');
    }

    const availableStorage = await getAvailableStorage();
    const warning = availableStorage < MIN_STORAGE_THRESHOLD
      ? `Low storage: ${Math.round(availableStorage / 1024 / 1024)} MB remaining`
      : undefined;

    return {
      path: destPath,
      size: fileInfo.size,
      warning,
    };
  } catch (error) {
    console.error('Failed to save processed video:', error);
    throw new Error(`Save processed video failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteVideo(path: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch (error) {
    console.error(`Failed to delete video ${path}:`, error);
    throw new Error(`Delete video failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteProjectVideos(
  projectId: string,
  confirm: boolean
): Promise<DeleteResult> {
  if (!confirm) {
    return { deleted: 0, errors: 0 };
  }

  try {
    const projectDir = getRawVideoDir(projectId);
    const dirInfo = await FileSystem.getInfoAsync(projectDir);

    if (!dirInfo.exists) {
      return { deleted: 0, errors: 0 };
    }

    const files = await FileSystem.readDirectoryAsync(projectDir);
    let deleted = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const filePath = `${projectDir}${file}`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        deleted++;
      } catch (error) {
        console.error(`Failed to delete file ${file}:`, error);
        errors++;
      }
    }

    try {
      await FileSystem.deleteAsync(projectDir, { idempotent: true });
    } catch (error) {
      console.error(`Failed to delete project directory ${projectDir}:`, error);
    }

    return { deleted, errors };
  } catch (error) {
    console.error(`Failed to delete project videos for ${projectId}:`, error);
    return { deleted: 0, errors: 1 };
  }
}

export async function getAvailableStorage(): Promise<number> {
  return 0;
}

export async function getDirectorySize(path: string): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(path);

    if (!dirInfo.exists) {
      return 0;
    }

    if (!dirInfo.isDirectory) {
      return dirInfo.size || 0;
    }

    const files = await FileSystem.readDirectoryAsync(path);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${path}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        if (fileInfo.isDirectory) {
          totalSize += await getDirectorySize(`${filePath}/`);
        } else {
          totalSize += fileInfo.size || 0;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`Failed to get directory size for ${path}:`, error);
    return 0;
  }
}

export async function cleanupTempVideos(): Promise<CleanupResult> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TEMP_DIR);

    if (!dirInfo.exists) {
      return { deleted: 0 };
    }

    const files = await FileSystem.readDirectoryAsync(TEMP_DIR);
    let deleted = 0;

    for (const file of files) {
      try {
        const filePath = `${TEMP_DIR}${file}`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        deleted++;
      } catch (error) {
        console.error(`Failed to delete temp file ${file}:`, error);
      }
    }

    return { deleted };
  } catch (error) {
    console.error('Failed to cleanup temp videos:', error);
    return { deleted: 0 };
  }
}
