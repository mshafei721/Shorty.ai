import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeSchema,
  migrateSchema,
  getSchemaVersion,
  clearAllData,
  SCHEMA_VERSION,
} from '../../src/storage/schema';

// TC-A1-001: AsyncStorage Schema Initialization

describe('AsyncStorage Schema v1', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('initializes with appStateVersion=1 and empty arrays', async () => {
    await initializeSchema();

    const version = await AsyncStorage.getItem('appStateVersion');
    const projects = await AsyncStorage.getItem('projects');
    const scripts = await AsyncStorage.getItem('scripts');
    const videos = await AsyncStorage.getItem('videos');
    const analytics = await AsyncStorage.getItem('analytics');

    expect(version).toBe('1');
    expect(JSON.parse(projects!)).toEqual([]);
    expect(JSON.parse(scripts!)).toEqual([]);
    expect(JSON.parse(videos!)).toEqual([]);
    expect(JSON.parse(analytics!)).toEqual({});
  });

  it('skips re-initialization if schema exists', async () => {
    // Initialize first time
    await initializeSchema();

    // Add some data
    await AsyncStorage.setItem('projects', JSON.stringify([{ id: '123' }]));

    // Try to initialize again
    await initializeSchema();

    // Data should not be overwritten
    const projects = await AsyncStorage.getItem('projects');
    expect(JSON.parse(projects!)).toEqual([{ id: '123' }]);
  });

  it('provides migration hook for future versions', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await migrateSchema(1, 2);

    expect(consoleSpy).toHaveBeenCalledWith('Migration from v1 to v2 not implemented');
    consoleSpy.mockRestore();
  });

  it('returns correct schema version', async () => {
    await initializeSchema();
    const version = await getSchemaVersion();
    expect(version).toBe(SCHEMA_VERSION);
  });

  it('returns 0 if no schema initialized', async () => {
    const version = await getSchemaVersion();
    expect(version).toBe(0);
  });

  it('clears all data', async () => {
    await initializeSchema();
    await clearAllData();

    const version = await AsyncStorage.getItem('appStateVersion');
    const projects = await AsyncStorage.getItem('projects');

    expect(version).toBeNull();
    expect(projects).toBeNull();
  });

  it('handles initialization errors gracefully', async () => {
    // Mock AsyncStorage to throw error
    const originalMultiSet = AsyncStorage.multiSet;
    AsyncStorage.multiSet = jest
      .fn()
      .mockRejectedValue(new Error('Storage full'));

    await expect(initializeSchema()).rejects.toThrow('Storage full');

    // Restore
    AsyncStorage.multiSet = originalMultiSet;
  });
});
