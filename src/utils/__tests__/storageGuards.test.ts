/**
 * Storage Guards Tests
 */

import * as FileSystem from 'expo-file-system';
import {
  checkStorageStatus,
  canRecord,
  formatStorageSize,
  getStorageMessage,
  estimateVideoSize,
  canRecordDuration,
} from '../storageGuards';

jest.mock('expo-file-system');

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

describe('storageGuards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkStorageStatus', () => {
    it('returns critical level when <500MB free', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(400 * 1024 * 1024); // 400 MB

      const status = await checkStorageStatus();

      expect(status.level).toBe('critical');
      expect(status.freeMB).toBeCloseTo(400, 0);
    });

    it('returns warning level when <2GB but >500MB free', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(1 * 1024 * 1024 * 1024); // 1 GB

      const status = await checkStorageStatus();

      expect(status.level).toBe('warning');
      expect(status.freeGB).toBeCloseTo(1, 1);
    });

    it('returns ok level when >2GB free', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(10 * 1024 * 1024 * 1024); // 10 GB

      const status = await checkStorageStatus();

      expect(status.level).toBe('ok');
      expect(status.freeGB).toBeCloseTo(10, 1);
    });

    it('calculates used bytes correctly', async () => {
      const free = 10 * 1024 * 1024 * 1024;

      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(free);

      const status = await checkStorageStatus();

      expect(status.totalBytes).toBeGreaterThan(0);
      expect(status.freeBytes).toBe(free);
      expect(status.usedBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('canRecord', () => {
    it('allows recording when storage is ok', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(10 * 1024 * 1024 * 1024);

      const result = await canRecord();

      expect(result.allowed).toBe(true);
      expect(result.status.level).toBe('ok');
    });

    it('allows recording when storage is warning', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(1 * 1024 * 1024 * 1024);

      const result = await canRecord();

      expect(result.allowed).toBe(true);
      expect(result.status.level).toBe('warning');
    });

    it('blocks recording when storage is critical', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(400 * 1024 * 1024);

      const result = await canRecord();

      expect(result.allowed).toBe(false);
      expect(result.status.level).toBe('critical');
    });
  });

  describe('formatStorageSize', () => {
    it('formats KB correctly', () => {
      const formatted = formatStorageSize(512 * 1024); // 512 KB

      expect(formatted).toMatch(/512 KB/);
    });

    it('formats MB correctly', () => {
      const formatted = formatStorageSize(256 * 1024 * 1024); // 256 MB

      expect(formatted).toMatch(/256 MB/);
    });

    it('formats GB correctly', () => {
      const formatted = formatStorageSize(5 * 1024 * 1024 * 1024); // 5 GB

      expect(formatted).toMatch(/5\.00 GB/);
    });
  });

  describe('getStorageMessage', () => {
    it('returns critical message for critical storage', () => {
      const status = {
        totalBytes: 64 * 1024 * 1024 * 1024,
        freeBytes: 400 * 1024 * 1024,
        usedBytes: 63.6 * 1024 * 1024 * 1024,
        freeMB: 400,
        freeGB: 0.39,
        level: 'critical' as const,
      };

      const message = getStorageMessage(status);

      expect(message.title).toBe('Storage Critical');
      expect(message.message).toContain('400 MB');
      expect(message.message).toContain('disabled');
    });

    it('returns warning message for low storage', () => {
      const status = {
        totalBytes: 64 * 1024 * 1024 * 1024,
        freeBytes: 1 * 1024 * 1024 * 1024,
        usedBytes: 63 * 1024 * 1024 * 1024,
        freeMB: 1024,
        freeGB: 1,
        level: 'warning' as const,
      };

      const message = getStorageMessage(status);

      expect(message.title).toBe('Low Storage');
      expect(message.message).toContain('1.0 GB');
    });

    it('returns ok message for sufficient storage', () => {
      const status = {
        totalBytes: 64 * 1024 * 1024 * 1024,
        freeBytes: 10 * 1024 * 1024 * 1024,
        usedBytes: 54 * 1024 * 1024 * 1024,
        freeMB: 10240,
        freeGB: 10,
        level: 'ok' as const,
      };

      const message = getStorageMessage(status);

      expect(message.title).toBe('Storage OK');
      expect(message.message).toContain('10.0 GB');
    });
  });

  describe('estimateVideoSize', () => {
    it('estimates size for 30 second video', () => {
      const size = estimateVideoSize(30);

      // 10 Mbps * 30 sec = 300 Mb = 37.5 MB
      expect(size).toBeGreaterThan(30 * 1024 * 1024);
      expect(size).toBeLessThan(50 * 1024 * 1024);
    });

    it('estimates size for 120 second video', () => {
      const size = estimateVideoSize(120);

      // 10 Mbps * 120 sec = 1200 Mb = 150 MB
      expect(size).toBeGreaterThan(120 * 1024 * 1024);
      expect(size).toBeLessThan(180 * 1024 * 1024);
    });
  });

  describe('canRecordDuration', () => {
    it('allows recording short video with sufficient space', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(5 * 1024 * 1024 * 1024);

      const canRecordShort = await canRecordDuration(30);

      expect(canRecordShort).toBe(true);
    });

    it('blocks recording when storage is critical', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(400 * 1024 * 1024);

      const canRecordShort = await canRecordDuration(30);

      expect(canRecordShort).toBe(false);
    });

    it('blocks recording long video when insufficient space', async () => {
      mockFileSystem.getFreeDiskStorageAsync.mockResolvedValue(600 * 1024 * 1024); // 600 MB

      const canRecordLong = await canRecordDuration(120); // ~150 MB + 500 MB buffer

      expect(canRecordLong).toBe(false);
    });
  });
});
