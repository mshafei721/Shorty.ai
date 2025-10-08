export type JobStage = 'upload' | 'transcribe' | 'nlp' | 'compose' | 'encode' | 'done' | 'failed';

export type JobStatus = 'idle' | 'running' | 'blocked' | 'succeeded' | 'failed' | 'cancelled';

export interface StageState {
  status: JobStatus;
  attempts: number;
  startedAt?: string;
  updatedAt?: string;
  metrics?: Record<string, number>;
  error?: {
    code: string;
    message: string;
  };
}

export interface Job {
  jobId: string;
  projectId: string;
  assetId: string;
  correlationId?: string;
  status: JobStatus;
  progressPct: number;
  stages: Record<JobStage, StageState>;
  artifacts?: {
    objectUrl?: string;
    transcriptId?: string;
    timelineId?: string;
    renderId?: string;
    encodeId?: string;
    assetUrl?: string;
    checksum?: string;
  };
  logs: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface NormalizedToken {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
}

export interface NormalizedTranscript {
  tokens: NormalizedToken[];
  words: string;
  language: string;
  segments: Array<{
    startMs: number;
    endMs: number;
    text: string;
  }>;
}

export interface FillerSpan {
  startMs: number;
  endMs: number;
  tokenIdxStart: number;
  tokenIdxEnd: number;
  label: 'filler' | 'silence';
}

export type EventType =
  | 'job.created'
  | 'job.updated'
  | 'stage.started'
  | 'stage.progress'
  | 'stage.succeeded'
  | 'stage.failed'
  | 'webhook.received';

export interface JobEvent {
  type: EventType;
  jobId: string;
  stage?: JobStage;
  timestamp: string;
  data?: Record<string, unknown>;
}
