import { MuxEncodingAdapter, EncodingService } from '../index';

describe('MuxEncodingAdapter', () => {
  let adapter: MuxEncodingAdapter;

  beforeEach(() => {
    adapter = new MuxEncodingAdapter({
      tokenId: 'test-id',
      tokenSecret: 'test-secret',
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitEncode', () => {
    it('submits encode request with correct profile', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'asset-123' } }),
      });

      const result = await adapter.submitEncode('http://example.com/video.mp4', {
        codec: 'h264',
        width: 1080,
        height: 1920,
      });

      expect(result.encodeId).toBe('asset-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mux.com/video/v1/assets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.input[0].url).toBe('http://example.com/video.mp4');
      expect(body.max_resolution_tier).toBe('1080p');
    });

    it('includes authentication header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'asset-123' } }),
      });

      await adapter.submitEncode('http://example.com/video.mp4', {
        codec: 'h264',
        width: 1080,
        height: 1920,
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeDefined();
      expect(callArgs.headers.Authorization).toContain('Basic ');
    });

    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid input',
      });

      await expect(
        adapter.submitEncode('http://example.com/video.mp4', {
          codec: 'h264',
          width: 1080,
          height: 1920,
        })
      ).rejects.toThrow('Mux encode submission failed: 400');
    });
  });

  describe('pollEncode', () => {
    it('returns processing status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            id: 'asset-123',
            status: 'processing',
          },
        }),
      });

      const result = await adapter.pollEncode('asset-123');

      expect(result.status).toBe('processing');
      expect(result.assetUrl).toBeUndefined();
    });

    it('returns ready status with asset URL and checksum', async () => {
      const mockChecksum = 'abc123def456';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'asset-123',
              status: 'ready',
              playback_ids: [{ id: 'playback-456' }],
              static_renditions: {
                files: [
                  { name: 'high.mp4', url: 'http://example.com/high.mp4' },
                ],
              },
              mp4_support: 'standard',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Buffer.from('test video data'),
        });

      const result = await adapter.pollEncode('asset-123');

      expect(result.status).toBe('ready');
      expect(result.assetUrl).toBe('http://example.com/high.mp4');
      expect(result.playbackId).toBe('playback-456');
      expect(result.checksum).toBeDefined();
    });

    it('returns failed status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            id: 'asset-123',
            status: 'errored',
          },
        }),
      });

      const result = await adapter.pollEncode('asset-123');

      expect(result.status).toBe('failed');
    });
  });

  describe('verifyChecksum', () => {
    it('validates matching checksum', async () => {
      const data = Buffer.from('test video data');
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(data).digest('hex');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => data,
      });

      const isValid = await adapter.verifyChecksum('http://example.com/video.mp4', hash);

      expect(isValid).toBe(true);
    });

    it('rejects mismatched checksum', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from('test video data'),
      });

      const isValid = await adapter.verifyChecksum(
        'http://example.com/video.mp4',
        'wrong-checksum'
      );

      expect(isValid).toBe(false);
    });
  });
});

describe('EncodingService', () => {
  let service: EncodingService;
  let adapter: MuxEncodingAdapter;

  beforeEach(() => {
    adapter = new MuxEncodingAdapter({
      tokenId: 'test-id',
      tokenSecret: 'test-secret',
    });
    service = new EncodingService(adapter);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pollUntilReady', () => {
    it('polls until ready', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'asset-123', status: 'processing' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'asset-123',
              status: 'ready',
              playback_ids: [{ id: 'playback-456' }],
              mp4_support: 'standard',
              static_renditions: {
                files: [{ name: 'high.mp4', url: 'http://example.com/high.mp4' }],
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Buffer.from('test'),
        });

      const result = await service.pollUntilReady('asset-123', {
        maxAttempts: 5,
        intervalMs: 100,
      });

      expect(result.status).toBe('ready');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('throws on timeout', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'asset-123', status: 'processing' } }),
      });

      await expect(
        service.pollUntilReady('asset-123', {
          maxAttempts: 3,
          intervalMs: 10,
        })
      ).rejects.toThrow('Encoding timed out');
    });
  });

  describe('encodeAndWait', () => {
    it('encodes and waits for completion', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'asset-123' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'asset-123',
              status: 'ready',
              playback_ids: [{ id: 'playback-456' }],
              mp4_support: 'standard',
              static_renditions: {
                files: [{ name: 'high.mp4', url: 'http://example.com/high.mp4' }],
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => Buffer.from('test'),
        });

      const result = await service.encodeAndWait('http://example.com/video.mp4', undefined, {
        maxAttempts: 5,
        intervalMs: 10,
      });

      expect(result.status).toBe('ready');
      expect(result.playbackId).toBe('playback-456');
    });
  });
});
