import axios from 'axios';
import { uploadToAssemblyAI, createTranscript, pollTranscript, generateSubtitles } from '../transcription';
import type { TranscriptionWord } from '../../types';

jest.mock('axios');
jest.mock('fs/promises');

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('Transcription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadToAssemblyAI', () => {
    it('should upload file and return upload URL', async () => {
      const fs = require('fs/promises');
      fs.readFile = jest.fn().mockResolvedValue(Buffer.from('video data'));

      mockAxios.post.mockResolvedValueOnce({
        data: { upload_url: 'https://assemblyai.com/upload/abc123' },
      });

      const url = await uploadToAssemblyAI('/tmp/video.mp4');

      expect(url).toBe('https://assemblyai.com/upload/abc123');
    });
  });

  describe('createTranscript', () => {
    it('should create transcript and return transcript ID', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { id: 'transcript_123' },
      });

      const id = await createTranscript('https://assemblyai.com/upload/abc123');

      expect(id).toBe('transcript_123');
    });
  });

  describe('pollTranscript', () => {
    it('should poll and return completed transcript', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          status: 'completed',
          text: 'Hello world',
          words: [
            { text: 'Hello', start: 0, end: 500, confidence: 0.95 },
            { text: 'world', start: 500, end: 1000, confidence: 0.98 },
          ],
          confidence: 0.965,
          audio_duration: 1000,
        },
      });

      const result = await pollTranscript('transcript_123');

      expect(result.text).toBe('Hello world');
      expect(result.words).toHaveLength(2);
    });

    it('should throw error if transcript fails', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          status: 'error',
          error: 'Transcription failed',
        },
      });

      await expect(pollTranscript('transcript_123')).rejects.toThrow('Transcription failed');
    });

    it('should poll multiple times until completed', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: { status: 'queued' } })
        .mockResolvedValueOnce({ data: { status: 'processing' } })
        .mockResolvedValueOnce({
          data: {
            status: 'completed',
            text: 'Done',
            words: [{ text: 'Done', start: 0, end: 500, confidence: 0.99 }],
            confidence: 0.99,
            audio_duration: 500,
          },
        });

      const result = await pollTranscript('transcript_123');

      expect(mockAxios.get).toHaveBeenCalledTimes(3);
      expect(result.text).toBe('Done');
    }, 15000);

    it('should throw error if no text returned', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          status: 'completed',
          text: null,
          words: [],
        },
      });

      await expect(pollTranscript('transcript_123')).rejects.toThrow(
        'Transcription completed but no text/words returned'
      );
    });
  });

  describe('generateSubtitles', () => {
    it('should generate subtitle segments from words', () => {
      const words: TranscriptionWord[] = [
        { text: 'This', start: 0, end: 0.2, confidence: 0.95 },
        { text: 'is', start: 0.2, end: 0.3, confidence: 0.98 },
        { text: 'a', start: 0.3, end: 0.4, confidence: 0.99 },
        { text: 'test', start: 0.4, end: 0.6, confidence: 0.97 },
        { text: 'sentence', start: 0.6, end: 1.0, confidence: 0.96 },
        { text: 'with', start: 1.0, end: 1.2, confidence: 0.95 },
        { text: 'more', start: 1.2, end: 1.4, confidence: 0.94 },
        { text: 'words', start: 1.4, end: 1.6, confidence: 0.93 },
      ];

      const subtitles = generateSubtitles(words, 5, 3.0);

      expect(subtitles).toHaveLength(2);
      expect(subtitles[0].text).toBe('This is a test sentence');
      expect(subtitles[1].text).toBe('with more words');
    });

    it('should break segments when reaching max words', () => {
      const words: TranscriptionWord[] = Array.from({ length: 12 }, (_, i) => ({
        text: `Word${i + 1}`,
        start: i * 0.5,
        end: (i + 1) * 0.5,
        confidence: 0.95,
      }));

      const subtitles = generateSubtitles(words, 5, 10.0);

      expect(subtitles.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle single word', () => {
      const words: TranscriptionWord[] = [
        { text: 'Hello', start: 0, end: 0.5, confidence: 0.95 },
      ];

      const subtitles = generateSubtitles(words);

      expect(subtitles).toHaveLength(1);
      expect(subtitles[0].text).toBe('Hello');
    });
  });
});
