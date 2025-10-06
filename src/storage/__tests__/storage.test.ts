import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeStorage,
  getStorageItem,
  setStorageItem,
  clearStorage,
  checkSchemaVersion,
  backupStorage,
  rollbackMigration,
  runMigrations,
  StorageError,
  APP_STATE_VERSION,
  STORAGE_KEYS,
  DEFAULT_STORAGE_STATE,
} from '../index';
import { migrations } from '../migrations';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../migrations', () => ({
  migrations: [],
}));

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (migrations as any[]).length = 0;
  });

  describe('checkSchemaVersion', () => {
    it('should return current version when exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

      const version = await checkSchemaVersion();

      expect(version).toBe(1);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.APP_STATE_VERSION);
    });

    it('should return 0 when version does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const version = await checkSchemaVersion();

      expect(version).toBe(0);
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      await expect(checkSchemaVersion()).rejects.toThrow(StorageError);
      await expect(checkSchemaVersion()).rejects.toThrow('Failed to check schema version');
    });
  });

  describe('backupStorage', () => {
    it('should create backup of all storage data', async () => {
      const mockKeys = ['projects', 'scripts', 'videos'];
      const mockData: [string, string][] = [
        ['projects', '[]'],
        ['scripts', '[]'],
        ['videos', '[]'],
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await backupStorage(1);

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiGet).toHaveBeenCalledWith(mockKeys);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('backup_v1', JSON.stringify(mockData));
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(error);

      await expect(backupStorage(1)).rejects.toThrow(StorageError);
      await expect(backupStorage(1)).rejects.toThrow('Failed to backup storage for version 1');
    });
  });

  describe('rollbackMigration', () => {
    it('should restore storage from backup', async () => {
      const mockBackup: [string, string][] = [
        ['projects', '[]'],
        ['scripts', '[]'],
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockBackup));
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await rollbackMigration(1);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('backup_v1');
      expect(AsyncStorage.clear).toHaveBeenCalled();
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith(mockBackup);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('backup_v1');
    });

    it('should throw error when backup does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(rollbackMigration(1)).rejects.toThrow(StorageError);
      await expect(rollbackMigration(1)).rejects.toThrow('Failed to rollback migration to version 1');
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      await expect(rollbackMigration(1)).rejects.toThrow(StorageError);
    });
  });

  describe('runMigrations', () => {
    it('should run applicable migrations sequentially', async () => {
      const mockMigration1 = {
        version: 2,
        up: jest.fn().mockResolvedValue(undefined),
      };
      const mockMigration2 = {
        version: 3,
        up: jest.fn().mockResolvedValue(undefined),
      };

      (migrations as any[]).push(mockMigration1, mockMigration2);

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await runMigrations(1);

      expect(mockMigration1.up).toHaveBeenCalled();
      expect(mockMigration2.up).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.APP_STATE_VERSION, '2');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.APP_STATE_VERSION, '3');
    });

    it('should skip migrations when current version is up to date', async () => {
      const mockMigration = {
        version: 2,
        up: jest.fn().mockResolvedValue(undefined),
      };

      (migrations as any[]).push(mockMigration);

      await runMigrations(2);

      expect(mockMigration.up).not.toHaveBeenCalled();
    });

    it('should rollback on migration failure', async () => {
      const mockMigration = {
        version: 2,
        up: jest.fn().mockRejectedValue(new Error('Migration failed')),
      };

      (migrations as any[]).push(mockMigration);

      const mockBackup: [string, string][] = [['projects', '[]']];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['projects']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockBackup);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockBackup));
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await expect(runMigrations(1)).rejects.toThrow(StorageError);
      await expect(runMigrations(1)).rejects.toThrow('Migration to version 2 failed. Rolled back to version 1');

      expect(AsyncStorage.clear).toHaveBeenCalled();
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith(mockBackup);
    });

    it('should sort migrations by version', async () => {
      const executionOrder: number[] = [];
      const mockMigration3 = {
        version: 3,
        up: jest.fn().mockImplementation(async () => {
          executionOrder.push(3);
        }),
      };
      const mockMigration2 = {
        version: 2,
        up: jest.fn().mockImplementation(async () => {
          executionOrder.push(2);
        }),
      };

      (migrations as any[]).push(mockMigration3, mockMigration2);

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await runMigrations(1);

      expect(executionOrder).toEqual([2, 3]);
    });

    it('should create backups before each migration', async () => {
      const mockMigration1 = {
        version: 2,
        up: jest.fn().mockResolvedValue(undefined),
      };
      const mockMigration2 = {
        version: 3,
        up: jest.fn().mockResolvedValue(undefined),
      };

      (migrations as any[]).push(mockMigration1, mockMigration2);

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await runMigrations(1);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('backup_v1', expect.any(String));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('backup_v2', expect.any(String));
    });
  });

  describe('initializeStorage', () => {
    it('should initialize storage with default values when empty', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        [STORAGE_KEYS.APP_STATE_VERSION, String(APP_STATE_VERSION)],
        [STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_STORAGE_STATE.projects)],
        [STORAGE_KEYS.SCRIPTS, JSON.stringify(DEFAULT_STORAGE_STATE.scripts)],
        [STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_STORAGE_STATE.videos)],
        [STORAGE_KEYS.ANALYTICS, JSON.stringify(DEFAULT_STORAGE_STATE.analytics)],
        [STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_STORAGE_STATE.userProfile)],
      ]);
    });

    it('should not initialize when version is current', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(APP_STATE_VERSION));
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
    });

    it('should run migrations when version is lower', async () => {
      const mockMigration = {
        version: 2,
        up: jest.fn().mockResolvedValue(undefined),
      };

      (migrations as any[]).push(mockMigration);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(mockMigration.up).toHaveBeenCalled();
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      await expect(initializeStorage()).rejects.toThrow(StorageError);
      await expect(initializeStorage()).rejects.toThrow('Failed to initialize storage');
    });
  });

  describe('getStorageItem', () => {
    it('should get and parse JSON value', async () => {
      const projects = [{ id: '1', name: 'Test Project', niche: 'Tech', subNiche: 'AI', createdAt: '2025-01-01', updatedAt: '2025-01-01', isDeleted: false }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(projects));

      const result = await getStorageItem('projects');

      expect(result).toEqual(projects);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.PROJECTS);
    });

    it('should get numeric value for appStateVersion', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

      const result = await getStorageItem('appStateVersion');

      expect(result).toBe(1);
    });

    it('should return null when item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getStorageItem('projects');

      expect(result).toBeNull();
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      await expect(getStorageItem('projects')).rejects.toThrow(StorageError);
    });
  });

  describe('setStorageItem', () => {
    it('should serialize and set JSON value', async () => {
      const projects = [{ id: '1', name: 'Test Project', niche: 'Tech', subNiche: 'AI', createdAt: '2025-01-01', updatedAt: '2025-01-01', isDeleted: false }];
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await setStorageItem('projects', projects);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PROJECTS,
        JSON.stringify(projects)
      );
    });

    it('should set string value for appStateVersion', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await setStorageItem('appStateVersion', 1);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.APP_STATE_VERSION,
        '1'
      );
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(setStorageItem('projects', [])).rejects.toThrow(StorageError);
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      await clearStorage();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('should throw StorageError on failure', async () => {
      const error = new Error('AsyncStorage failed');
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(error);

      await expect(clearStorage()).rejects.toThrow(StorageError);
    });
  });
});
