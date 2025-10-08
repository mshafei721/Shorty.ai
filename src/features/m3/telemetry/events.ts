/**
 * M3 Telemetry Events
 *
 * Tracks user interactions with Feature Selection & Preview.
 * Events respect 30-day rotation and avoid PII.
 *
 * @module features/m3/telemetry/events
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { M3TelemetryEvent, M3Preset } from '../types';

const TELEMETRY_KEY = 'analytics';

interface TelemetryEvent {
  event: M3TelemetryEvent;
  timestamp: string;
  projectIdHash?: string;
  metadata?: Record<string, any>;
}

async function hashId(id: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(id);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

async function recordEvent(event: TelemetryEvent): Promise<void> {
  try {
    const enabled = await AsyncStorage.getItem('telemetryEnabled');
    if (enabled !== 'true') {
      return;
    }

    const key = `${TELEMETRY_KEY}:m3`;
    const existing = await AsyncStorage.getItem(key);
    const events: TelemetryEvent[] = existing ? JSON.parse(existing) : [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = events.filter(e => new Date(e.timestamp) > thirtyDaysAgo);
    filtered.push(event);

    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to record telemetry event:', error);
  }
}

export async function trackFeaturesOpened(projectId: string): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_features_opened',
    timestamp: new Date().toISOString(),
    projectIdHash,
  });
}

export async function trackPresetApplied(
  projectId: string,
  preset: M3Preset
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_preset_applied',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: {
      fillerRemoval: preset.fillerRemoval,
      jumpCuts: preset.jumpCuts,
      captions: preset.captions.enabled,
      introOutro: preset.introOutro,
    },
  });
}

export async function trackPreviewPlay(projectId: string): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_preview_play',
    timestamp: new Date().toISOString(),
    projectIdHash,
  });
}

export async function trackDraftRenderRequested(
  projectId: string,
  preset: M3Preset
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_draft_render_requested',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: {
      featuresEnabled: [
        preset.fillerRemoval && 'fillerRemoval',
        preset.jumpCuts && 'jumpCuts',
        preset.captions.enabled && 'captions',
        preset.introOutro && 'introOutro',
      ].filter(Boolean),
    },
  });
}

export async function trackDraftRenderReady(
  projectId: string,
  durationMs: number
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_draft_render_ready',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: {
      durationMs,
    },
  });
}

export async function trackPreviewError(
  projectId: string,
  errorType: string
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'm3_preview_error',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: {
      errorType,
    },
  });
}
