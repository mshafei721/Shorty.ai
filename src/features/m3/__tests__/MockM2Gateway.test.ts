/**
 * Mock M2 Gateway Tests
 */

import { MockM2Gateway } from '../gateway/__mocks__/MockM2Gateway';

describe('MockM2Gateway', () => {
  let gateway: MockM2Gateway;

  beforeEach(() => {
    gateway = new MockM2Gateway();
  });

  describe('getLatestJob', () => {
    it('returns completed job status', async () => {
      const status = await gateway.getLatestJob('proj_1', 'asset_1');

      expect(status.stage).toBe('complete');
      expect(status.status).toBe('done');
      expect(status.progressPct).toBe(100);
    });
  });

  describe('getTranscript', () => {
    it('returns normalized transcript with tokens', async () => {
      const transcript = await gateway.getTranscript('proj_1', 'asset_1');

      expect(transcript.tokens).toBeDefined();
      expect(transcript.tokens.length).toBeGreaterThan(0);
      expect(transcript.fullText).toBeTruthy();
      expect(transcript.durationMs).toBeGreaterThan(0);
    });

    it('includes confidence scores for tokens', async () => {
      const transcript = await gateway.getTranscript('proj_1', 'asset_1');

      transcript.tokens.forEach((token) => {
        expect(token.confidence).toBeDefined();
        if (token.confidence !== undefined) {
          expect(token.confidence).toBeGreaterThanOrEqual(0);
          expect(token.confidence).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('getFillerSpans', () => {
    it('returns filler word spans', async () => {
      const fillers = await gateway.getFillerSpans('proj_1', 'asset_1');

      expect(Array.isArray(fillers)).toBe(true);
      expect(fillers.length).toBeGreaterThan(0);
    });

    it('includes timing and confidence for each filler', async () => {
      const fillers = await gateway.getFillerSpans('proj_1', 'asset_1');

      fillers.forEach(filler => {
        expect(filler.startMs).toBeGreaterThanOrEqual(0);
        expect(filler.endMs).toBeGreaterThan(filler.startMs);
        expect(filler.text).toBeTruthy();
        expect(filler.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('requestDraft', () => {
    it('returns render ID', async () => {
      const result = await gateway.requestDraft({
        projectId: 'proj_1',
        assetId: 'asset_1',
        preset: {
          fillerRemoval: true,
          jumpCuts: false,
          captions: { enabled: true, size: 18, style: 'boxed' },
          introOutro: false,
          frameMarginPx: 16,
          version: 1,
          updatedAt: new Date().toISOString(),
        },
      });

      expect(result.renderId).toBeTruthy();
      expect(result.renderId).toContain('draft_');
    });
  });

  describe('pollDraft', () => {
    it('progresses through rendering stages', async () => {
      const { renderId } = await gateway.requestDraft({
        projectId: 'proj_1',
        assetId: 'asset_1',
        preset: {
          fillerRemoval: true,
          jumpCuts: false,
          captions: { enabled: true, size: 18, style: 'boxed' },
          introOutro: false,
          frameMarginPx: 16,
          version: 1,
          updatedAt: new Date().toISOString(),
        },
      });

      const status1 = await gateway.pollDraft(renderId);
      expect(status1.status).toBe('queued');

      await new Promise(resolve => setTimeout(resolve, 1100));
      const status2 = await gateway.pollDraft(renderId);
      expect(status2.status).toBe('rendering');

      await new Promise(resolve => setTimeout(resolve, 2000));
      const status3 = await gateway.pollDraft(renderId);
      expect(status3.status).toBe('done');
      expect(status3.artifactUrl).toBeTruthy();
    }, 10000);

    it('throws error for unknown render ID', async () => {
      await expect(gateway.pollDraft('unknown_id')).rejects.toThrow('not found');
    });
  });
});
