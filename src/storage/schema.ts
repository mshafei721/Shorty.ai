import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCHEMA_VERSION = 1;

export interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  isDeleted: boolean;
}

export interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string; // ISO8601
  source: 'ai' | 'manual';
}

export interface VideoAsset {
  id: string;
  projectId: string;
  type: 'raw' | 'processed';
  scriptId: string | null;
  localUri: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string; // ISO8601
  exportedAt: string | null; // ISO8601
  status: 'ready' | 'processing' | 'failed' | 'cancelled';
}

export interface AnalyticsEvents {
  [key: string]: number; // Event counters
}

export interface UserProfile {
  niche: string;
  subNiche: string;
  onboarded: boolean;
}

/**
 * Initialize AsyncStorage schema v1
 * Creates empty data structures if not already initialized
 */
export async function initializeSchema(): Promise<void> {
  try {
    const currentVersion = await AsyncStorage.getItem('appStateVersion');

    // Skip if already initialized
    if (currentVersion === String(SCHEMA_VERSION)) {
      return;
    }

    // Initialize schema v1
    await AsyncStorage.multiSet([
      ['appStateVersion', String(SCHEMA_VERSION)],
      ['projects', JSON.stringify([])],
      ['scripts', JSON.stringify([])],
      ['videos', JSON.stringify([])],
      ['analytics', JSON.stringify({})],
    ]);
  } catch (error) {
    console.error('Failed to initialize AsyncStorage schema:', error);
    throw error;
  }
}

/**
 * Migration hook for future schema versions
 * @param fromVersion - Current schema version
 * @param toVersion - Target schema version
 */
export async function migrateSchema(
  fromVersion: number,
  toVersion: number
): Promise<void> {
  // Future migrations will be implemented here
  // Example: if (fromVersion === 1 && toVersion === 2) { ... }
  console.log(`Migration from v${fromVersion} to v${toVersion} not implemented`);
}

/**
 * Get current schema version
 */
export async function getSchemaVersion(): Promise<number> {
  const version = await AsyncStorage.getItem('appStateVersion');
  return version ? parseInt(version, 10) : 0;
}

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    'appStateVersion',
    'projects',
    'scripts',
    'videos',
    'analytics',
    'userProfile',
  ]);
}
