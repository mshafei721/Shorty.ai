import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineAction } from '../types';

const QUEUE_KEY = 'export_offline_queue';

export async function enqueueOfflineAction(action: OfflineAction): Promise<void> {
  const queue = await getOfflineQueue();

  const existing = queue.find(a => a.idempotencyKey === action.idempotencyKey);
  if (existing) {
    return;
  }

  queue.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load offline queue:', error);
    return [];
  }
}

export async function removeFromQueue(actionId: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter(a => a.id !== actionId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function updateQueueAction(
  actionId: string,
  updates: Partial<OfflineAction>
): Promise<void> {
  const queue = await getOfflineQueue();
  const index = queue.findIndex(a => a.id === actionId);

  if (index === -1) return;

  queue[index] = { ...queue[index], ...updates };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const queue = await getOfflineQueue();
  return queue.filter(a => !a.error || a.retries < 5);
}
