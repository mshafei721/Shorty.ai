/**
 * Storage Guards
 *
 * Utilities to check available storage and enforce recording constraints.
 * PRD requirement: Warn when <2GB free, block recording when <500MB free.
 *
 * @module utils/storageGuards
 */

import * as FileSystem from 'expo-file-system';

export interface StorageStatus {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  freeMB: number;
  freeGB: number;
  level: 'critical' | 'warning' | 'ok';
}

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;

const CRITICAL_THRESHOLD_MB = 500;  // Block recording
const WARNING_THRESHOLD_MB = 2048;  // 2GB - Show warning

/**
 * Check available storage on device
 * Note: Expo SDK 54 removed getFreeDiskStorageAsync, fallback to mock values for web
 */
export async function checkStorageStatus(): Promise<StorageStatus> {
  let freeBytes: number;

  try {
    // For native platforms, use the legacy API if available
    if (FileSystem.getFreeDiskStorageAsync) {
      freeBytes = await FileSystem.getFreeDiskStorageAsync();
    } else {
      // Fallback for web or when API is unavailable
      // Return optimistic values (2GB free) to avoid blocking functionality
      freeBytes = 2 * BYTES_PER_GB;
    }
  } catch (error) {
    console.warn('Storage check failed, using fallback:', error);
    freeBytes = 2 * BYTES_PER_GB;
  }

  // Estimate total capacity (actual value not critical for warnings)
  const totalBytes = 64 * BYTES_PER_GB; // Typical device storage
  const usedBytes = Math.max(0, totalBytes - freeBytes);

  const freeMB = freeBytes / BYTES_PER_MB;
  const freeGB = freeBytes / BYTES_PER_GB;

  let level: 'critical' | 'warning' | 'ok' = 'ok';

  if (freeMB < CRITICAL_THRESHOLD_MB) {
    level = 'critical';
  } else if (freeMB < WARNING_THRESHOLD_MB) {
    level = 'warning';
  }

  return {
    totalBytes,
    freeBytes,
    usedBytes,
    freeMB,
    freeGB,
    level,
  };
}

/**
 * Check if recording is allowed based on available storage
 */
export async function canRecord(): Promise<{ allowed: boolean; status: StorageStatus }> {
  const status = await checkStorageStatus();
  const allowed = status.level !== 'critical';

  return { allowed, status };
}

/**
 * Format storage size in human-readable format
 */
export function formatStorageSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) {
    return `${Math.round(bytes / 1024)} KB`;
  } else if (bytes < BYTES_PER_GB) {
    return `${Math.round(bytes / BYTES_PER_MB)} MB`;
  } else {
    return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
  }
}

/**
 * Get user-friendly message based on storage level
 */
export function getStorageMessage(status: StorageStatus): { title: string; message: string } {
  switch (status.level) {
    case 'critical':
      return {
        title: 'Storage Critical',
        message: `Only ${Math.round(status.freeMB)} MB free. Recording is disabled. Free up space to continue.`,
      };
    case 'warning':
      return {
        title: 'Low Storage',
        message: `${status.freeGB.toFixed(1)} GB free. Consider freeing up space soon.`,
      };
    case 'ok':
      return {
        title: 'Storage OK',
        message: `${status.freeGB.toFixed(1)} GB available`,
      };
  }
}

/**
 * Estimate video file size based on duration (rough estimate)
 * Assumes ~8-12 Mbps bitrate for 1080p video
 */
export function estimateVideoSize(durationSec: number): number {
  const BITRATE_MBPS = 10; // Average between 8-12 Mbps
  const bitsPerSecond = BITRATE_MBPS * 1024 * 1024;
  const bytesPerSecond = bitsPerSecond / 8;

  return Math.ceil(bytesPerSecond * durationSec);
}

/**
 * Check if there's enough space for estimated video duration
 */
export async function canRecordDuration(durationSec: number): Promise<boolean> {
  const status = await checkStorageStatus();

  if (status.level === 'critical') {
    return false;
  }

  const estimatedSize = estimateVideoSize(durationSec);
  const requiredBytes = estimatedSize + (CRITICAL_THRESHOLD_MB * BYTES_PER_MB); // Add safety buffer

  return status.freeBytes > requiredBytes;
}
