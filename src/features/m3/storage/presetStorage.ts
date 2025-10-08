/**
 * M3 Preset Storage
 *
 * Handles persistence of feature presets per project using AsyncStorage.
 * Keys: shortyai:project:{projectId}:m3:preset
 *
 * @module features/m3/storage/presetStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3Preset, DEFAULT_M3_PRESET } from '../types';

function getPresetKey(projectId: string): string {
  return `shortyai:project:${projectId}:m3:preset`;
}

export async function loadPreset(projectId: string): Promise<M3Preset> {
  try {
    const key = getPresetKey(projectId);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return { ...DEFAULT_M3_PRESET };
    }

    const parsed: M3Preset = JSON.parse(data);

    if (parsed.version !== 1) {
      console.warn(`Preset version ${parsed.version} not supported, using default`);
      return { ...DEFAULT_M3_PRESET };
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load preset:', error);
    return { ...DEFAULT_M3_PRESET };
  }
}

export async function savePreset(projectId: string, preset: M3Preset): Promise<void> {
  try {
    const key = getPresetKey(projectId);
    const updated: M3Preset = {
      ...preset,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save preset:', error);
    throw new Error('Failed to save preset configuration');
  }
}

export async function resetPreset(projectId: string): Promise<void> {
  try {
    const key = getPresetKey(projectId);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to reset preset:', error);
    throw new Error('Failed to reset preset configuration');
  }
}
