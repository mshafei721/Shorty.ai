import axios from 'axios';
import { createComposition, pollRenderStatus } from '../composition';
import type { SubtitleSegment } from '../../types';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('Composition Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComposition', () => {
    it('should create composition and return render ID', async () => {
      const subtitles: SubtitleSegment[] = [
        { start: 0, end: 2, text: 'Hello world' },
        { start: 2, end: 4, text: 'This is a test' },
      ];

      mockAxios.post.mockResolvedValueOnce({
        data: { response: { id: 'render_123' } },
      });

      const renderId = await createComposition('https://example.com/video.mp4', subtitles, 4.0);

      expect(renderId).toBe('render_123');
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/render'),
        expect.objectContaining({
          timeline: expect.objectContaining({
            tracks: expect.arrayContaining([
              expect.objectContaining({
                clips: expect.any(Array),
              }),
            ]),
          }),
          output: expect.objectContaining({
            format: 'mp4',
            resolution: 'hd',
            aspectRatio: '9:16',
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': expect.any(String),
          }),
        })
      );
    });

    it('should create subtitle clips for each segment', async () => {
      const subtitles: SubtitleSegment[] = [
        { start: 0, end: 1, text: 'First' },
        { start: 1, end: 2, text: 'Second' },
        { start: 2, end: 3, text: 'Third' },
      ];

      mockAxios.post.mockResolvedValueOnce({
        data: { response: { id: 'render_123' } },
      });

      await createComposition('https://example.com/video.mp4', subtitles, 3.0);

      const payload = mockAxios.post.mock.calls[0][1] as any;
      const subtitleTrack = payload.timeline.tracks[1];

      expect(subtitleTrack.clips).toHaveLength(3);
      expect(subtitleTrack.clips[0]).toMatchObject({
        start: 0,
        length: 1,
        position: 'bottom',
      });
    });
  });

  describe('pollRenderStatus', () => {
    it('should poll and return output URL when done', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            status: 'done',
            url: 'https://shotstack.io/output/video.mp4',
          },
        },
      });

      const url = await pollRenderStatus('render_123');

      expect(url).toBe('https://shotstack.io/output/video.mp4');
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/render/render_123'),
        expect.any(Object)
      );
    });

    it('should throw error if render fails', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            status: 'failed',
            error: 'Rendering error',
          },
        },
      });

      await expect(pollRenderStatus('render_123')).rejects.toThrow('Rendering error');
    });

    it('should poll multiple times until done', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: { response: { status: 'queued' } } })
        .mockResolvedValueOnce({ data: { response: { status: 'rendering' } } })
        .mockResolvedValueOnce({
          data: {
            response: {
              status: 'done',
              url: 'https://shotstack.io/output/video.mp4',
            },
          },
        });

      const url = await pollRenderStatus('render_123');

      expect(mockAxios.get).toHaveBeenCalledTimes(3);
      expect(url).toBe('https://shotstack.io/output/video.mp4');
    });

    it('should throw error if no URL returned', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            status: 'done',
            url: null,
          },
        },
      });

      await expect(pollRenderStatus('render_123')).rejects.toThrow(
        'Render completed but no URL returned'
      );
    });
  });
});
