export interface UploadedVideo {
  id: string;
  originalName: string;
  storedPath: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  words: TranscriptionWord[];
  confidence: number;
  duration: number;
}

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface JobFeatures {
  subtitles: boolean;
  backgroundChange?: {
    enabled: boolean;
    presetId?: string;
  };
  backgroundMusic?: {
    enabled: boolean;
    trackId?: string;
    volume: number;
  };
  introOutro?: {
    enabled: boolean;
    templateId?: string;
  };
  fillerWordRemoval: boolean;
}

export type JobStatus = 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';

export interface ProcessingJob {
  id: string;
  videoId: string;
  status: JobStatus;
  progress: number;
  requestedFeatures: JobFeatures;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  retries: number;
  transcriptionId?: string;
  compositionId?: string;
  outputUrl?: string;
}

export interface JobError {
  code: string;
  message: string;
  retryable: boolean;
}
