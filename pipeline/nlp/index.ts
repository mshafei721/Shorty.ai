import { NormalizedTranscript, NormalizedToken, FillerSpan } from '../schemas/types';

const FILLER_WORDS = new Set([
  'um',
  'uh',
  'like',
  'you know',
  'actually',
  'basically',
  'literally',
  'right',
  'so',
  'well',
  'I mean',
  'kind of',
  'sort of',
]);

const FILLER_PATTERNS = [
  /\bum+\b/i,
  /\buh+\b/i,
  /\blike\b/i,
  /\byou know\b/i,
  /\bactually\b/i,
  /\bbasically\b/i,
  /\bliterally\b/i,
  /\bright\b/i,
  /\bso\b/i,
  /\bwell\b/i,
  /\bi mean\b/i,
  /\bkind of\b/i,
  /\bsort of\b/i,
];

export interface FillerDetectionConfig {
  minConfidence?: number;
  minSilenceDurationMs?: number;
  contextWindow?: number;
}

export interface DetectionMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

export class FillerDetectionService {
  private readonly minConfidence: number;
  private readonly minSilenceDurationMs: number;
  private readonly contextWindow: number;

  constructor(config: FillerDetectionConfig = {}) {
    this.minConfidence = config.minConfidence ?? 0.7;
    this.minSilenceDurationMs = config.minSilenceDurationMs ?? 300;
    this.contextWindow = config.contextWindow ?? 2;
  }

  detectFillers(transcript: NormalizedTranscript): FillerSpan[] {
    const spans: FillerSpan[] = [];
    const tokens = transcript.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (this.isFillerWord(token)) {
        spans.push({
          startMs: token.startMs,
          endMs: token.endMs,
          tokenIdxStart: i,
          tokenIdxEnd: i,
          label: 'filler',
        });
      }

      if (i > 0) {
        const prevToken = tokens[i - 1];
        const silenceDuration = token.startMs - prevToken.endMs;

        if (silenceDuration >= this.minSilenceDurationMs) {
          spans.push({
            startMs: prevToken.endMs,
            endMs: token.startMs,
            tokenIdxStart: i - 1,
            tokenIdxEnd: i,
            label: 'silence',
          });
        }
      }
    }

    return this.mergeAdjacentSpans(spans);
  }

  private isFillerWord(token: NormalizedToken): boolean {
    if (token.confidence < this.minConfidence) {
      return false;
    }

    const normalized = token.text.toLowerCase().trim();

    if (FILLER_WORDS.has(normalized)) {
      return true;
    }

    return FILLER_PATTERNS.some(pattern => pattern.test(normalized));
  }

  private mergeAdjacentSpans(spans: FillerSpan[]): FillerSpan[] {
    if (spans.length === 0) return [];

    const merged: FillerSpan[] = [];
    let current = spans[0];

    for (let i = 1; i < spans.length; i++) {
      const next = spans[i];

      if (
        current.label === next.label &&
        next.tokenIdxStart === current.tokenIdxEnd + 1 &&
        next.startMs - current.endMs < 200
      ) {
        current = {
          ...current,
          endMs: next.endMs,
          tokenIdxEnd: next.tokenIdxEnd,
        };
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }

  evaluateMetrics(
    detected: FillerSpan[],
    groundTruth: FillerSpan[]
  ): DetectionMetrics {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    const detectedSet = new Set(detected.map(s => `${s.startMs}-${s.endMs}`));
    const truthSet = new Set(groundTruth.map(s => `${s.startMs}-${s.endMs}`));

    for (const span of detected) {
      const key = `${span.startMs}-${span.endMs}`;
      if (truthSet.has(key) || this.hasOverlap(span, groundTruth)) {
        truePositives++;
      } else {
        falsePositives++;
      }
    }

    for (const span of groundTruth) {
      const key = `${span.startMs}-${span.endMs}`;
      if (!detectedSet.has(key) && !this.hasOverlap(span, detected)) {
        falseNegatives++;
      }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;

    return {
      precision,
      recall,
      f1Score,
      truePositives,
      falsePositives,
      falseNegatives,
    };
  }

  private hasOverlap(span: FillerSpan, spans: FillerSpan[]): boolean {
    return spans.some(
      other =>
        span.label === other.label &&
        !(span.endMs <= other.startMs || span.startMs >= other.endMs)
    );
  }

  tuneThreshold(
    transcript: NormalizedTranscript,
    groundTruth: FillerSpan[],
    targetPrecision = 0.9,
    targetRecall = 0.85
  ): { confidence: number; metrics: DetectionMetrics } {
    let bestConfig = { confidence: this.minConfidence, metrics: null as DetectionMetrics | null };

    for (let confidence = 0.5; confidence <= 1.0; confidence += 0.05) {
      const detector = new FillerDetectionService({
        minConfidence: confidence,
        minSilenceDurationMs: this.minSilenceDurationMs,
        contextWindow: this.contextWindow,
      });

      const detected = detector.detectFillers(transcript);
      const metrics = detector.evaluateMetrics(detected, groundTruth);

      if (metrics.precision >= targetPrecision && metrics.recall >= targetRecall) {
        if (!bestConfig.metrics || metrics.f1Score > bestConfig.metrics.f1Score) {
          bestConfig = { confidence, metrics };
        }
      }
    }

    if (!bestConfig.metrics) {
      const detected = this.detectFillers(transcript);
      bestConfig.metrics = this.evaluateMetrics(detected, groundTruth);
    }

    return bestConfig as { confidence: number; metrics: DetectionMetrics };
  }
}
