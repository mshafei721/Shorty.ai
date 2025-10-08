import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExportErrorCode } from '../types';

const TELEMETRY_KEY = 'export_telemetry';
const ROTATION_DAYS = 30;

interface TelemetryEvent {
  event: string;
  timestamp: string;
  projectIdHash: string;
  metadata?: Record<string, unknown>;
}

interface TelemetryStore {
  events: TelemetryEvent[];
  lastReset: string;
}

async function hashId(id: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(id);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

async function recordEvent(event: TelemetryEvent): Promise<void> {
  try {
    const storeData = await AsyncStorage.getItem(TELEMETRY_KEY);
    let store: TelemetryStore = storeData
      ? JSON.parse(storeData)
      : { events: [], lastReset: new Date().toISOString() };

    const daysSinceReset = Math.floor(
      (new Date().getTime() - new Date(store.lastReset).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReset >= ROTATION_DAYS) {
      store = { events: [], lastReset: new Date().toISOString() };
    }

    store.events.push(event);

    await AsyncStorage.setItem(TELEMETRY_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to record telemetry event:', error);
  }
}

export async function trackExportShareOpened(projectId: string): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'export_share_opened',
    timestamp: new Date().toISOString(),
    projectIdHash,
  });
}

export async function trackExportSuccess(
  projectId: string,
  shareType: 'native' | 'save_to_photos' | 'copy_link'
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'export_success',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: { shareType },
  });
}

export async function trackExportFailed(
  projectId: string,
  errorCode: ExportErrorCode
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'export_failed',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: { errorCode },
  });
}

export async function trackOfflineQueueEnqueued(
  projectId: string,
  actionType: string
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'offline_queue_enqueued',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: { actionType },
  });
}

export async function trackOfflineQueueFlushed(
  projectId: string,
  actionCount: number
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'offline_queue_flushed',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: { actionCount },
  });
}

export async function trackRetryBackoffStarted(
  projectId: string,
  attempt: number,
  delayMs: number
): Promise<void> {
  const projectIdHash = await hashId(projectId);
  await recordEvent({
    event: 'retry_backoff_started',
    timestamp: new Date().toISOString(),
    projectIdHash,
    metadata: { attempt, delayMs },
  });
}
