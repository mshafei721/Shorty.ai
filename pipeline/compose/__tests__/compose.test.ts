import { ShotstackCompositionAdapter } from '../index';
import { NormalizedTranscript, FillerSpan } from '../../schemas/types';

describe('ShotstackCompositionAdapter', () => {
  let adapter: ShotstackCompositionAdapter;

  beforeEach(() => {
    adapter = new ShotstackCompositionAdapter({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockTranscript: NormalizedTranscript = {
    tokens: [
      { startMs: 0, endMs: 500, text: 'Hello', confidence: 0.95 },
      { startMs: 500, endMs: 1000, text: 'world', confidence: 0.98 },
    ],
    words: 'Hello world',
    language: 'en',
    segments: [{ startMs: 0, endMs: 1000, text: 'Hello world' }],
  };

  const mockFillers: FillerSpan[] = [];

  describe('createTimeline', () => {
    it('creates timeline with correct structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'timeline-123' }),
      });

      const input = {
        transcript: mockTranscript,
        fillers: mockFillers,
        brand: {},
        captions: true,
        videoUrl: 'http://example.com/video.mp4',
      };

      const result = await adapter.createTimeline(input);

      expect(result.timelineId).toBe('timeline-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.shotstack.io/v1/timelines',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
          }),
        })
      );
    });

    it('includes brand clips when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'timeline-123' }),
      });

      const input = {
        transcript: mockTranscript,
        fillers: mockFillers,
        brand: {
          introUrl: 'http://example.com/intro.mp4',
          outroUrl: 'http://example.com/outro.mp4',
        },
        captions: true,
        videoUrl: 'http://example.com/video.mp4',
      };

      await adapter.createTimeline(input);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.timeline.tracks.length).toBeGreaterThan(1);
    });

    it('excludes captions when disabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'timeline-123' }),
      });

      const input = {
        transcript: mockTranscript,
        fillers: mockFillers,
        brand: {},
        captions: false,
        videoUrl: 'http://example.com/video.mp4',
      };

      await adapter.createTimeline(input);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      const captionTracks = body.timeline.tracks.filter(
        (t: any) => t.clips.some((c: any) => c.asset.type === 'html')
      );
      expect(captionTracks).toHaveLength(0);
    });

    it('removes filler segments from video', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'timeline-123' }),
      });

      const transcriptWithFillers: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 200, text: 'Hello', confidence: 0.95 },
          { startMs: 200, endMs: 400, text: 'um', confidence: 0.9 },
          { startMs: 400, endMs: 800, text: 'world', confidence: 0.98 },
        ],
        words: 'Hello um world',
        language: 'en',
        segments: [],
      };

      const fillers: FillerSpan[] = [
        {
          startMs: 200,
          endMs: 400,
          tokenIdxStart: 1,
          tokenIdxEnd: 1,
          label: 'filler',
        },
      ];

      const input = {
        transcript: transcriptWithFillers,
        fillers,
        brand: {},
        captions: false,
        videoUrl: 'http://example.com/video.mp4',
      };

      await adapter.createTimeline(input);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      const videoTrack = body.timeline.tracks[0];
      expect(videoTrack.clips.length).toBeGreaterThan(1);
    });
  });

  describe('renderTimeline', () => {
    it('submits render request with correct format', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: { id: 'render-456' } }),
      });

      const result = await adapter.renderTimeline('timeline-123');

      expect(result.renderId).toBe('render-456');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.shotstack.io/v1/render',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"format":"mp4"'),
        })
      );
    });

    it('requests 1080x1920 resolution', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: { id: 'render-456' } }),
      });

      await adapter.renderTimeline('timeline-123');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.output.size).toEqual({ width: 1080, height: 1920 });
    });
  });

  describe('pollRender', () => {
    it('returns queued status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: { status: 'queued', id: 'render-456' } }),
      });

      const result = await adapter.pollRender('render-456');

      expect(result.status).toBe('queued');
      expect(result.progress).toBe(10);
    });

    it('returns done status with artifact URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            status: 'done',
            id: 'render-456',
            url: 'http://example.com/rendered.mp4',
          },
        }),
      });

      const result = await adapter.pollRender('render-456');

      expect(result.status).toBe('done');
      expect(result.artifactUrl).toBe('http://example.com/rendered.mp4');
      expect(result.progress).toBe(100);
    });

    it('returns failed status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: { status: 'failed', id: 'render-456' } }),
      });

      const result = await adapter.pollRender('render-456');

      expect(result.status).toBe('failed');
      expect(result.progress).toBe(0);
    });

    it('normalizes intermediate statuses to rendering', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: { status: 'fetching', id: 'render-456' } }),
      });

      const result = await adapter.pollRender('render-456');

      expect(result.status).toBe('rendering');
      expect(result.progress).toBe(30);
    });
  });
});
