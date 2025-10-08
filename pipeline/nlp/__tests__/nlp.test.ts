import { FillerDetectionService } from '../index';
import { NormalizedTranscript, FillerSpan } from '../../schemas/types';

describe('FillerDetectionService', () => {
  let service: FillerDetectionService;

  beforeEach(() => {
    service = new FillerDetectionService({ minConfidence: 0.7 });
  });

  describe('detectFillers', () => {
    it('detects common filler words', () => {
      const transcript: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 200, text: 'So', confidence: 0.9 },
          { startMs: 200, endMs: 400, text: 'um', confidence: 0.85 },
          { startMs: 400, endMs: 800, text: 'hello', confidence: 0.95 },
          { startMs: 800, endMs: 1000, text: 'like', confidence: 0.9 },
          { startMs: 1000, endMs: 1400, text: 'world', confidence: 0.98 },
        ],
        words: 'So um hello like world',
        language: 'en',
        segments: [],
      };

      const spans = service.detectFillers(transcript);

      const fillerSpans = spans.filter(s => s.label === 'filler');
      expect(fillerSpans).toHaveLength(2);
      expect(fillerSpans[0].tokenIdxStart).toBe(0);
      expect(fillerSpans[0].tokenIdxEnd).toBe(1);
      expect(fillerSpans[1].tokenIdxStart).toBe(3);
    });

    it('detects silence gaps', () => {
      const transcript: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 200, text: 'Hello', confidence: 0.95 },
          { startMs: 600, endMs: 800, text: 'world', confidence: 0.98 },
        ],
        words: 'Hello world',
        language: 'en',
        segments: [],
      };

      const spans = service.detectFillers(transcript);
      const silenceSpans = spans.filter(s => s.label === 'silence');

      expect(silenceSpans).toHaveLength(1);
      expect(silenceSpans[0].startMs).toBe(200);
      expect(silenceSpans[0].endMs).toBe(600);
    });

    it('ignores low confidence tokens', () => {
      const transcript: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 200, text: 'um', confidence: 0.5 },
          { startMs: 200, endMs: 400, text: 'hello', confidence: 0.95 },
        ],
        words: 'um hello',
        language: 'en',
        segments: [],
      };

      const spans = service.detectFillers(transcript);
      const fillerSpans = spans.filter(s => s.label === 'filler');

      expect(fillerSpans).toHaveLength(0);
    });

    it('merges adjacent filler spans', () => {
      const transcript: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 100, text: 'um', confidence: 0.9 },
          { startMs: 100, endMs: 200, text: 'uh', confidence: 0.9 },
          { startMs: 200, endMs: 400, text: 'hello', confidence: 0.95 },
        ],
        words: 'um uh hello',
        language: 'en',
        segments: [],
      };

      const spans = service.detectFillers(transcript);
      const fillerSpans = spans.filter(s => s.label === 'filler');

      expect(fillerSpans).toHaveLength(1);
      expect(fillerSpans[0].startMs).toBe(0);
      expect(fillerSpans[0].endMs).toBe(200);
      expect(fillerSpans[0].tokenIdxStart).toBe(0);
      expect(fillerSpans[0].tokenIdxEnd).toBe(1);
    });
  });

  describe('evaluateMetrics', () => {
    it('calculates precision and recall correctly', () => {
      const detected: FillerSpan[] = [
        { startMs: 0, endMs: 100, tokenIdxStart: 0, tokenIdxEnd: 0, label: 'filler' },
        { startMs: 200, endMs: 300, tokenIdxStart: 2, tokenIdxEnd: 2, label: 'filler' },
        { startMs: 400, endMs: 500, tokenIdxStart: 4, tokenIdxEnd: 4, label: 'filler' },
      ];

      const groundTruth: FillerSpan[] = [
        { startMs: 0, endMs: 100, tokenIdxStart: 0, tokenIdxEnd: 0, label: 'filler' },
        { startMs: 200, endMs: 300, tokenIdxStart: 2, tokenIdxEnd: 2, label: 'filler' },
        { startMs: 600, endMs: 700, tokenIdxStart: 6, tokenIdxEnd: 6, label: 'filler' },
      ];

      const metrics = service.evaluateMetrics(detected, groundTruth);

      expect(metrics.truePositives).toBe(2);
      expect(metrics.falsePositives).toBe(1);
      expect(metrics.falseNegatives).toBe(1);
      expect(metrics.precision).toBeCloseTo(2 / 3, 2);
      expect(metrics.recall).toBeCloseTo(2 / 3, 2);
    });

    it('handles perfect detection', () => {
      const spans: FillerSpan[] = [
        { startMs: 0, endMs: 100, tokenIdxStart: 0, tokenIdxEnd: 0, label: 'filler' },
      ];

      const metrics = service.evaluateMetrics(spans, spans);

      expect(metrics.precision).toBe(1.0);
      expect(metrics.recall).toBe(1.0);
      expect(metrics.f1Score).toBe(1.0);
    });

    it('handles no detections', () => {
      const groundTruth: FillerSpan[] = [
        { startMs: 0, endMs: 100, tokenIdxStart: 0, tokenIdxEnd: 0, label: 'filler' },
      ];

      const metrics = service.evaluateMetrics([], groundTruth);

      expect(metrics.precision).toBe(0);
      expect(metrics.recall).toBe(0);
      expect(metrics.falseNegatives).toBe(1);
    });
  });

  describe('tuneThreshold', () => {
    it('finds optimal confidence threshold', () => {
      const transcript: NormalizedTranscript = {
        tokens: [
          { startMs: 0, endMs: 100, text: 'um', confidence: 0.95 },
          { startMs: 100, endMs: 200, text: 'hello', confidence: 0.98 },
          { startMs: 200, endMs: 300, text: 'uh', confidence: 0.85 },
          { startMs: 300, endMs: 400, text: 'world', confidence: 0.96 },
          { startMs: 400, endMs: 500, text: 'like', confidence: 0.75 },
        ],
        words: 'um hello uh world like',
        language: 'en',
        segments: [],
      };

      const groundTruth: FillerSpan[] = [
        { startMs: 0, endMs: 100, tokenIdxStart: 0, tokenIdxEnd: 0, label: 'filler' },
        { startMs: 200, endMs: 300, tokenIdxStart: 2, tokenIdxEnd: 2, label: 'filler' },
        { startMs: 400, endMs: 500, tokenIdxStart: 4, tokenIdxEnd: 4, label: 'filler' },
      ];

      const result = service.tuneThreshold(transcript, groundTruth, 0.9, 0.85);

      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.metrics).toBeDefined();
    });
  });
});
