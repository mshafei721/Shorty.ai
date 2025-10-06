/**
 * Telemetry Event Tracking System
 *
 * Tracks user events for M1 recording flow with local-only storage.
 * Events stored in AsyncStorage with 30-day rotation.
 * Telemetry default OFF (respects user privacy).
 *
 * @module analytics/telemetry
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Constants
// ============================================================================

const TELEMETRY_STORAGE_KEY = 'analytics';
const TELEMETRY_ENABLED_KEY = 'telemetryEnabled';
const MAX_EVENTS = 10_000;
const RETENTION_DAYS = 30;

// ============================================================================
// Types
// ============================================================================

/**
 * Telemetry event types for M1 recording flow
 */
export type TelemetryEvent =
  | { type: 'record_started'; projectId: string; scriptId: string; timestamp: string }
  | { type: 'record_completed'; projectId: string; videoId: string; durationSec: number; timestamp: string }
  | { type: 'record_cancelled'; projectId: string; reason: 'user' | 'error'; timestamp: string }
  | { type: 'record_paused'; projectId: string; videoId: string; timestamp: string }
  | { type: 'record_resumed'; projectId: string; videoId: string; timestamp: string }
  | { type: 'teleprompter_started'; scriptId: string; wpm: number; timestamp: string }
  | { type: 'teleprompter_paused'; scriptId: string; timestamp: string }
  | { type: 'teleprompter_completed'; scriptId: string; timestamp: string };

/**
 * Telemetry storage structure in AsyncStorage
 */
interface TelemetryStorage {
  events: TelemetryEvent[];
  lastRotation: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if telemetry is enabled
 * Default: false (respects user privacy)
 */
async function isTelemetryEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TELEMETRY_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('[Telemetry] Failed to check enabled state:', error);
    return false;
  }
}

/**
 * Set telemetry enabled state
 */
export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TELEMETRY_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error('[Telemetry] Failed to set enabled state:', error);
    throw error;
  }
}

/**
 * Get current telemetry storage
 */
async function getStorage(): Promise<TelemetryStorage> {
  try {
    const raw = await AsyncStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) {
      return {
        events: [],
        lastRotation: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as TelemetryStorage;
  } catch (error) {
    console.error('[Telemetry] Failed to read storage:', error);
    return {
      events: [],
      lastRotation: new Date().toISOString(),
    };
  }
}

/**
 * Save telemetry storage
 */
async function saveStorage(storage: TelemetryStorage): Promise<void> {
  try {
    await AsyncStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('[Telemetry] Failed to save storage:', error);
    throw error;
  }
}

/**
 * Track telemetry event
 * No-op if telemetry disabled
 *
 * @param event - Event to track
 */
export async function trackEvent(event: TelemetryEvent): Promise<void> {
  try {
    const enabled = await isTelemetryEnabled();
    if (!enabled) {
      return;
    }

    const storage = await getStorage();

    storage.events.push(event);

    if (storage.events.length > MAX_EVENTS) {
      storage.events = storage.events.slice(-MAX_EVENTS);
    }

    await saveStorage(storage);
  } catch (error) {
    console.error('[Telemetry] Failed to track event:', error);
  }
}

/**
 * Get telemetry events
 *
 * @param limit - Max events to return (most recent first)
 * @returns Array of events
 */
export async function getTelemetryEvents(limit?: number): Promise<TelemetryEvent[]> {
  try {
    const storage = await getStorage();
    const events = [...storage.events].reverse();

    if (limit !== undefined && limit > 0) {
      return events.slice(0, limit);
    }

    return events;
  } catch (error) {
    console.error('[Telemetry] Failed to get events:', error);
    return [];
  }
}

/**
 * Clear all telemetry events
 */
export async function clearTelemetryEvents(): Promise<void> {
  try {
    const storage: TelemetryStorage = {
      events: [],
      lastRotation: new Date().toISOString(),
    };
    await saveStorage(storage);
  } catch (error) {
    console.error('[Telemetry] Failed to clear events:', error);
    throw error;
  }
}

/**
 * Rotate telemetry events (delete events older than 30 days)
 * Should be called on app init
 *
 * @returns Number of events deleted
 */
export async function rotateTelemetryEvents(): Promise<{ deleted: number }> {
  try {
    const storage = await getStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const initialCount = storage.events.length;
    storage.events = storage.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= cutoffDate;
    });

    const deletedCount = initialCount - storage.events.length;

    if (deletedCount > 0) {
      storage.lastRotation = new Date().toISOString();
      await saveStorage(storage);
    }

    return { deleted: deletedCount };
  } catch (error) {
    console.error('[Telemetry] Failed to rotate events:', error);
    return { deleted: 0 };
  }
}
