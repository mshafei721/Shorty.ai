import { UploadAdapter } from '../index';
import * as crypto from 'crypto';
import * as fs from 'fs';

jest.mock('fs');

describe('UploadAdapter', () => {
  let adapter: UploadAdapter;

  beforeEach(() => {
    adapter = new UploadAdapter({ baseUrl: 'http://localhost:3000' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startUpload', () => {
    it('creates session with unique ID', async () => {
      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: 1024,
        md5: 'abc123',
      };

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('appendChunk', () => {
    it('uploads chunk and emits progress', async () => {
      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: 1024,
        md5: 'abc123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      const chunk = Buffer.from('test data');

      const progressSpy = jest.fn();
      adapter.onProgress(sessionId, progressSpy);

      await adapter.appendChunk(sessionId, chunk, 0);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/upload-chunk',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Session-Id': sessionId,
            'X-Chunk-Index': '0',
          }),
        })
      );

      expect(progressSpy).toHaveBeenCalled();
    });

    it('retries on failure with exponential backoff', async () => {
      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: 1024,
        md5: 'abc123',
      };

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      const chunk = Buffer.from('test data');

      await adapter.appendChunk(sessionId, chunk, 0);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('throws after max retries', async () => {
      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: 1024,
        md5: 'abc123',
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      const chunk = Buffer.from('test data');

      await expect(adapter.appendChunk(sessionId, chunk, 0)).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(4);
    }, 10000);
  });

  describe('completeUpload', () => {
    it('validates checksum and returns result', async () => {
      const testData = Buffer.from('test data');
      const hash = crypto.createHash('md5').update(testData).digest('hex');

      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: testData.length,
        md5: hash,
      };

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      await adapter.appendChunk(sessionId, testData, 0);

      const result = await adapter.completeUpload(sessionId);

      expect(result.objectUrl).toBe('http://localhost:3000/uploads/proj-123/asset-456');
      expect(result.md5).toBe(hash);
      expect(result.etag).toBeDefined();
    });

    it('throws on checksum mismatch', async () => {
      const testData = Buffer.from('test data');

      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: testData.length,
        md5: 'wrong-checksum',
      };

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      await adapter.appendChunk(sessionId, testData, 0);

      await expect(adapter.completeUpload(sessionId)).rejects.toThrow('Checksum mismatch');
    });
  });

  describe('abort', () => {
    it('marks session as aborted', async () => {
      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: 1024,
        md5: 'abc123',
      };

      const { sessionId } = await adapter.startUpload('test.mp4', meta);
      await adapter.abort(sessionId);

      const chunk = Buffer.from('test');
      await expect(adapter.appendChunk(sessionId, chunk, 0)).rejects.toThrow('Upload aborted');
    });
  });

  describe('uploadFile', () => {
    it('uploads complete file with chunking', async () => {
      const testData = Buffer.alloc(15 * 1024 * 1024);
      const hash = crypto.createHash('md5').update(testData).digest('hex');

      (fs.readFileSync as jest.Mock).mockReturnValue(testData);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const meta = {
        projectId: 'proj-123',
        assetId: 'asset-456',
        bytes: testData.length,
        md5: hash,
      };

      const result = await adapter.uploadFile('test.mp4', meta);

      expect(result.md5).toBe(hash);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
