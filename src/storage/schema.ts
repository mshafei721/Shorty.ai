import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCHEMA_VERSION = 1;

export interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string;
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
  createdAt: string;
  exportedAt: string | null;
  status: 'ready' | 'processing' | 'failed' | 'cancelled';
}

export interface AnalyticsEvents {
  projectsCreated: number;
  videosRecorded: number;
  videosExported: number;
  lastReset: string;
}

export interface UserProfile {
  niche: string;
  subNiche?: string;
  onboarded: boolean;
  createdAt: string;
}

export interface FeatureSelections {
  subtitles: boolean;
  backgroundChange: {
    enabled: boolean;
    presetId: string | null;
  };
  backgroundMusic: {
    enabled: boolean;
    trackId: string | null;
    volume: number;
  };
  introOutro: {
    enabled: boolean;
    templateId: string | null;
  };
  fillerWordRemoval: boolean;
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  requestedFeatures: FeatureSelections;
  startedAt: string;
  completedAt: string | null;
  error: {
    code: string;
    message: string;
  } | null;
  retries: number;
}

export async function initializeSchema(): Promise<void> {
  try {
    const currentVersion = await AsyncStorage.getItem('appStateVersion');

    if (currentVersion === String(SCHEMA_VERSION)) {
      return;
    }

    await AsyncStorage.multiSet([
      ['appStateVersion', String(SCHEMA_VERSION)],
      ['projects', JSON.stringify([])],
      ['scripts', JSON.stringify([])],
      ['videos', JSON.stringify([])],
      ['analytics', JSON.stringify({
        projectsCreated: 0,
        videosRecorded: 0,
        videosExported: 0,
        lastReset: new Date().toISOString()
      })],
    ]);
  } catch (error) {
    console.error('Failed to initialize AsyncStorage schema:', error);
    throw error;
  }
}

export async function migrateSchema(
  fromVersion: number,
  toVersion: number
): Promise<void> {
  console.log(`Migration from v${fromVersion} to v${toVersion} not implemented`);
}

export async function getSchemaVersion(): Promise<number> {
  const version = await AsyncStorage.getItem('appStateVersion');
  return version ? parseInt(version, 10) : 0;
}

export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys);
}
