/**
 * Mock M2 Gateway
 *
 * In-memory mock implementation for development and testing.
 * Simulates M2 pipeline responses with realistic delays and data.
 *
 * @module features/m3/gateway/MockM2Gateway
 */

import type {
  M2Gateway,
  M2JobStatus,
  NormalizedTranscript,
  FillerSpan,
  DraftRenderRequest,
  DraftRenderStatus,
} from '../../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockM2Gateway implements M2Gateway {
  private draftJobs: Map<string, DraftRenderStatus> = new Map();
  private draftCounter = 0;

  async getLatestJob(_projectId: string, _assetId: string): Promise<M2JobStatus> {
    await delay(300);

    return {
      stage: 'complete',
      status: 'done',
      progressPct: 100,
      artifactUrl: 'mock://processed-video.mp4',
    };
  }

  async getTranscript(_projectId: string, _assetId: string): Promise<NormalizedTranscript> {
    await delay(500);

    const mockTokens = [
      { text: 'Welcome', startMs: 0, endMs: 500, confidence: 0.98 },
      { text: 'to', startMs: 500, endMs: 700, confidence: 0.99 },
      { text: 'this', startMs: 700, endMs: 1000, confidence: 0.97 },
      { text: 'um', startMs: 1000, endMs: 1200, confidence: 0.85 },
      { text: 'video', startMs: 1200, endMs: 1700, confidence: 0.96 },
      { text: 'tutorial.', startMs: 1700, endMs: 2300, confidence: 0.98 },
      { text: 'Today', startMs: 2500, endMs: 2900, confidence: 0.97 },
      { text: 'we', startMs: 2900, endMs: 3100, confidence: 0.99 },
      { text: 'will', startMs: 3100, endMs: 3400, confidence: 0.98 },
      { text: 'uh', startMs: 3400, endMs: 3600, confidence: 0.82 },
      { text: 'learn', startMs: 3600, endMs: 4000, confidence: 0.97 },
      { text: 'about', startMs: 4000, endMs: 4300, confidence: 0.98 },
      { text: 'React', startMs: 4300, endMs: 4700, confidence: 0.99 },
      { text: 'Native.', startMs: 4700, endMs: 5200, confidence: 0.97 },
    ];

    return {
      tokens: mockTokens,
      fullText: mockTokens.map(t => t.text).join(' '),
      durationMs: 5200,
      language: 'en',
    };
  }

  async getFillerSpans(_projectId: string, _assetId: string): Promise<FillerSpan[]> {
    await delay(400);

    return [
      { startMs: 1000, endMs: 1200, text: 'um', confidence: 0.85 },
      { startMs: 3400, endMs: 3600, text: 'uh', confidence: 0.82 },
    ];
  }

  async requestDraft(req: DraftRenderRequest): Promise<{ renderId: string }> {
    await delay(200);

    const renderId = `draft_${++this.draftCounter}_${Date.now()}`;

    this.draftJobs.set(renderId, {
      renderId,
      status: 'queued',
      progressPct: 0,
    });

    setTimeout(() => {
      const job = this.draftJobs.get(renderId);
      if (job) {
        job.status = 'rendering';
        job.progressPct = 30;
      }
    }, 1000);

    setTimeout(() => {
      const job = this.draftJobs.get(renderId);
      if (job) {
        job.status = 'rendering';
        job.progressPct = 70;
      }
    }, 2000);

    setTimeout(() => {
      const job = this.draftJobs.get(renderId);
      if (job) {
        job.status = 'done';
        job.progressPct = 100;
        job.artifactUrl = `mock://draft-${renderId}.mp4`;
      }
    }, 3000);

    return { renderId };
  }

  async pollDraft(renderId: string): Promise<DraftRenderStatus> {
    await delay(100);

    const job = this.draftJobs.get(renderId);

    if (!job) {
      throw new Error(`Draft ${renderId} not found`);
    }

    return { ...job };
  }
}
