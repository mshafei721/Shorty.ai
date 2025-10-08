import { AssemblyAIAdapter, DeepgramAdapter, TranscriptionService } from '../index';
import * as crypto from 'crypto';

describe('AssemblyAIAdapter', () => {
  let adapter: AssemblyAIAdapter;

  beforeEach(() => {
    adapter = new AssemblyAIAdapter({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestTranscription', () => {
    it('requests transcription with correct params', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'tx-123' }),
      });

      const result = await adapter.requestTranscription('http://example.com/video.mp4', {
        lang: 'en',
        diarize: true,
      });

      expect(result).toEqual({ txId: 'tx-123', provider: 'assemblyai' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.assemblyai.com/v2/transcript',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'test-key',
          }),
        })
      );
    });

    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });

      await expect(
        adapter.requestTranscription('http://example.com/video.mp4')
      ).rejects.toThrow('AssemblyAI request failed: 401');
    });
  });

  describe('fetchTranscript', () => {
    it('fetches and normalizes completed transcript', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'tx-123',
          status: 'completed',
          text: 'Hello world.',
          language_code: 'en',
          words: [
            { start: 0, end: 500, text: 'Hello', confidence: 0.95 },
            { start: 500, end: 1000, text: 'world.', confidence: 0.98 },
          ],
        }),
      });

      const transcript = await adapter.fetchTranscript('tx-123');

      expect(transcript.words).toBe('Hello world.');
      expect(transcript.tokens).toHaveLength(2);
      expect(transcript.segments).toHaveLength(1);
      expect(transcript.segments[0].text).toBe('Hello world.');
    });

    it('throws on transcription error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'tx-123', status: 'error', error: 'Audio too short' }),
      });

      await expect(adapter.fetchTranscript('tx-123')).rejects.toThrow(
        'Transcription failed: Audio too short'
      );
    });

    it('throws on incomplete transcription', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'tx-123', status: 'processing' }),
      });

      await expect(adapter.fetchTranscript('tx-123')).rejects.toThrow(
        'Transcription not ready: processing'
      );
    });
  });

  describe('verifyWebhook', () => {
    it('verifies valid HMAC signature', () => {
      const payload = JSON.stringify({ id: 'tx-123', status: 'completed' });
      const secret = 'webhook-secret';
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      const isValid = adapter.verifyWebhook(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects invalid signature', () => {
      const payload = JSON.stringify({ id: 'tx-123', status: 'completed' });
      const secret = 'webhook-secret';
      const invalidSignature = 'invalid-signature-000000000000000000000000';

      const isValid = adapter.verifyWebhook(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });
});

describe('DeepgramAdapter', () => {
  let adapter: DeepgramAdapter;

  beforeEach(() => {
    adapter = new DeepgramAdapter({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestTranscription', () => {
    it('requests transcription with correct params', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ request_id: 'dg-456' }),
      });

      const result = await adapter.requestTranscription('http://example.com/video.mp4');

      expect(result).toEqual({ txId: 'dg-456', provider: 'deepgram' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepgram.com/v1/listen',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Token test-key',
          }),
        })
      );
    });
  });

  describe('fetchTranscript', () => {
    it('fetches and normalizes Deepgram response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          request_id: 'dg-456',
          results: {
            channels: [
              {
                alternatives: [
                  {
                    transcript: 'Hello world',
                    words: [
                      { start: 0.0, end: 0.5, word: 'Hello', confidence: 0.95 },
                      { start: 0.5, end: 1.0, word: 'world', confidence: 0.98 },
                    ],
                  },
                ],
              },
            ],
            utterances: [{ start: 0.0, end: 1.0, transcript: 'Hello world' }],
          },
          metadata: { language: 'en' },
        }),
      });

      const transcript = await adapter.fetchTranscript('dg-456');

      expect(transcript.words).toBe('Hello world');
      expect(transcript.tokens).toHaveLength(2);
      expect(transcript.tokens[0].startMs).toBe(0);
      expect(transcript.tokens[0].endMs).toBe(500);
      expect(transcript.segments).toHaveLength(1);
    });
  });
});

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let primary: AssemblyAIAdapter;
  let fallback: DeepgramAdapter;

  beforeEach(() => {
    primary = new AssemblyAIAdapter({ apiKey: 'primary-key' });
    fallback = new DeepgramAdapter({ apiKey: 'fallback-key' });
    service = new TranscriptionService(primary, fallback);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestTranscription', () => {
    it('uses primary adapter when successful', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'tx-primary' }),
      });

      const result = await service.requestTranscription('http://example.com/video.mp4');

      expect(result.provider).toBe('assemblyai');
      expect(result.txId).toBe('tx-primary');
    });

    it('falls back to secondary on primary failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ request_id: 'tx-fallback' }),
        });

      const result = await service.requestTranscription('http://example.com/video.mp4');

      expect(result.provider).toBe('deepgram');
      expect(result.txId).toBe('tx-fallback');
    });
  });

  describe('handleWebhook', () => {
    it('validates webhook and extracts data', () => {
      const payload = { id: 'tx-123', status: 'completed' };
      const secret = 'webhook-secret';
      const rawPayload = JSON.stringify(payload);

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawPayload);
      const signature = hmac.digest('hex');

      const result = service.handleWebhook(
        payload,
        { 'x-webhook-signature': signature },
        secret
      );

      expect(result.txId).toBe('tx-123');
      expect(result.status).toBe('completed');
      expect(result.provider).toBe('assemblyai');
    });

    it('throws on invalid signature', () => {
      const payload = { id: 'tx-123', status: 'completed' };
      const headers = { 'x-webhook-signature': 'invalid-sig' };

      expect(() => service.handleWebhook(payload, headers, 'secret')).toThrow(
        'Invalid webhook signature'
      );
    });
  });
});
