# Provider-Agnostic Adapter Interfaces

**Version:** 1.0
**Last Updated:** 2025-10-06
**Status:** Architecture Specification

## Overview

Shorty.ai processing pipeline offloads heavy video operations to external REST APIs. To enable provider switchover with minimal code changes, all vendor integrations use provider-agnostic adapter interfaces. Each capability (upload, transcription, composition, encoding) defines TypeScript interfaces that map vendor-specific responses to neutral schemas.

**Key Principles:**
- Standard TypeScript interfaces for all external operations
- Neutral error codes mapped from vendor-specific errors
- Circuit breaker pattern for automatic failover
- Exponential backoff retry strategy (2s/4s/8s, max 3 attempts)
- <5 min cutover time when switching providers

## Adapter Interfaces

### 1. Upload Adapter

Handles resumable video uploads to external storage or vendor endpoints.

```typescript
/**
 * Upload adapter for resumable multipart uploads
 */
interface UploadAdapter {
  /**
   * Upload video file with progress tracking
   * @param file - Video file to upload (max 500MB)
   * @param metadata - Video metadata (projectId, videoId, duration)
   * @returns Upload ID and expiration time
   * @throws UploadError with retryable flag
   */
  upload(
    file: File | Blob,
    metadata: VideoMetadata
  ): Promise<UploadResult>;

  /**
   * Resume interrupted upload from last byte
   * @param uploadId - Previous upload ID from failed attempt
   * @param file - Same video file
   * @param lastByte - Byte offset to resume from
   * @returns Upload ID and expiration time
   */
  resume(
    uploadId: string,
    file: File | Blob,
    lastByte: number
  ): Promise<UploadResult>;

  /**
   * Cancel ongoing upload
   * @param uploadId - Upload ID to cancel
   */
  cancel(uploadId: string): Promise<void>;
}

interface VideoMetadata {
  projectId: string;    // uuid
  videoId: string;      // uuid
  durationSec: number;  // Video duration in seconds
  sizeBytes: number;    // File size for validation
}

interface UploadResult {
  uploadId: string;       // Vendor-specific upload ID
  expiresInSec: number;   // TTL for upload URL (e.g., 3600)
  url?: string;           // Optional pre-signed URL for direct upload
}

/**
 * Upload-specific error codes
 */
enum UploadErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',           // 413 Payload Too Large
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',   // 415 Unsupported Media Type
  NETWORK_ERROR = 'NETWORK_ERROR',             // Network failure (retryable)
  RATE_LIMIT = 'RATE_LIMIT',                   // 429 Too Many Requests
  SERVER_ERROR = 'SERVER_ERROR',               // 500/503 (retryable)
  TIMEOUT = 'TIMEOUT',                         // Upload timeout
}

class UploadError extends Error {
  constructor(
    public code: UploadErrorCode,
    public message: string,
    public retryable: boolean,
    public statusCode?: number
  ) {
    super(message);
  }
}
```

**Vendor Mappings:**
- **Primary:** Direct upload to backend → pre-signed S3/Cloudflare R2 URL
- **Fallback:** tus protocol resumable uploads

**Error Handling:**
- Retryable: `NETWORK_ERROR`, `SERVER_ERROR`, `RATE_LIMIT`, `TIMEOUT`
- Non-retryable: `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT`

---

### 2. Transcription Adapter

Converts speech to text with word-level timestamps for subtitle generation and filler-word detection.

```typescript
/**
 * Transcription adapter for speech-to-text with word-level timestamps
 */
interface TranscriptionAdapter {
  /**
   * Start transcription job
   * @param uploadId - Upload ID from UploadAdapter
   * @param options - Transcription options (language, webhook)
   * @returns Job ID for polling
   * @throws TranscriptionError with retryable flag
   */
  transcribe(
    uploadId: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionJob>;

  /**
   * Get transcription status and result
   * @param jobId - Transcription job ID
   * @returns Current status and result if complete
   * @throws TranscriptionError if job failed
   */
  getStatus(jobId: string): Promise<TranscriptionResult>;

  /**
   * Cancel ongoing transcription
   * @param jobId - Job ID to cancel
   */
  cancel(jobId: string): Promise<void>;
}

interface TranscriptionOptions {
  language: string;         // ISO 639-1 code (e.g., 'en', 'es')
  webhookUrl?: string;      // Optional webhook for async completion
  filterProfanity?: boolean; // Filter profane words (default: false)
  speakerLabels?: boolean;   // Enable speaker diarization (default: true)
}

interface TranscriptionJob {
  jobId: string;            // Vendor-specific job ID
  status: TranscriptionStatus;
}

enum TranscriptionStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface TranscriptionResult {
  status: TranscriptionStatus;
  text?: string;            // Full transcript text
  words?: Word[];           // Word-level timestamps
  vttUrl?: string;          // URL to WebVTT subtitle file
  error?: TranscriptionError;
}

interface Word {
  text: string;             // Word text
  start: number;            // Start time in seconds (0-based)
  end: number;              // End time in seconds
  confidence: number;       // Confidence score (0.0-1.0)
  speaker?: string;         // Speaker label (e.g., 'A', 'B')
}

/**
 * Transcription-specific error codes
 */
enum TranscriptionErrorCode {
  INVALID_FILE = 'INVALID_FILE',           // Audio format not supported
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',       // File exceeds size limit
  LANGUAGE_UNSUPPORTED = 'LANGUAGE_UNSUPPORTED', // Language not supported
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED', // Processing failed (retryable)
  RATE_LIMIT = 'RATE_LIMIT',               // 429 Too Many Requests
  TIMEOUT = 'TIMEOUT',                     // Transcription timeout (>20min)
  SERVER_ERROR = 'SERVER_ERROR',           // 500/503 (retryable)
}

class TranscriptionError extends Error {
  constructor(
    public code: TranscriptionErrorCode,
    public message: string,
    public retryable: boolean,
    public statusCode?: number
  ) {
    super(message);
  }
}
```

**Vendor Mappings:**
- **Primary:** AssemblyAI Universal-2 model
  - Request: `POST /v2/transcript` with `audio_url`, `language_code`, `speaker_labels: true`
  - Response: Webhook payload with `words[]` array containing `{text, start, end, confidence, speaker}`
- **Fallback:** Deepgram Nova-3
  - Request: `POST /v1/listen` with `url`, `language`, `diarize: true`
  - Response: `words[]` with similar structure

**Switchover Conditions:**
- 5 consecutive failures OR p95 latency >5s OR SLA breach (<99.9% uptime)

---

### 3. Composition Adapter

Combines video segments, applies cuts (filler-word removal), adds intro/outro, burns subtitles, and mixes audio.

```typescript
/**
 * Video composition adapter for timeline-based editing
 */
interface CompositionAdapter {
  /**
   * Create video composition job
   * @param params - Composition parameters (timeline, assets, output)
   * @returns Render job ID for polling
   * @throws CompositionError with retryable flag
   */
  compose(params: CompositionParams): Promise<CompositionJob>;

  /**
   * Get render status and result
   * @param renderJobId - Render job ID
   * @returns Current status and output URL if complete
   * @throws CompositionError if render failed
   */
  getRenderStatus(renderJobId: string): Promise<CompositionResult>;

  /**
   * Cancel ongoing render
   * @param renderJobId - Render job ID to cancel
   */
  cancel(renderJobId: string): Promise<void>;
}

interface CompositionParams {
  videoUrl: string;         // URL to raw or matted video
  cutList: TimeRange[];     // Segments to remove (filler words)
  introTemplateId?: string; // Intro template ID (vendor-specific)
  outroTemplateId?: string; // Outro template ID (vendor-specific)
  subtitlesVttUrl?: string; // URL to WebVTT subtitle file
  musicTrackId?: string;    // Music track ID (vendor-specific)
  musicVolume?: number;     // Music volume (0-100, default: 40)
  outputResolution: string; // e.g., '1080x1920' (portrait 9:16)
  outputFps: number;        // e.g., 30
}

interface TimeRange {
  start: number;            // Start time in seconds
  end: number;              // End time in seconds
}

interface CompositionJob {
  renderJobId: string;      // Vendor-specific render job ID
  status: CompositionStatus;
}

enum CompositionStatus {
  QUEUED = 'queued',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface CompositionResult {
  status: CompositionStatus;
  outputUrl?: string;       // URL to rendered video (MP4)
  durationSec?: number;     // Final video duration
  renderTimeSec?: number;   // Time taken to render
  error?: CompositionError;
}

/**
 * Composition-specific error codes
 */
enum CompositionErrorCode {
  INVALID_SOURCE = 'INVALID_SOURCE',       // Source video invalid/corrupted
  INVALID_TIMELINE = 'INVALID_TIMELINE',   // Timeline parameters invalid
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND', // Intro/outro template missing
  COMPOSITION_FAILED = 'COMPOSITION_FAILED', // Rendering failed (retryable)
  RATE_LIMIT = 'RATE_LIMIT',               // 429 Too Many Requests
  TIMEOUT = 'TIMEOUT',                     // Render timeout (>20min)
  SERVER_ERROR = 'SERVER_ERROR',           // 500/503 (retryable)
}

class CompositionError extends Error {
  constructor(
    public code: CompositionErrorCode,
    public message: string,
    public retryable: boolean,
    public statusCode?: number
  ) {
    super(message);
  }
}
```

**Vendor Mappings:**
- **Primary:** Shotstack Edit API
  - Request: `POST /v1/render` with JSON timeline containing video tracks, audio tracks, subtitle overlays
  - Response: Webhook payload with `{ status: 'done', url: <outputUrl> }`
- **Fallback:** Cloudinary Video API
  - Request: URL transformations with `e_trim`, `l_subtitles`, `l_video` (overlay)
  - Response: Transformed video URL

**Switchover Conditions:**
- p95 latency >60s (for 60s clip) OR error rate >3% OR SLA breach

**Cut List Generation (Filler-Word Removal):**
```typescript
/**
 * Generate cut list from transcription words
 * @param words - Word array from TranscriptionResult
 * @returns Time ranges to remove from video
 */
function generateCutList(words: Word[]): TimeRange[] {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'i mean', 'so', 'well', 'actually'];

  return words
    .filter(w =>
      fillerWords.includes(w.text.toLowerCase()) ||
      w.confidence < 0.5 // Low confidence = likely disfluency
    )
    .map(w => ({
      start: Math.max(0, w.start - 0.15),  // 150ms handle before
      end: w.end + 0.15                     // 150ms handle after
    }))
    .reduce(mergeSimilarRanges, []); // Merge overlapping/close ranges
}

/**
 * Merge time ranges that are <0.5s apart
 */
function mergeSimilarRanges(acc: TimeRange[], curr: TimeRange): TimeRange[] {
  if (acc.length === 0) return [curr];

  const last = acc[acc.length - 1];
  if (curr.start - last.end < 0.5) {
    last.end = curr.end; // Merge
    return acc;
  }

  return [...acc, curr];
}
```

---

### 4. Encoding Adapter

Final video encoding to H.264 MP4 with specified bitrate and resolution.

```typescript
/**
 * Video encoding adapter for final output optimization
 */
interface EncodingAdapter {
  /**
   * Encode video to target format
   * @param videoUrl - URL to composed video
   * @param outputParams - Output specifications
   * @returns Encoding job ID for polling
   * @throws EncodingError with retryable flag
   */
  encode(
    videoUrl: string,
    outputParams: EncodingParams
  ): Promise<EncodingJob>;

  /**
   * Get encoded video URL and checksum
   * @param jobId - Encoding job ID
   * @returns Output URL and SHA256 checksum
   * @throws EncodingError if encoding failed
   */
  getEncodedUrl(jobId: string): Promise<EncodingResult>;

  /**
   * Cancel ongoing encoding
   * @param jobId - Encoding job ID to cancel
   */
  cancel(jobId: string): Promise<void>;
}

interface EncodingParams {
  resolution: string;       // e.g., '1080x1920'
  fps: number;              // e.g., 30
  videoBitrate: string;     // e.g., '8M' (8-12 Mbps range)
  audioCodec: string;       // e.g., 'aac'
  audioBitrate: string;     // e.g., '128k'
  format: 'mp4' | 'mov';    // Container format
}

interface EncodingJob {
  jobId: string;            // Vendor-specific encoding job ID
  status: EncodingStatus;
}

enum EncodingStatus {
  QUEUED = 'queued',
  ENCODING = 'encoding',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface EncodingResult {
  status: EncodingStatus;
  url?: string;             // URL to final encoded video
  checksum?: string;        // SHA256 hash for verification
  sizeBytes?: number;       // File size in bytes
  durationSec?: number;     // Final duration
  error?: EncodingError;
}

/**
 * Encoding-specific error codes
 */
enum EncodingErrorCode {
  INVALID_SOURCE = 'INVALID_SOURCE',       // Source video invalid/corrupted
  INVALID_PARAMS = 'INVALID_PARAMS',       // Output parameters invalid
  ENCODING_FAILED = 'ENCODING_FAILED',     // Encoding failed (retryable)
  RATE_LIMIT = 'RATE_LIMIT',               // 429 Too Many Requests
  TIMEOUT = 'TIMEOUT',                     // Encoding timeout
  SERVER_ERROR = 'SERVER_ERROR',           // 500/503 (retryable)
}

class EncodingError extends Error {
  constructor(
    public code: EncodingErrorCode,
    public message: string,
    public retryable: boolean,
    public statusCode?: number
  ) {
    super(message);
  }
}
```

**Vendor Mappings:**
- **Primary:** Mux Video API
  - Request: `POST /video/v1/assets` with `input: [{ url }]`, `playback_policy: ['public']`, `encoding_tier: 'baseline'`
  - Response: Asset ID → poll `GET /video/v1/assets/{id}` → download URL
- **Fallback:** Coconut API
  - Request: `POST /v2/jobs` with `{ input: { url }, outputs: { mp4: { ... } } }`
  - Response: Job status with output URLs

**Switchover Conditions:**
- Cost >$0.10/min OR latency >2× source duration OR quality degradation

**Checksum Verification:**
```typescript
/**
 * Verify downloaded video matches expected checksum
 * @param localPath - Path to downloaded file
 * @param expectedChecksum - SHA256 hash from EncodingResult
 * @returns True if checksums match
 */
async function verifyChecksum(
  localPath: string,
  expectedChecksum: string
): Promise<boolean> {
  const crypto = require('crypto');
  const fs = require('fs');

  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(localPath);

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => {
      const computed = hash.digest('hex');
      resolve(computed === expectedChecksum);
    });
    stream.on('error', reject);
  });
}
```

---

## Retry Strategy

All adapters use exponential backoff for retryable errors:

```typescript
/**
 * Retry API call with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Result from successful attempt
 * @throws Error from last failed attempt
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  const delays = [2000, 4000, 8000]; // 2s, 4s, 8s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable =
        error.retryable === true ||
        [500, 502, 503, 504, 429].includes(error.statusCode);

      if (!isRetryable || isLastAttempt) {
        throw error; // Don't retry non-retryable errors or last attempt
      }

      const delay = delays[attempt];
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry logic exhausted (should not reach here)');
}
```

**Retryable HTTP Status Codes:**
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

**Non-Retryable HTTP Status Codes:**
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `413` - Payload Too Large (file size limit)
- `415` - Unsupported Media Type (invalid format)

---

## Provider Switchover Pattern

Each adapter maintains a circuit breaker to detect failures and switch to fallback providers:

```typescript
/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'closed',     // Normal operation (using primary)
  OPEN = 'open',         // Failed (using fallback)
  HALF_OPEN = 'half_open' // Testing primary recovery
}

/**
 * Circuit breaker for provider switchover
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private threshold: number = 5,        // Failures before opening
    private timeout: number = 60000,      // 60s before half-open
    private successThreshold: number = 3  // Successes before closing
  ) {}

  /**
   * Execute function with circuit breaker protection
   * @param primary - Primary provider function
   * @param fallback - Fallback provider function
   * @returns Result from primary or fallback
   */
  async execute<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout elapsed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log('Circuit breaker entering HALF_OPEN state (testing primary)');
      } else {
        console.log('Circuit breaker OPEN, using fallback');
        return fallback();
      }
    }

    try {
      const result = await primary();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (this.state === CircuitState.OPEN) {
        console.log('Circuit breaker OPEN, retrying with fallback');
        return fallback();
      }

      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log('Circuit breaker CLOSED (primary recovered)');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      console.error(`Circuit breaker OPEN after ${this.failureCount} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
```

**Usage Example:**
```typescript
const transcriptionCircuit = new CircuitBreaker(
  5,      // Open after 5 failures
  60000,  // Wait 60s before testing recovery
  3       // Close after 3 successes
);

const result = await transcriptionCircuit.execute(
  () => assemblyAI.transcribe(uploadId, options),  // Primary
  () => deepgram.transcribe(uploadId, options)     // Fallback
);
```

---

## Implementation Checklist

**UploadAdapter:**
- [ ] Implement resumable multipart upload (tus protocol or native)
- [ ] Add progress callbacks for UI (0-100%)
- [ ] Handle network interruptions with automatic resume
- [ ] Validate file size (<500MB) and format (MP4, MOV) before upload

**TranscriptionAdapter:**
- [ ] Implement AssemblyAI webhook receiver with signature validation
- [ ] Map AssemblyAI `words[]` to neutral `Word` interface
- [ ] Implement Deepgram fallback with same interface
- [ ] Add circuit breaker with 5-failure threshold

**CompositionAdapter:**
- [ ] Build Shotstack JSON timeline from `CompositionParams`
- [ ] Implement filler-word cut list generator
- [ ] Handle intro/outro template IDs (map to Shotstack assets)
- [ ] Implement Cloudinary fallback with URL transformations

**EncodingAdapter:**
- [ ] Implement Mux Video asset creation and polling
- [ ] Add checksum verification after download
- [ ] Implement Coconut fallback
- [ ] Handle bitrate/resolution validation

**General:**
- [ ] All adapters throw typed errors with `retryable` flag
- [ ] All adapters support cancellation via `cancel()` method
- [ ] Circuit breakers log state changes for monitoring
- [ ] Retry logic uses exponential backoff (2s/4s/8s)
- [ ] All timestamps in seconds (not milliseconds)

---

## References

- Plan.md §5.4 (Provider-Agnostic Processing Contract)
- Plan.md §6.2-6.5 (Vendor Strategy & Adapter Specifications)
- vendor-evaluation-2025.md §4.2 (Processing Pipeline Flow)
- vendor-evaluation-2025.md §7 (API Integration Contract & Schema Mapping)
- CLAUDE.md (External API Integration section)
