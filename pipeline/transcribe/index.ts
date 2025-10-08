import * as crypto from 'crypto';
import { NormalizedTranscript, NormalizedToken } from '../schemas/types';

export interface TranscriptionOptions {
  lang?: string;
  diarize?: boolean;
}

export interface TranscriptionResult {
  txId: string;
  provider: 'assemblyai' | 'deepgram';
}

export interface WebhookPayload {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  words?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  error?: string;
}

export interface TranscriptionAdapter {
  requestTranscription(
    objectUrl: string,
    opts?: TranscriptionOptions
  ): Promise<TranscriptionResult>;
  fetchTranscript(txId: string): Promise<NormalizedTranscript>;
  verifyWebhook(payload: string, signature: string, secret: string): boolean;
}

export class AssemblyAIAdapter implements TranscriptionAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.assemblyai.com/v2';

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async requestTranscription(
    objectUrl: string,
    opts?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const response = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: objectUrl,
        language_code: opts?.lang || 'en',
        speaker_labels: opts?.diarize || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI request failed: ${response.status}`);
    }

    const data = await response.json();
    return { txId: data.id, provider: 'assemblyai' };
  }

  async fetchTranscript(txId: string): Promise<NormalizedTranscript> {
    const response = await fetch(`${this.baseUrl}/transcript/${txId}`, {
      headers: { 'Authorization': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`Transcription failed: ${data.error}`);
    }

    if (data.status !== 'completed') {
      throw new Error(`Transcription not ready: ${data.status}`);
    }

    return this.normalize(data);
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computed = hmac.digest('hex');

    if (signature.length !== computed.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computed, 'hex'));
  }

  private normalize(data: any): NormalizedTranscript {
    const tokens: NormalizedToken[] = (data.words || []).map((w: any) => ({
      startMs: w.start,
      endMs: w.end,
      text: w.text,
      confidence: w.confidence,
    }));

    const segments = this.buildSegments(tokens);

    return {
      tokens,
      words: data.text || '',
      language: data.language_code || 'en',
      segments,
    };
  }

  private buildSegments(tokens: NormalizedToken[]): Array<{
    startMs: number;
    endMs: number;
    text: string;
  }> {
    const segments: Array<{ startMs: number; endMs: number; text: string }> = [];
    type SegmentAccumulator = { startMs: number; endMs: number; tokens: string[] };
    let currentSegment: SegmentAccumulator | null = null;

    tokens.forEach(token => {
      const isPunctuation = /[.!?]$/.test(token.text);

      if (!currentSegment) {
        currentSegment = {
          startMs: token.startMs,
          endMs: token.endMs,
          tokens: [token.text],
        };
      } else {
        currentSegment.tokens.push(token.text);
        currentSegment.endMs = token.endMs;
      }

      if (isPunctuation) {
        segments.push({
          startMs: currentSegment.startMs,
          endMs: currentSegment.endMs,
          text: currentSegment.tokens.join(' '),
        });
        currentSegment = null;
      }
    });

    if (currentSegment) {
      const finalSegment: SegmentAccumulator = currentSegment;
      segments.push({
        startMs: finalSegment.startMs,
        endMs: finalSegment.endMs,
        text: finalSegment.tokens.join(' '),
      });
    }

    return segments;
  }
}

export class DeepgramAdapter implements TranscriptionAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.deepgram.com/v1';

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async requestTranscription(
    objectUrl: string,
    opts?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const response = await fetch(`${this.baseUrl}/listen`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: objectUrl,
        language: opts?.lang || 'en',
        diarize: opts?.diarize || false,
        punctuate: true,
        utterances: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepgram request failed: ${response.status}`);
    }

    const data = await response.json();
    return { txId: data.request_id, provider: 'deepgram' };
  }

  async fetchTranscript(txId: string): Promise<NormalizedTranscript> {
    const response = await fetch(`${this.baseUrl}/requests/${txId}`, {
      headers: { 'Authorization': `Token ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Deepgram fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return this.normalize(data);
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computed = hmac.digest('base64');

    if (signature.length !== computed.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  }

  private normalize(data: any): NormalizedTranscript {
    const results = data.results?.channels?.[0]?.alternatives?.[0];
    if (!results) {
      throw new Error('Invalid Deepgram response');
    }

    const tokens: NormalizedToken[] = (results.words || []).map((w: any) => ({
      startMs: Math.floor(w.start * 1000),
      endMs: Math.floor(w.end * 1000),
      text: w.word,
      confidence: w.confidence,
    }));

    const segments =
      data.results?.utterances?.map((u: any) => ({
        startMs: Math.floor(u.start * 1000),
        endMs: Math.floor(u.end * 1000),
        text: u.transcript,
      })) || [];

    return {
      tokens,
      words: results.transcript || '',
      language: data.metadata?.language || 'en',
      segments,
    };
  }
}

export class TranscriptionService {
  private primary: TranscriptionAdapter;
  private fallback: TranscriptionAdapter;

  constructor(primary: TranscriptionAdapter, fallback: TranscriptionAdapter) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async requestTranscription(
    objectUrl: string,
    opts?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      return await this.primary.requestTranscription(objectUrl, opts);
    } catch (err) {
      console.warn('Primary transcription failed, trying fallback:', err);
      return await this.fallback.requestTranscription(objectUrl, opts);
    }
  }

  async fetchTranscript(
    txId: string,
    provider: 'assemblyai' | 'deepgram'
  ): Promise<NormalizedTranscript> {
    const adapter = provider === 'assemblyai' ? this.primary : this.fallback;
    return adapter.fetchTranscript(txId);
  }

  handleWebhook(
    payload: any,
    headers: Record<string, string>,
    secret: string
  ): { txId: string; status: string; provider: 'assemblyai' | 'deepgram' } {
    const signature = headers['x-webhook-signature'] || headers['x-deepgram-signature'];
    const rawPayload = JSON.stringify(payload);

    const isAssemblyAI = this.primary.verifyWebhook(rawPayload, signature, secret);
    const isDeepgram = !isAssemblyAI && this.fallback.verifyWebhook(rawPayload, signature, secret);

    if (!isAssemblyAI && !isDeepgram) {
      throw new Error('Invalid webhook signature');
    }

    return {
      txId: payload.id || payload.request_id,
      status: payload.status,
      provider: isAssemblyAI ? 'assemblyai' : 'deepgram',
    };
  }
}
