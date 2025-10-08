import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueOfflineAction,
  getOfflineQueue,
  removeFromQueue,
  updateQueueAction,
  clearOfflineQueue,
  getPendingActions,
} from '../storage/offlineQueue';
import { OfflineAction } from '../types';

describe('offlineQueue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('enqueueOfflineAction', () => {
    it('should add action to queue', async () => {
      const action: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: { url: 'test.mp4' },
        createdAt: new Date().toISOString(),
        idempotencyKey: 'share_test_123',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      await enqueueOfflineAction(action);

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual(action);
    });

    it('should prevent duplicate idempotency keys', async () => {
      const action: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: { url: 'test.mp4' },
        createdAt: new Date().toISOString(),
        idempotencyKey: 'share_test_123',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      await enqueueOfflineAction(action);
      await enqueueOfflineAction({ ...action, id: 'action-2' });

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('action-1');
    });
  });

  describe('removeFromQueue', () => {
    it('should remove action by id', async () => {
      const action1: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: {},
        createdAt: new Date().toISOString(),
        idempotencyKey: 'key-1',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      const action2: OfflineAction = {
        ...action1,
        id: 'action-2',
        idempotencyKey: 'key-2',
      };

      await enqueueOfflineAction(action1);
      await enqueueOfflineAction(action2);

      await removeFromQueue('action-1');

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('action-2');
    });
  });

  describe('updateQueueAction', () => {
    it('should update action properties', async () => {
      const action: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: {},
        createdAt: new Date().toISOString(),
        idempotencyKey: 'key-1',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      await enqueueOfflineAction(action);

      await updateQueueAction('action-1', {
        retries: 2,
        lastAttemptAt: new Date().toISOString(),
      });

      const queue = await getOfflineQueue();
      expect(queue[0].retries).toBe(2);
      expect(queue[0].lastAttemptAt).not.toBeNull();
    });

    it('should handle non-existent action gracefully', async () => {
      await updateQueueAction('non-existent', { retries: 1 });

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('clearOfflineQueue', () => {
    it('should clear all actions', async () => {
      const action: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: {},
        createdAt: new Date().toISOString(),
        idempotencyKey: 'key-1',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      await enqueueOfflineAction(action);
      await clearOfflineQueue();

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('getPendingActions', () => {
    it('should return actions without errors', async () => {
      const action1: OfflineAction = {
        id: 'action-1',
        type: 'share',
        payload: {},
        createdAt: new Date().toISOString(),
        idempotencyKey: 'key-1',
        retries: 0,
        lastAttemptAt: null,
        error: null,
      };

      const action2: OfflineAction = {
        id: 'action-2',
        type: 'share',
        payload: {},
        createdAt: new Date().toISOString(),
        idempotencyKey: 'key-2',
        retries: 5,
        lastAttemptAt: null,
        error: { code: 'UNKNOWN_ERROR', message: 'Failed', userMessage: '', recoveryActions: [] },
      };

      await enqueueOfflineAction(action1);
      await enqueueOfflineAction(action2);

      const pending = await getPendingActions();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('action-1');
    });
  });
});
