/**
 * M3: Feature Selection & Preview - Type Definitions
 *
 * Defines data contracts for feature configuration, M2 gateway interfaces,
 * and preview state management.
 *
 * @module features/m3/types
 */

export type CaptionStyle = 'boxed' | 'shadow' | 'outline';

export interface CaptionConfig {
  enabled: boolean;
  size: number;
  style: CaptionStyle;
}

export interface M3Preset {
  fillerRemoval: boolean;
  jumpCuts: boolean;
  captions: CaptionConfig;
  introOutro: boolean;
  frameMarginPx: number;
  version: 1;
  updatedAt: string;
}

export const DEFAULT_M3_PRESET: M3Preset = {
  fillerRemoval: true,
  jumpCuts: false,
  captions: {
    enabled: true,
    size: 18,
    style: 'boxed',
  },
  introOutro: false,
  frameMarginPx: 16,
  version: 1,
  updatedAt: new Date().toISOString(),
};

export interface NormalizedToken {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface NormalizedTranscript {
  tokens: NormalizedToken[];
  fullText: string;
  durationMs: number;
  language?: string;
}

export interface FillerSpan {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
}

export interface M2JobStatus {
  stage: 'upload' | 'transcribe' | 'edit' | 'render' | 'complete';
  status: 'queued' | 'processing' | 'done' | 'failed';
  progressPct?: number;
  artifactUrl?: string;
  error?: string;
}

export interface DraftRenderRequest {
  projectId: string;
  assetId: string;
  preset: M3Preset;
}

export interface DraftRenderStatus {
  renderId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  artifactUrl?: string;
  error?: string;
  progressPct?: number;
}

export interface M2Gateway {
  getLatestJob(projectId: string, assetId: string): Promise<M2JobStatus>;
  getTranscript(projectId: string, assetId: string): Promise<NormalizedTranscript>;
  getFillerSpans(projectId: string, assetId: string): Promise<FillerSpan[]>;
  requestDraft(req: DraftRenderRequest): Promise<{ renderId: string }>;
  pollDraft(renderId: string): Promise<DraftRenderStatus>;
}

export type PreviewState =
  | 'idle'
  | 'loading_data'
  | 'ready'
  | 'generating_draft'
  | 'draft_ready'
  | 'error';

export interface PreviewContext {
  projectId: string;
  assetId: string;
  rawVideoUri: string;
  transcript: NormalizedTranscript | null;
  fillerSpans: FillerSpan[];
  draftArtifactUrl: string | null;
  renderId: string | null;
  error: string | null;
  progressPct: number;
}

export interface LastPreviewMeta {
  timestamp: string;
  assetId: string;
  draftRenderId?: string;
  state: PreviewState;
}

export type M3TelemetryEvent =
  | 'm3_features_opened'
  | 'm3_preset_applied'
  | 'm3_preview_play'
  | 'm3_draft_render_requested'
  | 'm3_draft_render_ready'
  | 'm3_preview_error';
