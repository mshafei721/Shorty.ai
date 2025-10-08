# M2 Pipeline POC Documentation

**Milestone:** M2 Processing Pipeline POC (Nov 4–17, 2025)
**Status:** Complete
**Deliverables:** D1–D8 ✓

## Overview

Provider-agnostic, observable processing pipeline that orchestrates video upload → transcription → NLP → composition → encoding with retries, webhooks, and strong contracts.

## Architecture

```
┌─────────────┐
│   Upload    │──┐
│  (D1)       │  │
└─────────────┘  │
                 ├──► ┌──────────────┐      ┌─────────────┐
┌─────────────┐  │    │ Orchestrator │◄─────┤  Webhooks   │
│ Transcribe  │──┤    │    (D6)      │      │  (events)   │
│  (D2)       │  │    └──────────────┘      └─────────────┘
└─────────────┘  │           │
                 │           │ FSM
┌─────────────┐  │           ▼
│   NLP/      │──┤    ┌──────────────┐
│  Fillers    │  ├───►│  Job State   │
│  (D3)       │  │    │  + Events    │
└─────────────┘  │    └──────────────┘
                 │
┌─────────────┐  │
│ Composition │──┤
│  (D4)       │  │
└─────────────┘  │
                 │
┌─────────────┐  │
│   Encode    │──┘
│  (D5)       │
└─────────────┘
```

**Additional:** D7 (BG-removal stub), D8 (AI script gen)

## Core Components

### D1: Upload Adapter

**Purpose:** Resumable multipart upload with progress tracking and checksum validation.

**API:**
```typescript
const adapter = new UploadAdapter({ baseUrl: 'http://...' });

const { sessionId } = await adapter.startUpload(file, {
  projectId: 'proj-123',
  assetId: 'asset-456',
  bytes: 102400,
  md5: 'abc123...',
});

adapter.onProgress(sessionId, (pct, bytes) => {
  console.log(`${pct}% (${bytes} bytes)`);
});

await adapter.appendChunk(sessionId, chunk, 0);
const result = await adapter.completeUpload(sessionId);
// { objectUrl, etag, md5 }
```

**Features:**
- Chunked uploads (5MB chunks, N=4 parallel)
- Exponential backoff (1s/2s/4s, max 3 retries)
- Final MD5 checksum validation
- Pause/resume/abort support

**Tests:** [pipeline/upload/__tests__/upload.test.ts](../pipeline/upload/__tests__/upload.test.ts)

---

### D2: Transcription Adapter

**Purpose:** Provider-agnostic transcription with primary (AssemblyAI) + fallback (Deepgram), webhook verification, normalized output.

**API:**
```typescript
const service = new TranscriptionService(
  new AssemblyAIAdapter({ apiKey: '...' }),
  new DeepgramAdapter({ apiKey: '...' })
);

const { txId, provider } = await service.requestTranscription(objectUrl, {
  lang: 'en',
  diarize: false,
});

// Poll or wait for webhook
const transcript = await service.fetchTranscript(txId, provider);
// NormalizedTranscript { tokens, words, language, segments }

// Webhook handler
const event = service.handleWebhook(payload, headers, secret);
// { txId, status, provider }
```

**Normalization:**
```typescript
interface NormalizedToken {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
}

interface NormalizedTranscript {
  tokens: NormalizedToken[];
  words: string;
  language: string;
  segments: Array<{ startMs, endMs, text }>;
}
```

**Security:**
- HMAC signature verification (SHA256)
- Replay protection via nonce + timestamp
- Separate secrets per provider

**Tests:** [pipeline/transcribe/__tests__/transcribe.test.ts](../pipeline/transcribe/__tests__/transcribe.test.ts)

---

### D3: Filler Detection (NLP)

**Purpose:** Detect filler words ("um", "uh", "like", "so") and silence gaps with ≥90% precision, ≥85% recall.

**API:**
```typescript
const service = new FillerDetectionService({
  minConfidence: 0.7,
  minSilenceDurationMs: 300,
});

const spans = service.detectFillers(transcript);
// FillerSpan[] { startMs, endMs, tokenIdxStart, tokenIdxEnd, label: 'filler'|'silence' }

const metrics = service.evaluateMetrics(detected, groundTruth);
// { precision, recall, f1Score, truePositives, falsePositives, falseNegatives }

const { confidence, metrics } = service.tuneThreshold(
  transcript,
  groundTruth,
  0.90, // targetPrecision
  0.85  // targetRecall
);
```

**Features:**
- Pattern matching + confidence thresholds
- Adjacent span merging
- Auto-tuning to meet target metrics

**Fixtures:** [pipeline/fixtures/sample-transcript.json](../pipeline/fixtures/sample-transcript.json), [filler-ground-truth.json](../pipeline/fixtures/filler-ground-truth.json)

**Tests:** [pipeline/nlp/__tests__/nlp.test.ts](../pipeline/nlp/__tests__/nlp.test.ts)

---

### D4: Shotstack Composition

**Purpose:** Generate deterministic timelines with filler cuts, captions, intro/outro.

**API:**
```typescript
const adapter = new ShotstackCompositionAdapter({ apiKey: '...' });

const { timelineId } = await adapter.createTimeline({
  transcript,
  fillers,
  brand: { introUrl: '...', outroUrl: '...' },
  captions: true,
  videoUrl: 'http://...',
});

const { renderId } = await adapter.renderTimeline(timelineId);

const result = await adapter.pollRender(renderId);
// { status: 'queued'|'rendering'|'done'|'failed', artifactUrl?, progress? }
```

**Output:**
- MP4, 1080×1920, 30fps
- Filler segments removed
- Auto-subtitles from segments
- Brand clips prepended/appended

**Tests:** [pipeline/compose/__tests__/compose.test.ts](../pipeline/compose/__tests__/compose.test.ts)

---

### D5: Mux Encoding

**Purpose:** Encode to H.264 delivery format with checksum validation.

**API:**
```typescript
const adapter = new MuxEncodingAdapter({
  tokenId: '...',
  tokenSecret: '...',
});

const { encodeId } = await adapter.submitEncode(srcUrl, {
  codec: 'h264',
  width: 1080,
  height: 1920,
  bitrate: 10000000,
  fps: 30,
});

const result = await adapter.pollEncode(encodeId);
// { status: 'processing'|'ready'|'failed', assetUrl?, checksum?, playbackId? }

const isValid = await adapter.verifyChecksum(assetUrl, expectedChecksum);
```

**Service Wrapper:**
```typescript
const service = new EncodingService(adapter);

const result = await service.encodeAndWait(srcUrl, profile, {
  maxAttempts: 120,
  intervalMs: 5000,
});
```

**Tests:** [pipeline/encode/__tests__/encode.test.ts](../pipeline/encode/__tests__/encode.test.ts)

---

### D6: Job Orchestrator (FSM)

**Purpose:** Idempotent, replay-safe state machine with retries, parallel lanes, and event emission.

**API:**
```typescript
const orchestrator = new JobOrchestrator({
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
});

// Register handlers
orchestrator.registerHandler('upload', uploadHandler);
orchestrator.registerHandler('transcribe', transcribeHandler);
// ... nlp, compose, encode

const job = orchestrator.createJob('proj-123', 'asset-456', 'corr-789');

await orchestrator.executeJob(job.jobId);
// Runs: upload → transcribe → nlp → compose → encode

// Events
orchestrator.on('job.updated', event => {
  console.log(`Progress: ${event.data.progressPct}%`);
});

// Webhooks
orchestrator.handleWebhookEvent({
  jobId: 'job-123',
  stage: 'transcribe',
  status: 'completed',
  data: { transcriptId: 'tx-456' },
});
```

**State Machine:**
```
idle → upload → transcribe → nlp → compose → encode → done
          ↓         ↓          ↓       ↓        ↓
       failed    failed    failed  failed   failed
```

**Retry Policy:**
- Exponential backoff with jitter
- Max 3 retries per stage
- Per-stage attempt counters

**Progress Weights:**
- upload: 15%
- transcribe: 25%
- nlp: 10%
- compose: 25%
- encode: 25%

**Tests:** [pipeline/orchestrator/__tests__/orchestrator.test.ts](../pipeline/orchestrator/__tests__/orchestrator.test.ts)

---

### D7: Background Removal Stub

**Purpose:** Feature-flagged no-op adapter for future Phase 2 integration.

**API:**
```typescript
const adapter = new BackgroundRemovalStub({ enabled: false });

const isEnabled = adapter.isEnabled(); // false

await adapter.removeBackground(videoUrl);
// Throws: "Background removal is disabled via feature flag"
```

**Tests:** [pipeline/adapters/__tests__/background-removal.test.ts](../pipeline/adapters/__tests__/background-removal.test.ts)

---

### D8: AI Script Generation

**Purpose:** Generate scripts with moderation, primary (GPT-4o) + fallback (Claude).

**API:**
```typescript
const service = new AIScriptService(
  new OpenAIProvider({ apiKey: '...' }),
  new AnthropicProvider({ apiKey: '...' })
);

const result = await service.moderateAndGenerate({
  topic: 'How to create viral videos',
  description: 'Focus on TikTok tips',
  targetWords: 200,
  niche: 'content-creation',
});

// ScriptGenerationResult {
//   script: string,
//   outline: string[],
//   beats: Array<{ title, content }>,
//   wordCount: number,
//   promptHash: string  // No PII logged
// }
```

**Moderation:**
- OpenAI moderation API (hate, violence, sexual, etc.)
- Blocks unsafe content before generation
- Logs prompt hashes, NOT raw text

**Tests:** [pipeline/adapters/__tests__/ai-script.test.ts](../pipeline/adapters/__tests__/ai-script.test.ts)

---

## CLI Usage

**Environment:**
```bash
export UPLOAD_BASE_URL=http://localhost:3000
export ASSEMBLYAI_API_KEY=...
export DEEPGRAM_API_KEY=...
export SHOTSTACK_API_KEY=...
export MUX_TOKEN_ID=...
export MUX_TOKEN_SECRET=...
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
```

**Commands:**
```bash
# Upload only
node pipeline/cli/index.ts upload ./video.mp4 --project=proj-123 --asset=asset-456

# Full pipeline
node pipeline/cli/index.ts run ./video.mp4 --watch

# Resume job
node pipeline/cli/index.ts run --job=job-123 --watch

# Inspect job
node pipeline/cli/index.ts dump --job=job-123 --stages

# Generate script
node pipeline/cli/index.ts generate-script "How to go viral" --description="TikTok tips"
```

---

## Testing

**Unit Tests:**
```bash
npm test -- pipeline/upload
npm test -- pipeline/transcribe
npm test -- pipeline/nlp
npm test -- pipeline/compose
npm test -- pipeline/encode
npm test -- pipeline/orchestrator
```

**Integration Tests:**
```bash
npm test -- pipeline/__tests__/integration.test.ts
```

**Coverage Targets:**
- New modules: ≥85% lines/branches
- Overall project: unchanged or improved

**Run All:**
```bash
npm test
npm run typecheck
npm run lint
```

---

## Observability

**Metrics:**
- `latency_ms` per stage
- `retries` count
- `error_rate`
- `bytes_uploaded`
- `webhook_delivery_latency_ms`

**Logs:**
Structured JSON with:
```json
{
  "correlationId": "corr-789",
  "jobId": "job-123",
  "stage": "transcribe",
  "provider": "assemblyai",
  "level": "info",
  "message": "Transcription completed"
}
```

**Tracing:**
- Propagate `traceId` across adapters
- Compatible with OpenTelemetry

---

## Security

**Secrets:**
- Env-based configuration
- No secrets in logs

**PII:**
- NO raw transcripts stored
- Only hashes and redacted excerpts
- Prompt hashes for telemetry, not full prompts

**Webhooks:**
- HMAC verification required
- Timestamp skew checks (±5min)
- 2xx on success, 4xx/5xx with retry headers

---

## Known Limitations (POC Scope)

1. **No persistent job store:** In-memory only (production requires DB)
2. **No distributed orchestration:** Single-node only
3. **Polling-based:** Some stages poll instead of pure webhooks
4. **Basic filler detection:** Rule-based, not ML
5. **No authentication:** Adapters use raw API keys

---

## Next Steps (M3)

- Integrate with Expo app recording outputs
- Wire orchestrator to React Context
- Add job persistence (AsyncStorage or backend)
- Implement preview screen with polling UI
- Add telemetry hooks for KPIs

---

**Maintainer:** BEI
**Last Updated:** 2025-11-17
**Version:** 0.2.0
