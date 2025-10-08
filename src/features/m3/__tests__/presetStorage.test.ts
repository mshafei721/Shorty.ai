/**
 * Preset Storage Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPreset, savePreset, resetPreset } from '../storage/presetStorage';
import { DEFAULT_M3_PRESET } from '../types';

describe('presetStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('loadPreset', () => {
    it('returns default preset when no data exists', async () => {
      const preset = await loadPreset('project_123');

      expect(preset).toEqual(DEFAULT_M3_PRESET);
    });

    it('loads saved preset from storage', async () => {
      const custom = {
        ...DEFAULT_M3_PRESET,
        fillerRemoval: false,
        frameMarginPx: 24,
      };

      await AsyncStorage.setItem(
        'shortyai:project:project_123:m3:preset',
        JSON.stringify(custom)
      );

      const loaded = await loadPreset('project_123');

      expect(loaded.fillerRemoval).toBe(false);
      expect(loaded.frameMarginPx).toBe(24);
    });

    it('returns default when preset version is unsupported', async () => {
      const invalid = {
        ...DEFAULT_M3_PRESET,
        version: 999,
      };

      await AsyncStorage.setItem(
        'shortyai:project:project_123:m3:preset',
        JSON.stringify(invalid)
      );

      const loaded = await loadPreset('project_123');

      expect(loaded).toEqual(DEFAULT_M3_PRESET);
    });
  });

  describe('savePreset', () => {
    it('saves preset to storage with updated timestamp', async () => {
      const preset = {
        ...DEFAULT_M3_PRESET,
        fillerRemoval: false,
      };

      await savePreset('project_123', preset);

      const saved = await AsyncStorage.getItem('shortyai:project:project_123:m3:preset');
      const parsed = JSON.parse(saved!);

      expect(parsed.fillerRemoval).toBe(false);
      expect(parsed.version).toBe(1);
      expect(parsed.updatedAt).toBeTruthy();
    });
  });

  describe('resetPreset', () => {
    it('removes preset from storage', async () => {
      await AsyncStorage.setItem(
        'shortyai:project:project_123:m3:preset',
        JSON.stringify(DEFAULT_M3_PRESET)
      );

      await resetPreset('project_123');

      const removed = await AsyncStorage.getItem('shortyai:project:project_123:m3:preset');
      expect(removed).toBeNull();
    });
  });
});
