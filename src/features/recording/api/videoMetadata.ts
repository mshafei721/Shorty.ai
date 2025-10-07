/**
 * Video Metadata Storage API (C3)
 *
 * CRUD operations for video metadata in AsyncStorage.
 * Uses keyed storage with index for efficient listing.
 *
 * @module features/recording/api/videoMetadata
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export interface VideoMetadata {
  assetId: string;
  projectId: string;
  scriptId?: string | null;
  filePath: string;
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  sizeBytes: number;
  createdAt: string;
  processingStatus: 'raw' | 'processed' | 'failed';
  notes?: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = 'shortyai:videoMeta';

function getMetadataKey(projectId: string, assetId: string): string {
  return `${STORAGE_PREFIX}:${projectId}:${assetId}`;
}

function getIndexKey(projectId: string): string {
  return `${STORAGE_PREFIX}:index:${projectId}`;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create new video metadata record
 */
export async function createVideoMetadata(meta: VideoMetadata): Promise<void> {
  try {
    const key = getMetadataKey(meta.projectId, meta.assetId);
    const indexKey = getIndexKey(meta.projectId);

    // Store metadata
    await AsyncStorage.setItem(key, JSON.stringify(meta));

    // Update index
    const indexData = await AsyncStorage.getItem(indexKey);
    const index: string[] = indexData ? JSON.parse(indexData) : [];

    if (!index.includes(meta.assetId)) {
      index.push(meta.assetId);
      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Failed to create video metadata:', error);
    throw new Error('Failed to save video metadata');
  }
}

/**
 * Get video metadata by ID
 */
export async function getVideoMetadata(
  projectId: string,
  assetId: string
): Promise<VideoMetadata | null> {
  try {
    const key = getMetadataKey(projectId, assetId);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as VideoMetadata;
  } catch (error) {
    console.error('Failed to get video metadata:', error);
    return null;
  }
}

/**
 * List all video metadata for a project
 */
export async function listVideoMetadata(projectId: string): Promise<VideoMetadata[]> {
  try {
    const indexKey = getIndexKey(projectId);
    const indexData = await AsyncStorage.getItem(indexKey);

    if (!indexData) {
      return [];
    }

    const index: string[] = JSON.parse(indexData);
    const metadataPromises = index.map((assetId) =>
      getVideoMetadata(projectId, assetId)
    );

    const results = await Promise.all(metadataPromises);

    // Filter out nulls (deleted items)
    return results.filter((meta): meta is VideoMetadata => meta !== null);
  } catch (error) {
    console.error('Failed to list video metadata:', error);
    return [];
  }
}

/**
 * Update video metadata (partial update)
 */
export async function updateVideoMetadata(
  projectId: string,
  assetId: string,
  patch: Partial<VideoMetadata>
): Promise<void> {
  try {
    const existing = await getVideoMetadata(projectId, assetId);

    if (!existing) {
      throw new Error(`Video metadata not found: ${assetId}`);
    }

    const updated: VideoMetadata = {
      ...existing,
      ...patch,
      // Ensure immutable fields aren't changed
      assetId: existing.assetId,
      projectId: existing.projectId,
      createdAt: existing.createdAt,
    };

    const key = getMetadataKey(projectId, assetId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update video metadata:', error);
    // Rethrow original error if it's our "not found" error
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    throw new Error('Failed to update video metadata');
  }
}

/**
 * Delete video metadata
 */
export async function deleteVideoMetadata(
  projectId: string,
  assetId: string
): Promise<void> {
  try {
    const key = getMetadataKey(projectId, assetId);
    const indexKey = getIndexKey(projectId);

    // Remove metadata
    await AsyncStorage.removeItem(key);

    // Update index
    const indexData = await AsyncStorage.getItem(indexKey);
    if (indexData) {
      const index: string[] = JSON.parse(indexData);
      const updatedIndex = index.filter((id) => id !== assetId);
      await AsyncStorage.setItem(indexKey, JSON.stringify(updatedIndex));
    }
  } catch (error) {
    console.error('Failed to delete video metadata:', error);
    throw new Error('Failed to delete video metadata');
  }
}

/**
 * Clear all video metadata for a project
 */
export async function clearProjectMetadata(projectId: string): Promise<void> {
  try {
    const metadata = await listVideoMetadata(projectId);
    const deletePromises = metadata.map((meta) =>
      deleteVideoMetadata(projectId, meta.assetId)
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to clear project metadata:', error);
    throw new Error('Failed to clear project metadata');
  }
}

/**
 * Get metadata count for a project
 */
export async function getMetadataCount(projectId: string): Promise<number> {
  try {
    const indexKey = getIndexKey(projectId);
    const indexData = await AsyncStorage.getItem(indexKey);

    if (!indexData) {
      return 0;
    }

    const index: string[] = JSON.parse(indexData);
    return index.length;
  } catch (error) {
    console.error('Failed to get metadata count:', error);
    return 0;
  }
}
