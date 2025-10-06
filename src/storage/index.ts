import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageSchema, DEFAULT_STORAGE_STATE, STORAGE_KEYS, APP_STATE_VERSION } from './schema';

export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function initializeStorage(): Promise<void> {
  try {
    const existingVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE_VERSION);

    if (existingVersion === null) {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.APP_STATE_VERSION, String(APP_STATE_VERSION)],
        [STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_STORAGE_STATE.projects)],
        [STORAGE_KEYS.SCRIPTS, JSON.stringify(DEFAULT_STORAGE_STATE.scripts)],
        [STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_STORAGE_STATE.videos)],
        [STORAGE_KEYS.ANALYTICS, JSON.stringify(DEFAULT_STORAGE_STATE.analytics)],
        [STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_STORAGE_STATE.userProfile)],
      ]);
    } else if (Number(existingVersion) < APP_STATE_VERSION) {
      await migrateStorage(Number(existingVersion), APP_STATE_VERSION);
    }
  } catch (error) {
    throw new StorageError('Failed to initialize storage', error as Error);
  }
}

async function migrateStorage(fromVersion: number, toVersion: number): Promise<void> {
  if (fromVersion === toVersion) return;

  await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE_VERSION, String(toVersion));
}

<<<<<<< Updated upstream
function getStorageKey(key: keyof StorageSchema): string {
  const keyMap: Record<keyof StorageSchema, string> = {
    appStateVersion: STORAGE_KEYS.APP_STATE_VERSION,
    projects: STORAGE_KEYS.PROJECTS,
    scripts: STORAGE_KEYS.SCRIPTS,
    videos: STORAGE_KEYS.VIDEOS,
    analytics: STORAGE_KEYS.ANALYTICS,
    userProfile: STORAGE_KEYS.USER_PROFILE,
  };
  return keyMap[key];
}

=======
>>>>>>> Stashed changes
export async function getStorageItem<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K] | null> {
  try {
<<<<<<< Updated upstream
    const storageKey = getStorageKey(key);
=======
    const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
>>>>>>> Stashed changes
    const value = await AsyncStorage.getItem(storageKey);

    if (value === null) return null;

    if (key === 'appStateVersion') {
      return Number(value) as StorageSchema[K];
    }

    return JSON.parse(value) as StorageSchema[K];
  } catch (error) {
    throw new StorageError(`Failed to get storage item: ${key}`, error as Error);
  }
}

export async function setStorageItem<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  try {
<<<<<<< Updated upstream
    const storageKey = getStorageKey(key);
=======
    const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
>>>>>>> Stashed changes
    const serialized = key === 'appStateVersion' ? String(value) : JSON.stringify(value);

    await AsyncStorage.setItem(storageKey, serialized);
  } catch (error) {
    throw new StorageError(`Failed to set storage item: ${key}`, error as Error);
  }
}

export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    throw new StorageError('Failed to clear storage', error as Error);
  }
}

export * from './schema';
