/**
 * Unit tests for telemetry tracking system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  trackEvent,
  getTelemetryEvents,
  clearTelemetryEvents,
  rotateTelemetryEvents,
  setTelemetryEnabled,
  TelemetryEvent,
} from '../telemetry';

jest.mock('@react-native-async-storage/async-storage');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('setTelemetryEnabled', () => {
    it('stores enabled state', async () => {
      await setTelemetryEnabled(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('telemetryEnabled', 'true');
    });

    it('stores disabled state', async () => {
      await setTelemetryEnabled(false);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('telemetryEnabled', 'false');
    });
  });

  describe('trackEvent', () => {
    it('stores event when telemetry enabled', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const event: TelemetryEvent = {
        type: 'record_started',
        projectId: 'proj-123',
        scriptId: 'script-456',
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('telemetryEnabled');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('record_started')
      );
    });

    it('does not store event when telemetry disabled', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('false');
        return Promise.resolve(null);
      });

      const event: TelemetryEvent = {
        type: 'record_started',
        projectId: 'proj-123',
        scriptId: 'script-456',
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('telemetryEnabled');
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('is no-op when telemetry not set (default disabled)', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const event: TelemetryEvent = {
        type: 'record_started',
        projectId: 'proj-123',
        scriptId: 'script-456',
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith(
        'analytics',
        expect.anything()
      );
    });

    it('enforces max events limit (10,000)', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('true');
        if (key === 'analytics') {
          const events = Array.from({ length: 10_000 }, (_, i) => ({
            type: 'record_started',
            projectId: `proj-${i}`,
            scriptId: `script-${i}`,
            timestamp: new Date().toISOString(),
          }));
          return Promise.resolve(
            JSON.stringify({
              events,
              lastRotation: new Date().toISOString(),
            })
          );
        }
        return Promise.resolve(null);
      });

      const newEvent: TelemetryEvent = {
        type: 'record_completed',
        projectId: 'proj-new',
        videoId: 'vid-new',
        durationSec: 60,
        timestamp: new Date().toISOString(),
      };

      await trackEvent(newEvent);

      const savedData = mockAsyncStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed.events).toHaveLength(10_000);
      expect(parsed.events[parsed.events.length - 1].type).toBe('record_completed');
    });

    it('tracks record_paused event', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const event: TelemetryEvent = {
        type: 'record_paused',
        projectId: 'proj-123',
        videoId: 'vid-456',
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('record_paused')
      );
    });

    it('tracks record_resumed event', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const event: TelemetryEvent = {
        type: 'record_resumed',
        projectId: 'proj-123',
        videoId: 'vid-456',
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('record_resumed')
      );
    });

    it('tracks teleprompter_started event', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'telemetryEnabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const event: TelemetryEvent = {
        type: 'teleprompter_started',
        scriptId: 'script-123',
        wpm: 140,
        timestamp: new Date().toISOString(),
      };

      await trackEvent(event);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('teleprompter_started')
      );
    });
  });

  describe('getTelemetryEvents', () => {
    it('returns empty array when no events', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const events = await getTelemetryEvents();

      expect(events).toEqual([]);
    });

    it('returns all events in reverse order (most recent first)', async () => {
      const storedEvents: TelemetryEvent[] = [
        {
          type: 'record_started',
          projectId: 'proj-1',
          scriptId: 'script-1',
          timestamp: '2025-10-01T10:00:00.000Z',
        },
        {
          type: 'record_completed',
          projectId: 'proj-1',
          videoId: 'vid-1',
          durationSec: 60,
          timestamp: '2025-10-01T10:01:00.000Z',
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          events: storedEvents,
          lastRotation: new Date().toISOString(),
        })
      );

      const events = await getTelemetryEvents();

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('record_completed');
      expect(events[1].type).toBe('record_started');
    });

    it('limits results when limit specified', async () => {
      const storedEvents: TelemetryEvent[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'record_started',
        projectId: `proj-${i}`,
        scriptId: `script-${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
      }));

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          events: storedEvents,
          lastRotation: new Date().toISOString(),
        })
      );

      const events = await getTelemetryEvents(10);

      expect(events).toHaveLength(10);
    });
  });

  describe('clearTelemetryEvents', () => {
    it('clears all events and updates rotation timestamp', async () => {
      await clearTelemetryEvents();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('"events":[]')
      );
    });
  });

  describe('rotateTelemetryEvents', () => {
    it('deletes events older than 30 days', async () => {
      const now = new Date();
      const old = new Date();
      old.setDate(old.getDate() - 31);

      const storedEvents: TelemetryEvent[] = [
        {
          type: 'record_started',
          projectId: 'proj-old',
          scriptId: 'script-old',
          timestamp: old.toISOString(),
        },
        {
          type: 'record_started',
          projectId: 'proj-new',
          scriptId: 'script-new',
          timestamp: now.toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          events: storedEvents,
          lastRotation: old.toISOString(),
        })
      );

      const result = await rotateTelemetryEvents();

      expect(result.deleted).toBe(1);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.stringContaining('proj-new')
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics',
        expect.not.stringContaining('proj-old')
      );
    });

    it('keeps events within 30-day window', async () => {
      const now = new Date();
      const recent = new Date();
      recent.setDate(recent.getDate() - 29);

      const storedEvents: TelemetryEvent[] = [
        {
          type: 'record_started',
          projectId: 'proj-1',
          scriptId: 'script-1',
          timestamp: recent.toISOString(),
        },
        {
          type: 'record_started',
          projectId: 'proj-2',
          scriptId: 'script-2',
          timestamp: now.toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          events: storedEvents,
          lastRotation: now.toISOString(),
        })
      );

      const result = await rotateTelemetryEvents();

      expect(result.deleted).toBe(0);
    });

    it('returns zero deleted if no old events', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await rotateTelemetryEvents();

      expect(result.deleted).toBe(0);
    });

    it('updates lastRotation timestamp when events deleted', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 31);

      const storedEvents: TelemetryEvent[] = [
        {
          type: 'record_started',
          projectId: 'proj-old',
          scriptId: 'script-old',
          timestamp: old.toISOString(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          events: storedEvents,
          lastRotation: old.toISOString(),
        })
      );

      await rotateTelemetryEvents();

      const savedData = mockAsyncStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(new Date(parsed.lastRotation).getTime()).toBeGreaterThan(old.getTime());
    });
  });

  describe('error handling', () => {
    it('handles AsyncStorage errors gracefully in trackEvent', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const event: TelemetryEvent = {
        type: 'record_started',
        projectId: 'proj-123',
        scriptId: 'script-456',
        timestamp: new Date().toISOString(),
      };

      await expect(trackEvent(event)).resolves.not.toThrow();
    });

    it('handles AsyncStorage errors gracefully in getTelemetryEvents', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const events = await getTelemetryEvents();

      expect(events).toEqual([]);
    });

    it('handles AsyncStorage errors gracefully in rotateTelemetryEvents', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await rotateTelemetryEvents();

      expect(result.deleted).toBe(0);
    });
  });
});
