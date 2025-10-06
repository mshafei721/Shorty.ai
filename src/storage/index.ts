import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageSchema, DEFAULT_STORAGE_STATE, STORAGE_KEYS, APP_STATE_VERSION } from './schema';
import { migrations } from './migrations';

export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function checkSchemaVersion(): Promise<number> {
  try {
    const version = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE_VERSION);
    return version ? Number(version) : 0;
  } catch (error) {
    throw new StorageError('Failed to check schema version', error as Error);
  }
}

export async function backupStorage(version: number): Promise<void> {
  try {
    const backupKey = `backup_v${version}`;
    const allKeys = await AsyncStorage.getAllKeys();
    const storageData = await AsyncStorage.multiGet(allKeys);

    await AsyncStorage.setItem(backupKey, JSON.stringify(storageData));
  } catch (error) {
    throw new StorageError(`Failed to backup storage for version ${version}`, error as Error);
  }
}

export async function rollbackMigration(version: number): Promise<void> {
  try {
    const backupKey = `backup_v${version}`;
    const backupData = await AsyncStorage.getItem(backupKey);

    if (!backupData) {
      throw new Error(`No backup found for version ${version}`);
    }

    const parsedBackup = JSON.parse(backupData) as [string, string][];

    await AsyncStorage.clear();
    await AsyncStorage.multiSet(parsedBackup);
    await AsyncStorage.removeItem(backupKey);
  } catch (error) {
    throw new StorageError(`Failed to rollback migration to version ${version}`, error as Error);
  }
}

export async function runMigrations(currentVersion: number): Promise<void> {
  const applicableMigrations = migrations.filter(m => m.version > currentVersion);

  if (applicableMigrations.length === 0) {
    return;
  }

  applicableMigrations.sort((a, b) => a.version - b.version);

  for (const migration of applicableMigrations) {
    const previousVersion = currentVersion;

    try {
      await backupStorage(previousVersion);

      await migration.up({
        getItem: getStorageItem,
        setItem: setStorageItem,
      });

      await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE_VERSION, String(migration.version));
      currentVersion = migration.version;
    } catch (error) {
      await rollbackMigration(previousVersion);
      throw new StorageError(
        `Migration to version ${migration.version} failed. Rolled back to version ${previousVersion}`,
        error as Error
      );
    }
  }
}

export async function initializeStorage(): Promise<void> {
  try {
    const existingVersion = await checkSchemaVersion();

    if (existingVersion === 0) {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.APP_STATE_VERSION, String(APP_STATE_VERSION)],
        [STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_STORAGE_STATE.projects)],
        [STORAGE_KEYS.SCRIPTS, JSON.stringify(DEFAULT_STORAGE_STATE.scripts)],
        [STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_STORAGE_STATE.videos)],
        [STORAGE_KEYS.ANALYTICS, JSON.stringify(DEFAULT_STORAGE_STATE.analytics)],
        [STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_STORAGE_STATE.userProfile)],
      ]);
    } else if (existingVersion < APP_STATE_VERSION) {
      await runMigrations(existingVersion);
    }
  } catch (error) {
    throw new StorageError('Failed to initialize storage', error as Error);
  }
}

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

export async function getStorageItem<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K] | null> {
  try {
    const storageKey = getStorageKey(key);
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
    const storageKey = getStorageKey(key);
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
