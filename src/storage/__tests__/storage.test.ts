import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeStorage,
  getStorageItem,
  setStorageItem,
  clearStorage,
  StorageError,
  APP_STATE_VERSION,
  STORAGE_KEYS,
  DEFAULT_STORAGE_STATE,
} from '../index';

jest.mock('@react-native-async-storage/async-storage');

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    it('should not initialize when version exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(APP_STATE_VERSION));
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
    });

    it('should migrate storage when version is lower', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.APP_STATE_VERSION,
        String(APP_STATE_VERSION)
      );
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
