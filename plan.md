# Shorty.ai MVP Delivery Plan

**Version:** 1.0
**Last Updated:** 2025-10-05
**Status:** Draft for Engineering Review

---

## 1. Title & Scope

**Shorty.ai** is an Expo Go–compatible mobile app that enables niche-focused creators to produce polished short-form videos (9:16 vertical, ≤120s) through a guided pipeline: onboard by niche → create projects → script (AI or paste) → record with teleprompter → apply server-side automated edits → preview → export via native share.

### MVP Scope (What Done Looks Like)

- ✅ **Onboarding:** Niche/sub-niche selection with AsyncStorage persistence
- ✅ **Projects:** Unlimited projects (CRUD with soft delete), dashboard with video grid
- ✅ **Scripting:** AI generation (GPT-4o + moderation) OR manual paste (20-500 words)
- ✅ **Recording:** Portrait 1080x1920@30fps, ≤120s auto-stop, storage checks (≥500MB free)
- ✅ **Teleprompter:** 0.55 opacity overlay, WPM 80-200 (default 140), font sizes S/M/L, highlight current line
- ✅ **Processing Pipeline:** Upload → Transcription (AssemblyAI) → Filler-word removal → Intro/Outro → Composition (Shotstack) → Encoding (Mux)
- ✅ **Preview & Export:** Expo AV player, native share sheet (iOS/Android), fallback to local save
- ✅ **Error Handling:** Permissions denied, offline mode, storage warnings, processing failures with retry
- ✅ **Local-only Storage:** All videos/metadata on-device (FileSystem + AsyncStorage); no cloud backup

### Explicit Non-Goals

- ❌ User accounts, auth, cloud sync
- ❌ Social features (feeds, comments, collaboration)
- ❌ Custom native modules or on-device heavy processing
- ❌ Manual timeline editing
- ❌ Background removal (deferred to Phase 2 due to cost)
- ❌ Background music (deferred pending user demand)
- ❌ Analytics backend or CRM

### Success Definition

End-to-end video creation (script → export) in **<10 minutes**, with **≥70% completion rate** from recording to processed preview across test users.

---

## 2. Objectives & KPIs

### Primary Success Metrics (Client-Side Only)

| KPI | Target | Measurement Method |
|-----|--------|-------------------|
| **Time-to-First-Export** | <10 min (median) | Track timestamps: `script_completed` → `export_success` |
| **Completion Rate** | ≥70% | (recordings with `export_success`) / (total recordings started) |
| **Processing Success Rate** | ≥90% | (`processing_complete`) / (`processing_started`) |
| **Export Success Rate** | ≥95% | (`export_success`) / (`export_initiated`) |
| **Feature Opt-In Rate** | Track by feature | % users enabling subtitles, filler-removal, intro/outro |
| **Cancellation Rate** | <15% | (`processing_cancelled`) / (`processing_started`) |
| **App Crashes** | <5% | Sessions with crash / total sessions |
| **Warm Start Time** | <2s | App foreground → UI interactive (iPhone 12, Pixel 5) |
| **Cold Start Time** | <4s | App launch → onboarding/home screen visible |

**Instrumentation:** Store events locally in `AsyncStorage.analytics` with 30-day rotation. Optional telemetry toggle (default OFF) in Settings.

**Funnel Events:**
```
script_completed → record_started → record_completed → processing_started → processing_completed → export_initiated → export_success/failed
```

---

## 3. Milestones & Timeline

**Total Duration:** 10 weeks (MVP delivery)
**Start Date:** Week of 2025-10-07
**Target Launch:** Week of 2025-12-16 (Beta)

| Milestone | Dates | Entry Criteria | Exit Criteria | Demoable Outcome |
|-----------|-------|----------------|---------------|------------------|
| **M0: Foundations** | Week 1-2<br>(Oct 7-20) | Repo initialized, team access, vendor POC credits | Expo project running, navigation stacks, AsyncStorage schema, API contracts defined | Navigate: Onboarding → Projects → Script → Record (stub) |
| **M1: Recording + Teleprompter** | Week 3-4<br>(Oct 21-Nov 3) | M0 complete, Camera permissions UX designed | Working camera capture @1080x1920, teleprompter overlay functional, raw video saved to FileSystem | Record 30s video with teleprompter, save locally, play back |
| **M2: Processing Pipeline POC** | Week 5-6<br>(Nov 4-17) | M1 complete, vendor API keys secured, webhook endpoint live | Upload → AssemblyAI transcription → cut-list generation → Shotstack composition → download validated | Upload test clip, get transcribed subtitles, apply 1 filler-word cut, download result |
| **M3: Feature Selection & Preview** | Week 7<br>(Nov 18-24) | M2 complete, feature toggle UI designed | Feature selection screen functional, processing job state machine working, preview player with controls | Select features → submit → show processing status → play processed video |
| **M4: Export & Reliability** | Week 8<br>(Nov 25-Dec 1) | M3 complete, share API tested on iOS/Android | Native share sheet working, offline mode handling, error states polished, retry logic functional | Export video to Instagram/TikTok via share sheet, handle network failures gracefully |
| **M5: Beta Hardening** | Week 9-10<br>(Dec 2-15) | M4 complete, manual test plan executed | All acceptance criteria met, <5% crash rate, ≥90% processing success, docs complete | Full walkthrough: onboard → create project → script → record → process → export (3 test niches) |

---

## 4. Workstreams & Ownership (RACI)

| Workstream | Description | Responsible | Accountable | Consulted | Informed |
|------------|-------------|-------------|-------------|-----------|----------|
| **(A) App Framework & Navigation** | Expo setup, navigation stacks, deep links, splash → onboarding → main tabs | **FE Lead** | PM | Design | QA |
| **(B) Capture & Teleprompter** | Camera permissions, 1080x1920 recording, teleprompter overlay (opacity, WPM, font), countdown | **FE Dev 1** | FE Lead | Design | QA |
| **(C) Local Storage & Data Model** | AsyncStorage schema (projects, scripts, videos), FileSystem paths (raw/processed), migration logic | **FE Dev 2** | FE Lead | Backend Integrator | QA |
| **(D) External Processing Adapters** | Upload/poll/download adapter, AssemblyAI/Shotstack/Mux integration, filler-word logic, retry/backoff | **Backend Integrator** | Eng Lead | QA, Legal (DPA) | PM |
| **(E) UI/UX & Accessibility** | Design system, empty states, error messaging, a11y (VoiceOver labels, contrast, font scaling) | **Designer** | PM | FE Lead | QA |
| **(F) QA & Release** | Test plan execution, device matrix, regression suite, beta distribution (TestFlight/Expo) | **QA Lead** | Eng Lead | All devs | PM |
| **(G) Observability & Metrics** | Local analytics schema, event tracking, crash reporting (Sentry), cost monitoring | **Backend Integrator** | Eng Lead | PM | QA |

**Team Composition:**
- 1 × Engineering Lead (backend/mobile)
- 2 × Frontend Developers (React Native/Expo)
- 1 × Backend Integrator (API orchestration, webhooks)
- 1 × Product Designer (UI/UX)
- 1 × QA Lead (manual + device testing)
- 1 × Product Manager (scope/priorities)

---

## 5. Architecture Overview

### 5.1 Screen Flow

```
Onboarding Stack:
  Splash → Niche Selection → Sub-niche Confirmation

Main Tab/Stack:
  Projects List (home)
    ↓
  Project Dashboard (per project)
    ↓ [Tap +]
  Create Flow Modal Stack:
    Script Screen (AI or Paste) → Record → Feature Selection → Processing Status → Preview → Export

Settings: Telemetry toggle, storage info, app version, support link

Deep Link: shortyai://project/{id}
```

### 5.2 State Machines

**Recording State Machine:**
```
Idle → [Tap Record] → Countdown → Recording ↔ Paused → Reviewing → ReadyForFeatures
- Auto-stop at 120s → Reviewing
- Error (permissions/storage) → ErrorState
```

**Teleprompter State Machine:**
```
Hidden → [Script available] → VisiblePaused → [Start] → Scrolling ↔ [Pause] → VisiblePaused
- Reaches end → Completed → [Restart] → Scrolling
- Overlay error → Hidden (fallback to static script)
```

**Processing Job State Machine:**
```
Idle → [Submit features] → Uploading → Queued → Processing → Complete/Failed/Cancelled
- Upload failure → Failed (retry option)
- Timeout (20 min) → Failed (timeout code)
- Cancel request → Cancelled (clean up server job if supported)
```

### 5.3 Local Storage Layout

**AsyncStorage Keys:**
- `projects`: `Array<Project>` (with `isDeleted` for soft delete)
- `scripts`: `Array<Script>` (source: 'ai' | 'manual')
- `videos`: `Array<VideoAsset>` (type: 'raw' | 'processed', status: 'ready' | 'processing' | 'failed' | 'cancelled')
- `analytics`: Local event counters (rotated every 30 days)
- `userProfile`: Onboarding niche/sub-niche selection
- `appStateVersion`: Schema version for migrations

**FileSystem Paths:**
```
FileSystem.documentDirectory/
  videos/
    raw/{projectId}/{timestamp}.mp4
    processed/{videoId}_{timestamp}.mp4
    temp/{videoId}.mp4 (deleted post-upload)
```

**File Naming:**
- Raw: `raw_{projectId}_{timestamp}.mp4`
- Processed: `processed_{videoId}_{timestamp}.mp4`

### 5.4 Provider-Agnostic Processing Contract

**Client → Backend Adapter Interface:**
```typescript
// Neutral schema (client-side)
interface ProcessingJob {
  id: string; // uuid
  videoId: string;
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';
  progress: number; // 0-100
  requestedFeatures: {
    subtitles: boolean;
    fillerWordRemoval: boolean;
    backgroundChange: { enabled: boolean; presetId: string | null };
    backgroundMusic: { enabled: boolean; trackId: string | null; volume: number };
    introOutro: { enabled: boolean; templateId: string | null };
  };
  createdAt: string; // ISO8601
  startedAt: string | null;
  completedAt: string | null;
  error: { code: string; message: string; retryable: boolean } | null;
  retries: number;
  outputs: {
    transcriptUrl: string | null;
    processedVideoUrl: string | null;
    checksum: string | null;
  } | null;
}
```

**Backend Workflow (Provider-Agnostic):**
1. **Upload:** POST multipart to backend → pre-signed URL → vendor storage
2. **Create Job:** POST /jobs with feature flags → backend orchestrates:
   - Parallel: AssemblyAI transcription + Cutout.Pro matting (if enabled)
   - Sequential: Filler-word detection → Shotstack composition → Mux encoding
3. **Poll Status:** GET /jobs/{jobId} every 2000ms, max 20 min (600 attempts)
4. **Download:** GET /downloads/{jobId} → verify checksum → save to processed/
5. **Retry/Backoff:** On 500/503: 2s → 4s → 8s (max 3 attempts)

### 5.5 Expo Modules & Constraints

**Allowed Modules:**
- `expo-camera` (recording)
- `expo-av` (preview playback)
- `expo-file-system` (local storage)
- `expo-sharing` (native share sheet)
- `expo-media-library` (export fallback)
- `expo-permissions` (camera/mic consent)
- `expo-haptics` (tactile feedback)
- `expo-clipboard` (copy script)
- `expo-constants` (app version)
- `expo-network` (connectivity checks)

**State Management:** React Context or Redux Toolkit (JS only, no native bindings)

**Constraints:**
- ❌ No custom native modules
- ❌ No on-device heavy video processing
- ❌ No WebSockets (REST + polling only)
- ⚠️ Background tasks limited (processing must run while app active; persist state if backgrounded)

---

## 6. External API Strategy (Primary/Fallback, SLAs, Switchovers)

### 6.1 Vendor Matrix with SLA Targets

| Capability | Primary | Fallback | Expected Latency | SLA Uptime | Cost Envelope (1k clips/mo) | Switchover Predicate |
|------------|---------|----------|------------------|------------|----------------------------|----------------------|
| **AI Script Generation** | OpenAI GPT-4o | Anthropic Claude 3.7 Sonnet | <5s (p95) | N/A (best-effort) | $3.01/mo | p95 >5s OR error rate >3% |
| **Content Moderation** | Moderation API | Azure Content Moderator | <2s | N/A | $3.50/mo | False positive >10% OR latency >2s |
| **Transcription & Subtitles** | AssemblyAI | Deepgram Nova-3 | <5s p95 for 90s clip | **99.9%** | $22.50/mo | SLA breach (<99.9%) OR error rate >2% |
| **Video Composition** | Shotstack | Cloudinary Video API | <60s p95 for 60s clip | **SLA included** | $300/mo | p95 >60s OR error rate >3% |
| **Video Encoding** | Mux Video | Coconut | <2× source duration | N/A | $30/mo | Cost >$0.10/min OR latency >2× source |
| **Background Removal** | Cutout.Pro | Unscreen API | <90s p95 | N/A | **$28.5k/mo (DEFERRED)** | Segmentation quality IoU <0.85 |
| **Music Generation** | Mubert API | Soundraw API | <10s | N/A | **$500/mo (DEFERRED)** | Generation failure >5% |

### 6.2 Adapter Interface Specification

**Upload Adapter:**
```typescript
interface UploadAdapter {
  upload(file: File, metadata: VideoMetadata): Promise<{ uploadId: string; expiresInSec: number }>;
  // Errors: 413 (file too large), 415 (unsupported format), 500 (server error)
}
```

**Transcription Adapter:**
```typescript
interface TranscriptionAdapter {
  transcribe(uploadId: string, options: { language: string; webhookUrl: string }): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<TranscriptionResult>;
  // TranscriptionResult: { status, words: Array<{ text, start, end, confidence, speaker }>, vttUrl }
}
```

**Composition Adapter:**
```typescript
interface CompositionAdapter {
  compose(params: {
    videoUrl: string;
    cutList: Array<{ start: number; end: number }>; // filler-word segments to remove
    introTemplateId?: string;
    outroTemplateId?: string;
    subtitlesVttUrl?: string;
    musicTrackId?: string;
    musicVolume?: number;
  }): Promise<{ renderJobId: string }>;
  getRenderStatus(renderJobId: string): Promise<{ status: string; outputUrl?: string }>;
}
```

**Encoding Adapter:**
```typescript
interface EncodingAdapter {
  encode(videoUrl: string, outputParams: { resolution: string; fps: number; bitrate: string }): Promise<{ jobId: string }>;
  getEncodedUrl(jobId: string): Promise<{ url: string; checksum: string }>;
}
```

### 6.3 Fallback & Retry Logic

**Circuit Breaker Pattern (Example: AssemblyAI → Deepgram):**
```typescript
// Trigger switchover after 5 consecutive failures OR SLA breach
let failureCount = 0;
const FAILURE_THRESHOLD = 5;

async function transcribeWithFallback(uploadId: string) {
  try {
    const result = await assemblyAI.transcribe(uploadId);
    failureCount = 0; // Reset on success
    return result;
  } catch (error) {
    failureCount++;

    if (failureCount >= FAILURE_THRESHOLD || isSLABreach()) {
      console.warn('Switching to Deepgram fallback');
      return await deepgram.transcribe(uploadId);
    }

    throw error; // Propagate if threshold not met
  }
}
```

**Exponential Backoff (Retries for 500/503):**
```typescript
const delays = [2000, 4000, 8000]; // 2s, 4s, 8s
for (let i = 0; i < 3; i++) {
  try {
    return await apiCall();
  } catch (error) {
    if (![500, 502, 503, 504].includes(error.status) || i === 2) throw error;
    await new Promise(resolve => setTimeout(resolve, delays[i]));
    job.retries = i + 1;
  }
}
```

### 6.4 Cost Monitoring & Alerts

**Budget Thresholds (1,000 clips/month):**
- **Script Generation + Moderation:** $6.51/mo (~$0.01 per script)
- **Transcription:** $22.50/mo ($0.015 per min)
- **Composition + Encoding:** $330/mo (~$0.33 per clip)
- **Total MVP Phase 1:** ~$359/mo ($0.36 per clip)

**Alert Rules:**
- Cost exceeds $500/mo → Notify PM/Eng Lead
- Per-clip cost >$0.50 → Investigate pricing anomaly
- Background removal enabled → Block (deferred to Phase 2 unless negotiated <$10/min)

### 6.5 Provider Quotas & Rate Limits

| Provider | Rate Limit | File Size Limit | Concurrency | Notes |
|----------|-----------|-----------------|-------------|-------|
| **OpenAI GPT-4o** | 500-30k RPM (tier-based) | N/A (text) | Auto-scales | 128k token context |
| **AssemblyAI** | No explicit limit | None stated | Not specified | 99.9% SLA |
| **Shotstack** | Per-plan quotas | Not specified | Tiered | Use Ingest API for cross-region speed |
| **Mux Video** | Not specified | 500MB+ supported | Auto-scales | Fastest publish claim |
| **Cutout.Pro** | 1000 images batch | 2GB per video | Not specified | 24h auto-delete |

**Mitigation for Rate Limits:**
- Queue jobs during rate limit errors (BullMQ or in-memory queue)
- Negotiate higher limits at 10k clips/month milestone
- Distribute load across multiple API keys if needed

---

## 7. Backlog Breakdown (Epics → Tickets)

### Epic A: App Framework & Navigation

#### Ticket A1: Initialize Expo Project
**Goal:** Set up Expo SDK 50 managed workflow with TypeScript, navigation, and AsyncStorage.

**Acceptance Criteria:**
- GIVEN Expo CLI installed
- WHEN `expo init shorty-ai --template expo-template-blank-typescript`
- THEN project runs on iOS Simulator and Android Emulator
- AND React Navigation v6 installed (stack + tab navigators)
- AND AsyncStorage configured with schema versioning (`appStateVersion: 1`)

**Dependencies:** None
**Estimate:** 4 hours
**Test Notes:** Run `expo start`, verify app loads on both platforms; check AsyncStorage persistence with dummy data.

---

#### Ticket A2: Onboarding Flow (Niche Selection)
**Goal:** Implement niche/sub-niche selection with local persistence.

**Acceptance Criteria:**
- GIVEN first-time user launches app
- WHEN onboarding screen loads
- THEN user sees niche dropdown/searchable list (Healthcare, Finance, Fitness, etc.)
- WHEN user selects niche
- THEN sub-niche picker appears (e.g., Healthcare → Physiotherapy, Cardiology)
- WHEN user confirms selection
- THEN save to `AsyncStorage.userProfile` and navigate to Projects List
- AND show success toast "Welcome to Shorty.ai!"

**Dependencies:** A1
**Estimate:** 8 hours
**Test Notes:** Test with 3 niches × 3 sub-niches; verify persistence across app restarts.

---

#### Ticket A3: Projects List & CRUD
**Goal:** Display projects grid/list with create, edit, delete (soft delete) functionality.

**Acceptance Criteria:**
- GIVEN user on Projects List
- WHEN no projects exist
- THEN show empty state: "No projects yet. Tap + to create."
- WHEN user taps "Create Project"
- THEN show form: Project Name (required), Niche/Sub-niche (pre-filled from profile, editable), Confirm
- WHEN user submits valid form
- THEN save to `AsyncStorage.projects` with `{ id: uuid, name, niche, subNiche, createdAt, updatedAt, isDeleted: false }`
- AND new project appears at top sorted by `updatedAt DESC`
- WHEN user long-presses project
- THEN show options: Edit, Delete
- WHEN user deletes
- THEN set `isDeleted: true` (soft delete) and hide from list

**Dependencies:** A2
**Estimate:** 12 hours
**Test Notes:** Create 5 projects, edit 2, delete 1; verify sort order and soft delete flag.

---

#### Ticket A4: Project Dashboard & Deep Links
**Goal:** Display video thumbnails grid for selected project; support deep link navigation.

**Acceptance Criteria:**
- GIVEN user taps on a project
- WHEN project has no videos
- THEN show empty state with centered + button
- WHEN project has processed videos
- THEN show grid of thumbnails with duration badges
- AND hide raw videos unless processing failed
- WHEN user opens `shortyai://project/{id}` deep link
- THEN navigate directly to Project Dashboard for that project
- AND handle invalid project IDs gracefully (show error, redirect to Projects List)

**Dependencies:** A3
**Estimate:** 10 hours
**Test Notes:** Deep link test on iOS (Universal Links) and Android (App Links); verify thumbnail generation from processed videos.

---

### Epic B: Capture & Teleprompter

#### Ticket B1: Camera Permissions & Error States
**Goal:** Request camera/mic permissions with graceful error handling.

**Acceptance Criteria:**
- GIVEN user navigates to Record screen
- WHEN permissions not granted
- THEN show modal: "Camera and microphone access required. Enable in Settings."
- AND provide "Cancel" and "Open Settings" buttons
- WHEN user denies permissions
- THEN block recording and show persistent banner
- WHEN user grants permissions
- THEN initialize camera and proceed to recording UI

**Dependencies:** A4
**Estimate:** 6 hours
**Test Notes:** Test on iOS (Settings deep link via `Linking.openURL`) and Android (Permissions API).

---

#### Ticket B2: Portrait Video Capture (1080x1920, 30fps, ≤120s)
**Goal:** Implement video recording with constraints and storage checks.

**Acceptance Criteria:**
- GIVEN user on Record screen with permissions granted
- WHEN user taps Record
- THEN show 3-2-1 countdown overlay
- AND start recording at 1080x1920 portrait, 30fps, AAC audio 44.1kHz
- WHEN recording reaches 120s
- THEN auto-stop and save to `raw/{projectId}/{timestamp}.mp4`
- WHEN free storage <500MB before recording
- THEN show banner "Storage low. Free up space before recording." with "Manage Storage" button
- AND block recording until space freed
- WHEN recording completes
- THEN save `VideoAsset` to AsyncStorage with `{ id, projectId, type: 'raw', localUri, durationSec, sizeBytes, createdAt, status: 'ready' }`

**Dependencies:** B1
**Estimate:** 16 hours
**Test Notes:** Record 30s, 60s, 120s clips; verify auto-stop; simulate low storage (fill device manually).

---

#### Ticket B3: Teleprompter Overlay (Opacity, WPM, Font Size)
**Goal:** Overlay teleprompter with adjustable settings and sync with recording.

**Acceptance Criteria:**
- GIVEN user has script text (≥20 words)
- WHEN Record screen loads
- THEN teleprompter overlay appears at 55% opacity, occupying lower 60% of screen
- AND current sentence highlighted at 80% brightness, upcoming 50%, past 30%
- WHEN user adjusts WPM slider (80-200, default 140)
- THEN scroll speed updates in real-time
- AND estimated duration updates (words ÷ WPM × 60)
- WHEN user taps font size toggle (S/M/L)
- THEN text renders at 14pt/18pt/22pt respectively
- WHEN user taps Play
- THEN teleprompter scrolls from top, synced with recording start
- WHEN user taps Pause
- THEN scrolling stops, overlay dims to 40% opacity
- WHEN user taps Resume
- THEN scrolling resumes at exact position
- WHEN script empty
- THEN hide teleprompter, show message "Add script to enable teleprompter."

**Dependencies:** B2
**Estimate:** 20 hours
**Test Notes:** Test with 50, 150, 300 word scripts at WPM 80, 140, 200; verify sync with countdown; test pause/resume.

---

#### Ticket B4: Recording State Machine & Controls
**Goal:** Implement state transitions: Idle → Countdown → Recording ↔ Paused → Reviewing.

**Acceptance Criteria:**
- GIVEN recording state machine initialized
- WHEN user taps Record (Idle state)
- THEN transition to Countdown → Recording
- WHEN user taps Pause (Recording state)
- THEN transition to Paused (video paused, teleprompter dims)
- WHEN user taps Resume (Paused state)
- THEN transition to Recording (video resumes, teleprompter continues)
- WHEN user taps Stop OR 120s auto-stop
- THEN transition to Reviewing (show raw preview with Accept/Retake buttons)
- WHEN user taps Retake
- THEN transition to Countdown (overwrite raw video with confirmation)
- WHEN user taps Accept
- THEN transition to ReadyForFeatures (navigate to Feature Selection)
- WHEN error occurs (permissions revoked, storage full)
- THEN transition to ErrorState (show message, offer retry)

**Dependencies:** B3
**Estimate:** 12 hours
**Test Notes:** Walk through all state transitions; simulate errors (revoke permissions mid-recording, fill storage during recording).

---

### Epic C: Local Storage & Data Model

#### Ticket C1: AsyncStorage Schema & Migrations
**Goal:** Define data schemas with versioning for future migrations.

**Acceptance Criteria:**
- GIVEN AsyncStorage keys defined
- WHEN app first launches
- THEN initialize schema version `appStateVersion: 1`
- AND create empty arrays: `projects: []`, `scripts: []`, `videos: []`, `analytics: {}`
- WHEN schema version changes in future release
- THEN run migration script (e.g., add new field `isDeleted` to projects)
- AND increment `appStateVersion`
- WHEN migration fails
- THEN log error, rollback to previous schema, notify user

**Dependencies:** A1
**Estimate:** 8 hours
**Test Notes:** Simulate upgrade from v1 to v2 schema; verify rollback on migration failure.

---

#### Ticket C2: FileSystem Paths & File Management
**Goal:** Organize video files in structured directories with cleanup logic.

**Acceptance Criteria:**
- GIVEN FileSystem paths defined
- WHEN raw video saved
- THEN create directory `videos/raw/{projectId}/` if not exists
- AND save as `raw_{projectId}_{timestamp}.mp4`
- WHEN processed video downloaded
- THEN save to `videos/processed/` as `processed_{videoId}_{timestamp}.mp4`
- WHEN temp upload file created
- THEN save to `videos/temp/{videoId}.mp4`
- AND delete after successful upload confirmation
- WHEN user deletes project (soft delete)
- THEN optionally delete associated videos (show confirmation: "Delete 5 videos permanently?")
- WHEN user cancels processing
- THEN show option: "Keep raw video" or "Discard raw video"

**Dependencies:** C1
**Estimate:** 10 hours
**Test Notes:** Create/delete videos across 3 projects; verify directory structure; test temp file cleanup.

---

#### Ticket C3: Video Metadata CRUD & Query Utilities
**Goal:** Provide helpers to read/write video metadata from AsyncStorage.

**Acceptance Criteria:**
- GIVEN video metadata utilities
- WHEN creating new video
- THEN append to `AsyncStorage.videos` with unique `id` (uuid)
- WHEN querying videos by project
- THEN filter `videos.filter(v => v.projectId === id && !v.isDeleted)`
- WHEN updating video status (e.g., processing → complete)
- THEN mutate in-place and save back to AsyncStorage
- WHEN deleting video
- THEN remove from array and optionally delete file from FileSystem

**Dependencies:** C2
**Estimate:** 6 hours
**Test Notes:** Unit tests for CRUD operations; verify query filters (by project, by type, by status).

---

### Epic D: External Processing Adapters

#### Ticket D1: Upload Adapter (Resumable Multipart)
**Goal:** Implement resumable upload to backend with progress tracking.

**Acceptance Criteria:**
- GIVEN raw video file (≤500MB)
- WHEN user submits for processing
- THEN upload via multipart/form-data to backend `POST /uploads`
- AND send metadata: `{ videoId, projectId, durationSec }`
- WHEN upload interrupted (network loss)
- THEN resume from last byte (using Range headers or tus protocol)
- WHEN upload progress updates
- THEN emit events (0-100%) to update UI
- WHEN upload succeeds
- THEN receive `{ uploadId, expiresInSec }` and transition to Queued state
- WHEN upload fails (413, 415, 500)
- THEN show error with retry button (max 3 attempts, exponential backoff)

**Dependencies:** C3
**Estimate:** 14 hours
**Test Notes:** Upload 80MB file on throttled 4G (10 Mbps); interrupt network mid-upload, verify resume.

---

#### Ticket D2: AssemblyAI Transcription Adapter
**Goal:** Integrate AssemblyAI for word-level transcription with fallback to Deepgram.

**Acceptance Criteria:**
- GIVEN uploadId from D1
- WHEN backend calls AssemblyAI `POST /v2/transcript`
- THEN submit: `{ audio_url, language_code: 'en', speaker_labels: true, webhook_url }`
- WHEN webhook received
- THEN parse `words` array: `{ text, start, end, confidence, speaker }`
- AND generate VTT file for subtitles
- WHEN AssemblyAI fails (5 consecutive errors OR SLA breach)
- THEN auto-switch to Deepgram Nova-3 fallback
- AND log switchover event
- WHEN transcription completes
- THEN save `transcriptUrl` to job outputs and proceed to filler-word detection

**Dependencies:** D1
**Estimate:** 12 hours
**Test Notes:** POC with 30s/60s/120s clips; verify word-level timestamps accuracy; simulate AssemblyAI failure to test Deepgram fallback.

---

#### Ticket D3: Filler-Word Detection & Cut-List Generation
**Goal:** Detect filler words (um, uh, like) and generate time ranges to remove.

**Acceptance Criteria:**
- GIVEN transcription result with word-level timestamps
- WHEN backend processes words array
- THEN filter by dictionary: `['um', 'uh', 'like', 'you know', 'i mean', 'so', 'well', 'actually']`
- AND filter by confidence <0.5 (likely disfluencies)
- WHEN filler word detected
- THEN add to cut-list: `{ start: word.start/1000 - 0.15, end: word.end/1000 + 0.15 }` (preserve 0.3s handles)
- WHEN cut-list generated
- THEN validate no overlapping ranges (merge if <0.5s apart)
- AND return to composition adapter

**Dependencies:** D2
**Estimate:** 10 hours
**Test Notes:** Manual review of 5 test clips with heavy filler words; precision >90%, recall >85%.

---

#### Ticket D4: Shotstack Composition Adapter
**Goal:** Integrate Shotstack for video composition (cuts, intro/outro, subtitles).

**Acceptance Criteria:**
- GIVEN cut-list, intro/outro template IDs, VTT subtitles
- WHEN backend calls Shotstack `POST /v1/render`
- THEN submit JSON timeline with:
  - Video track: matted video (or raw if no BG removal) with trim/cuts applied
  - Intro/outro clips at start/end
  - Subtitle track (burn-in from VTT)
  - Audio track (music if enabled, volume 0.4-0.8)
- WHEN Shotstack webhook received
- THEN parse `{ status: 'done', url: <outputUrl> }` or `{ status: 'failed', error }`
- WHEN render complete
- THEN save `processedVideoUrl` to job outputs and proceed to encoding
- WHEN Shotstack fails (p95 latency >60s OR error rate >3%)
- THEN switch to Cloudinary fallback
- AND log switchover event

**Dependencies:** D3
**Estimate:** 16 hours
**Test Notes:** Render 3 test clips with different feature combos (subtitles only, subtitles + intro/outro, subtitles + cuts); verify output 1080x1920 MP4.

---

#### Ticket D5: Mux Encoding Adapter
**Goal:** Integrate Mux for final H.264 encoding at 8-12 Mbps.

**Acceptance Criteria:**
- GIVEN processed video URL from Shotstack
- WHEN backend calls Mux encoding API
- THEN encode to: `{ format: 'mp4', codec: 'H.264', resolution: '1080x1920', fps: 30, bitrate: '8-12 Mbps', audio: 'AAC 128 kbps' }`
- WHEN encoding completes
- THEN return `{ encodedUrl, checksum }` (SHA256)
- WHEN backend downloads encoded video
- THEN verify checksum matches (retry up to 2 times on mismatch)
- AND save to mobile client's `processed/` directory
- WHEN Mux cost exceeds $0.10/min OR latency >2× source duration
- THEN switch to Coconut fallback

**Dependencies:** D4
**Estimate:** 10 hours
**Test Notes:** Encode 60s clip; verify bitrate 8-12 Mbps, plays on iOS/Android native players; test checksum verification.

---

#### Ticket D6: Job Orchestration & State Machine
**Goal:** Coordinate parallel/sequential API calls with state transitions.

**Acceptance Criteria:**
- GIVEN processing job submitted
- WHEN state is Uploading
- THEN call D1 upload adapter → transition to Queued on success
- WHEN state is Queued
- THEN call D2 transcription (AssemblyAI) in parallel with D7 background removal (if enabled)
- WHEN transcription completes
- THEN call D3 filler-word detection → proceed to composition
- WHEN composition inputs ready (transcript, cut-list, matted video OR raw)
- THEN call D4 Shotstack composition → transition to Processing
- WHEN composition completes
- THEN call D5 Mux encoding → download to mobile
- WHEN all steps complete
- THEN transition to Complete, mark `completedAt` timestamp
- WHEN any step fails (retryable)
- THEN retry with exponential backoff (2s, 4s, 8s, max 3 attempts)
- WHEN max retries exceeded OR non-retryable error
- THEN transition to Failed with `error: { code, message, retryable: false }`
- WHEN user cancels
- THEN call vendor cancel APIs (if supported), transition to Cancelled

**Dependencies:** D1-D5
**Estimate:** 18 hours
**Test Notes:** End-to-end test with 90s clip; verify parallel/sequential execution; simulate failures at each stage.

---

#### Ticket D7: Background Removal Adapter (Deferred Stub)
**Goal:** Create adapter interface with feature flag, defer implementation to Phase 2.

**Acceptance Criteria:**
- GIVEN background removal feature flag `ENABLE_BG_REMOVAL = false`
- WHEN user enables background change in Feature Selection
- THEN show message: "Background removal coming soon. Stay tuned!"
- AND disable toggle (greyed out)
- WHEN feature flag set to `true` (Phase 2)
- THEN call Cutout.Pro API (or negotiated alternative at <$10/min)
- AND return matted video URL for composition

**Dependencies:** None (stub only)
**Estimate:** 4 hours
**Test Notes:** Verify toggle disabled; prepare API contract for Phase 2 integration.

---

#### Ticket D8: AI Script Generation (OpenAI GPT-4o + Moderation)
**Goal:** Generate scripts via GPT-4o with content moderation filter.

**Acceptance Criteria:**
- GIVEN user selects "Generate with AI" on Script screen
- WHEN user enters topic (required) + description (optional)
- THEN call GPT-4o API:
  - Prompt: "Research and generate a 20-250 word short-form video script about [topic]. [description]. Target platform: TikTok/Instagram Reels/YouTube Shorts. Tone: [niche preference]. Format: Engaging hook + concise message + clear CTA."
  - Response format: JSON mode `{ script: "..." }`
- WHEN GPT-4o returns script
- THEN call Moderation API: `POST /moderate { text: script }`
- WHEN moderation flags content (profanity, toxicity, PII)
- THEN reject with error: "Generated content violates guidelines. Please try different topic."
- WHEN moderation passes
- THEN validate word count (20-500 words)
- AND save to `AsyncStorage.scripts` with `source: 'ai'`
- AND display in teleprompter with edit option
- WHEN GPT-4o fails (p95 >5s OR error rate >3%)
- THEN switch to Claude 3.7 Sonnet fallback
- AND log switchover event

**Dependencies:** None (standalone Epic)
**Estimate:** 14 hours
**Test Notes:** Generate scripts for 5 topics (Healthcare, Finance, Fitness); verify moderation catches profanity/toxicity; test fallback to Claude.

---

### Epic E: UI/UX & Accessibility

#### Ticket E1: Design System & Component Library
**Goal:** Build reusable UI components with accessibility built-in.

**Acceptance Criteria:**
- GIVEN design system defined
- WHEN creating button component
- THEN ensure 44×44pt minimum tap target, VoiceOver label, haptic feedback on press
- WHEN creating text input
- THEN support system font scaling (up to 200%), contrast ≥4.5:1, VoiceOver hints
- WHEN creating modal
- THEN ensure focus trap, Escape key dismissal, backdrop opacity ≥0.5
- WHEN creating empty state
- THEN use illustration + concise copy (e.g., "No videos yet. Tap + to create.")
- WHEN creating error banner
- THEN use icon + actionable message + dismiss button

**Dependencies:** None
**Estimate:** 16 hours
**Test Notes:** Audit with VoiceOver (iOS) and TalkBack (Android); verify font scaling at 150%, 200%; contrast check with WCAG tool.

---

#### Ticket E2: Empty States & Error Messaging
**Goal:** Design and implement all empty/error states per PRD Section 15.

**Acceptance Criteria:**
- GIVEN user on empty Projects List
- THEN show illustration + "Create your first video by tapping +" + centered + button
- GIVEN permissions denied
- THEN show full-screen modal: icon + "Camera and microphone access required. Enable in Settings." + Cancel/Open Settings buttons
- GIVEN storage low (<500MB)
- THEN show banner "Storage low. Free up space before recording." + Manage Storage button
- GIVEN offline during processing
- THEN show top banner "You're offline. We'll resume uploads once you're back." + spinner during retry
- GIVEN processing failed
- THEN show error card: icon + error message + Retry/Keep raw video buttons
- GIVEN export unavailable
- THEN show modal "Sharing unavailable on this device. Video saved locally under Project." + path reference

**Dependencies:** E1
**Estimate:** 12 hours
**Test Notes:** Trigger all error states manually (revoke permissions, fill storage, disconnect network, simulate API failures).

---

#### Ticket E3: Accessibility Audit & VoiceOver/TalkBack
**Goal:** Ensure WCAG AA compliance and screen reader compatibility.

**Acceptance Criteria:**
- GIVEN VoiceOver (iOS) or TalkBack (Android) enabled
- WHEN user navigates app
- THEN all interactive elements have descriptive labels (e.g., "Record video button", "Pause teleprompter")
- AND focus order is logical (top-to-bottom, left-to-right)
- WHEN teleprompter overlays video
- THEN teleprompter controls remain accessible (announce "Teleprompter playing at 140 words per minute")
- WHEN processing status updates
- THEN announce "Processing 65% complete" via accessibility announcement
- WHEN font scaling increased to 200%
- THEN UI adjusts without clipping or overlap

**Dependencies:** E1, E2
**Estimate:** 10 hours
**Test Notes:** Manual test with VoiceOver/TalkBack; contrast check all screens; font scaling test at 150%, 200%.

---

### Epic F: QA & Release

#### Ticket F1: Manual Test Plan & Device Matrix
**Goal:** Define test cases for all user stories with device coverage.

**Acceptance Criteria:**
- GIVEN test plan document
- WHEN QA executes
- THEN cover: Onboarding, Project CRUD, Script generation (AI + paste), Recording (all states), Teleprompter (all controls), Feature selection, Processing (success/failure/cancel), Preview, Export (share sheet + fallback)
- AND test on device matrix:
  - iOS: iPhone 12 (iOS 16), iPhone 14 (iOS 17)
  - Android: Pixel 5 (Android 12), Pixel 7 (Android 13)
- AND test network conditions: WiFi, 4G (10 Mbps), 3G (1 Mbps), Offline
- AND test edge cases: Low storage, permissions denied, background/foreground transitions, app termination during upload

**Dependencies:** All Epics A-E
**Estimate:** 20 hours (test execution)
**Test Notes:** Document bugs in GitHub Issues with severity (P0-P4), screenshots, device info.

---

#### Ticket F2: Regression Suite (Critical Path)
**Goal:** Automate critical path tests to catch regressions.

**Acceptance Criteria:**
- GIVEN Jest + Detox (or similar E2E framework) set up
- WHEN running regression suite
- THEN automate:
  1. Onboarding → Projects → Script (paste) → Record 30s → Preview raw
  2. Script (AI) → Moderation pass → Record 60s → Processing → Preview processed
  3. Feature selection (subtitles + filler removal) → Processing success → Export via share sheet
- AND run on CI/CD (GitHub Actions) on every PR to main
- WHEN regression detected
- THEN fail CI build and notify team

**Dependencies:** F1
**Estimate:** 24 hours
**Test Notes:** Run suite locally on iOS Simulator and Android Emulator; verify CI integration.

---

#### Ticket F3: Beta Distribution (TestFlight & Expo)
**Goal:** Distribute beta builds to internal testers and closed beta users.

**Acceptance Criteria:**
- GIVEN Expo EAS Build configured
- WHEN running `eas build --platform ios --profile preview`
- THEN upload to TestFlight with release notes
- WHEN running `eas build --platform android --profile preview`
- THEN generate APK and distribute via Expo Go or Google Play Internal Testing
- GIVEN closed beta group (20 creators across 3 niches)
- WHEN beta build available
- THEN send invite links with beta test instructions and feedback form
- AND monitor crash reports (Sentry), processing success rate, feedback submissions

**Dependencies:** F2
**Estimate:** 12 hours
**Test Notes:** Internal alpha testing with 5 team members; closed beta with 20 external users; collect feedback via Google Form.

---

### Epic G: Observability & Metrics

#### Ticket G1: Local Analytics Schema & Event Tracking
**Goal:** Track funnel events locally with 30-day rotation.

**Acceptance Criteria:**
- GIVEN `AsyncStorage.analytics` schema defined
- WHEN user completes action
- THEN log event: `{ eventName, timestamp, metadata }`
- AND increment counters: `{ script_completed: 45, record_started: 42, export_success: 35, ... }`
- WHEN 30 days elapsed
- THEN rotate old events (delete entries older than 30 days)
- WHEN telemetry toggle ON in Settings
- THEN batch send anonymized events to backend endpoint (POST /telemetry)
- AND ensure no user identifiers included (project IDs only)

**Dependencies:** All Epics (event hooks)
**Estimate:** 10 hours
**Test Notes:** Track events for 10 video creations; verify counters update; test 30-day rotation logic; verify telemetry batch submission.

---

#### Ticket G2: Cost Monitoring & Budget Alerts
**Goal:** Track API costs per job and alert on budget overruns.

**Acceptance Criteria:**
- GIVEN cost tracking in backend
- WHEN processing job completes
- THEN calculate cost: `transcriptionCost + compositionCost + encodingCost`
- AND log to database: `{ jobId, totalCost, breakdown: { assemblyAI: $0.015, shotstack: $0.30, mux: $0.03 } }`
- WHEN monthly total exceeds $500
- THEN send alert to PM/Eng Lead: "Cost budget exceeded: $523/mo (target: $359/mo)"
- WHEN per-clip cost >$0.50
- THEN flag job for investigation (log error, Slack alert)

**Dependencies:** Epic D (processing pipeline)
**Estimate:** 8 hours
**Test Notes:** Run 100 jobs, verify cost tracking; simulate budget overrun (manually inflate costs).

---

#### Ticket G3: Crash Reporting & Error Monitoring
**Goal:** Integrate Sentry for crash/error tracking.

**Acceptance Criteria:**
- GIVEN Sentry SDK installed (React Native)
- WHEN app crashes
- THEN send crash report to Sentry with stack trace, device info, breadcrumbs
- WHEN API error occurs (500, timeout)
- THEN log to Sentry with context: `{ jobId, vendor, errorCode, retries }`
- WHEN processing fails
- THEN tag error with severity: `P1` (all users blocked), `P2` (single user retry), `P3` (cosmetic)
- GIVEN Sentry alerts configured
- WHEN crash rate >5% OR P1 errors detected
- THEN notify #engineering Slack channel

**Dependencies:** All Epics
**Estimate:** 6 hours
**Test Notes:** Trigger crash (throw error in useEffect); verify Sentry report; test alert notifications.

---

## 8. POC & Benchmarks

### 8.1 Test Clips Preparation

| Clip ID | Duration | Specs | Purpose |
|---------|----------|-------|---------|
| **Clip 1** | 30s | 1080x1920, clean audio, single speaker | Baseline performance |
| **Clip 2** | 60s | 1080x1920, moderate noise, 2 speakers | Diarization accuracy |
| **Clip 3** | 120s | 1080x1920, 15+ filler words, background music | Filler detection + editing |
| **Clip 4** | 90s | 1080x1920, rapid motion, complex BG | Segmentation quality (deferred) |
| **Clip 5** | 60s | 1080x1920, mixed EN+ES, profanity | Language detection + moderation |

### 8.2 Acceptance Thresholds

| Metric | Target | Pass Condition | Test Method |
|--------|--------|----------------|-------------|
| **Upload Time (90s clip, ~80MB)** | <15s on 4G (10 Mbps up) | ≤15s p95 | Network throttle (Chrome DevTools) |
| **Transcription WER** | <5% clean, <10% noisy | Manual review vs. ground truth | 10 clips × 3 reviewers |
| **Filler-Word Precision** | >90% | True positives / (TP + FP) | Manual annotation, 5 clips |
| **Filler-Word Recall** | >85% | True positives / (TP + FN) | Manual annotation, 5 clips |
| **Processing Latency p50** | <90s for 60s clip | Median of 10 runs | Backend timing logs |
| **Processing Latency p95** | <180s for 60s clip | 95th percentile of 10 runs | Backend timing logs |
| **Success Rate** | ≥98% | Jobs complete without errors | 100 job submissions |
| **Webhook Reliability** | ≥99% | Webhooks delivered / sent | Mock endpoint, 100 jobs |
| **Cost per Clip (60s)** | <$0.50 | Sum all API costs | POC cost tracking |

### 8.3 POC Execution Checklist

- [ ] **Week 5: Setup**
  - [ ] Backend proxy running (Node.js/Express with webhook receiver)
  - [ ] Test clips recorded (5 clips covering edge cases)
  - [ ] Vendor trials activated (AssemblyAI $50, Deepgram $200, Shotstack free tier)
  - [ ] Mock mobile client for upload/download

- [ ] **Week 6: Testing**
  - [ ] Upload 5 clips, measure latency (throttled 4G)
  - [ ] Run transcription (AssemblyAI), calculate WER manually
  - [ ] Run filler-word detection, calculate precision/recall
  - [ ] Run composition (Shotstack), verify output 1080x1920 MP4
  - [ ] Run encoding (Mux), verify bitrate 8-12 Mbps
  - [ ] Measure end-to-end latency (upload → download)
  - [ ] Log costs per clip, calculate avg

- [ ] **Pass Criteria:** ≥4 of 5 clips meet all thresholds
- [ ] **Conditional Pass:** 3 of 5 clips pass, identifiable fixes
- [ ] **Fail:** <3 clips pass OR critical blocker (GDPR violation, EU residency unavailable)

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner | Trigger |
|------|-----------|--------|----------|-------|---------|
| **Cutout.Pro cost prohibitive** ($28.5k/mo at 1k clips) | **High** | **Critical** | 1. Defer BG removal to Phase 2<br>2. Negotiate volume pricing (target: $5-10/min)<br>3. Evaluate self-hosted (MODNet, BMV2 on AWS GPU)<br>4. Test Unscreen alternative | PM/Eng | Cost >$1k/mo at MVP scale |
| **AssemblyAI SLA breach** (<99.9% uptime) | Low | High | 1. Auto-failover to Deepgram<br>2. Circuit breaker (5 failures → switch)<br>3. Request SLA credits<br>4. Monitor status page | Eng Lead | 3 consecutive failures OR uptime <99.9% in 30 days |
| **Filler-word precision <90%** | Medium | Medium | 1. Expand dictionary (add "so", "well", "actually")<br>2. Use confidence <0.5 threshold<br>3. ML model training (Phase 2)<br>4. User preview before render | Eng | User complaints >5% OR manual review <90% |
| **Shotstack latency >2× source duration** | Low | Medium | 1. Use Ingest API for cross-region<br>2. Pre-encode videos to H.264<br>3. Failover to Cloudinary<br>4. Batch non-urgent jobs | Eng | p95 >120s for 60s clip |
| **Music API underutilized** ($500/mo flat) | Medium | Low | 1. Launch MVP without music<br>2. Add Phase 2 based on demand<br>3. Negotiate pay-per-use pricing<br>4. Use royalty-free library (Artlist) | PM | <20% enable music after 3 months |
| **GDPR violation** (data retention >30 days) | Low | **Critical** | 1. Automate deletion jobs (cron every 24h)<br>2. Audit vendor retention policies<br>3. Document data flow in DPA<br>4. Implement "right to deletion" API | Legal/Eng | Any vendor stores >30 days OR no deletion API |
| **Vendor lock-in** (proprietary formats) | Low | Medium | 1. Enforce standard outputs (MP4, SRT, VTT)<br>2. Use REST APIs (avoid vendor SDKs)<br>3. Abstraction layer (adapter pattern)<br>4. Document migration paths | Eng | Contract renewal with >20% price increase |
| **Mobile upload failures (slow networks)** | Medium | Medium | 1. Resumable uploads (tus protocol)<br>2. Client-side compression (6 Mbps bitrate)<br>3. Show progress + pause/resume<br>4. WiFi-only queue option | Eng | Upload failure rate >10% |
| **Webhook delivery failures** | Medium | Medium | 1. Retry logic (3 attempts, exp backoff)<br>2. Idempotent handlers<br>3. Monitor delivery <95% alert<br>4. Fallback polling for critical jobs | Eng | Delivery <99% over 7 days |
| **API rate limits at scale** | Medium | High | 1. Negotiate higher limits at 10k clips/mo<br>2. Implement job queue (BullMQ)<br>3. Distribute across API keys<br>4. Batch where possible | Eng | Rate limit errors >1% |

---

## 10. Quality Gates & Test Plan

### 10.1 Unit Tests (Per Milestone)

- **M0:** Navigation stack routing, AsyncStorage schema helpers
- **M1:** Teleprompter WPM calculations, countdown timer logic, file path builders
- **M2:** Filler-word detection algorithm, cut-list generator, retry/backoff logic
- **M3:** State machine transitions (recording, processing), feature toggle validation
- **M4:** Share API error handling, checksum verification, offline queue logic

**Target Coverage:** ≥80% for utility functions, adapters, state machines

### 10.2 Integration Tests (End-to-End)

**Test 1: Happy Path (Script Paste)**
```
Onboard → Create Project → Paste Script → Record 30s → Features (subtitles only) → Processing → Preview → Export
- Verify: Video saved to processed/, share sheet opens, exportedAt timestamp set
```

**Test 2: AI Script + Full Features**
```
Onboard → Create Project → Generate AI Script → Moderation pass → Record 60s → Features (subtitles + filler removal + intro/outro) → Processing → Preview → Export
- Verify: Filler words removed, intro/outro present, subtitles burned in
```

**Test 3: Error Recovery**
```
Record 90s → Submit Processing → Simulate network failure during upload → Verify retry logic → Reconnect → Processing resumes → Complete
```

**Test 4: Offline Mode**
```
Record 60s → Go offline → Attempt processing → Verify banner "You're offline" → Reconnect → Auto-retry → Complete
```

### 10.3 Device Matrix (Manual Testing)

| Device | OS | Network | Storage | VoiceOver/TalkBack |
|--------|----|---------|---------|--------------------|
| iPhone 12 | iOS 16 | WiFi, 4G, Offline | 10GB free, <500MB | VoiceOver ON |
| iPhone 14 | iOS 17 | WiFi, 3G | 50GB free | VoiceOver ON |
| Pixel 5 | Android 12 | WiFi, 4G | 5GB free, <500MB | TalkBack ON |
| Pixel 7 | Android 13 | WiFi, 5G | 100GB free | TalkBack ON |

### 10.4 Milestone Walkthrough Script

**M5 Final Walkthrough (Must Pass for Beta):**
1. Launch app → Complete onboarding (select Healthcare → Physiotherapy)
2. Create project "Patient Tips" → Tap +
3. Generate AI script (topic: "Knee pain relief", description: "Quick tips for runners") → Verify script 20-250 words, moderation pass
4. Proceed to Record → Grant permissions → Record 60s with teleprompter at 140 WPM
5. Review raw → Accept → Select features: Subtitles ON, Filler removal ON, Intro/Outro ON
6. Submit processing → Monitor status (uploading → queued → processing → complete)
7. Preview processed → Verify subtitles, no filler words, intro/outro present
8. Export → Share to Photos app → Verify success toast
9. Return to dashboard → See processed video thumbnail
10. Repeat for Finance and Fitness niches

**Pass Criteria:** All 10 steps complete without errors, <10 min end-to-end, ≥90% processing success over 10 runs.

---

## 11. Accessibility & Localization

### 11.1 WCAG AA Compliance

- **Color Contrast:** ≥4.5:1 for text/background (including teleprompter overlay at 0.55 opacity)
- **Touch Targets:** ≥44×44pt for all interactive elements (buttons, toggles, sliders)
- **Font Scaling:** Support system font scaling up to 200% without clipping
- **Focus Order:** Logical tab order (top→bottom, left→right)
- **Screen Readers:** All buttons, inputs, images have descriptive labels

### 11.2 VoiceOver/TalkBack Labels

| Element | Label | Hint |
|---------|-------|------|
| Record button | "Record video" | "Starts 3-second countdown, then records up to 120 seconds" |
| Teleprompter Play | "Play teleprompter" | "Scrolls script at 140 words per minute" |
| WPM Slider | "Teleprompter speed" | "Adjust scroll speed from 80 to 200 words per minute. Current: 140" |
| Feature toggle (Subtitles) | "Subtitles toggle" | "Enable to burn subtitles into video" |
| Export button | "Export video" | "Opens share sheet to share video to social media or save locally" |

### 11.3 Localization (Future-Ready)

- **MVP Locale:** English (en-US) only
- **Structure:** All strings in i18n files (`en.json`, `es.json`, etc.)
- **Avoid Hard-Coded Text:** Use `t('key')` pattern with react-i18next or similar
- **Future Expansion:** Spanish (es-MX), French (fr-FR), German (de-DE) based on user demand

### 11.4 Accessibility Testing Checklist

- [ ] VoiceOver test (iOS): Navigate all screens, trigger all actions
- [ ] TalkBack test (Android): Navigate all screens, trigger all actions
- [ ] Font scaling test: 150%, 200% (verify no clipping, overlap)
- [ ] Contrast check: Use WebAIM Contrast Checker on all color pairs
- [ ] Keyboard navigation test (future web version): Tab order, Enter/Space triggers
- [ ] Touch target audit: Measure all buttons/toggles with design tool

---

## 12. Operational Playbooks

### 12.1 Error Handling Playbook

**Scenario 1: Upload Failure (413 File Too Large)**
- **Detection:** Backend returns 413 Payload Too Large
- **User Message:** "Video file too large. Ensure recording is ≤120 seconds and try again."
- **Action:** Offer "Retake" button to re-record shorter clip
- **Logging:** Log to Sentry with `{ errorCode: 'UPLOAD_FILE_TOO_LARGE', videoId, fileSize }`

**Scenario 2: Transcription Timeout (20 min)**
- **Detection:** Poll loop exceeds 600 attempts (20 min)
- **User Message:** "Processing timed out. Please try again or contact support."
- **Action:** Mark job as Failed, offer Retry button
- **Logging:** Log to Sentry with `{ errorCode: 'TIMEOUT', jobId, vendor: 'AssemblyAI' }`
- **Escalation:** Auto-switch to Deepgram fallback on next attempt

**Scenario 3: Rate Limit Exceeded (429)**
- **Detection:** Vendor returns 429 Too Many Requests
- **User Message:** "We're processing many videos. Please try again in 5 minutes."
- **Action:** Queue job with 5-min delay, retry automatically
- **Logging:** Log to Sentry with `{ errorCode: 'RATE_LIMIT', vendor, retryAfter: 300 }`

**Scenario 4: Offline Mode**
- **Detection:** Network check fails (Expo Network API)
- **User Message:** Top banner "You're offline. We'll resume uploads once you're back."
- **Action:** Queue upload, poll network every 10s, auto-retry on reconnect
- **Logging:** Log locally, do not send to Sentry (expected behavior)

**Scenario 5: Processing Cancelled by User**
- **Detection:** User taps Cancel during processing
- **User Message:** Toast "Processing cancelled. You can edit features and try again."
- **Action:** Call backend `POST /jobs/{jobId}/cancel` (if supported), mark job Cancelled
- **Logging:** Log event `processing_cancelled` to local analytics

### 12.2 Offline Behavior

**Upload Queue:**
- When offline, queue upload jobs in `AsyncStorage.uploadQueue`
- On network reconnect (NetInfo listener), dequeue and retry in FIFO order
- Show badge count on Projects List: "2 uploads pending"

**Preview Mode:**
- Allow viewing local raw/processed videos while offline
- Disable Export (share sheet requires network for some platforms)
- Show banner: "Export available when online"

**Script Generation:**
- Disable AI script generation while offline (requires API call)
- Allow manual script paste
- Show message: "AI script generation requires internet connection"

### 12.3 Storage Management

**Warning Thresholds:**
- **Yellow:** <2GB free → Banner "Storage running low. Consider exporting and deleting old videos."
- **Red:** <500MB free → Block new recordings, show modal "Free up space to continue recording."

**Cleanup Tools:**
- Settings → Storage Info → Show breakdown: Raw (X GB), Processed (Y GB), Total (Z GB)
- Provide "Delete All Raw Videos" button (with confirmation)
- Provide per-project cleanup: Long-press project → Delete → "Delete X videos permanently?"

**Auto-Cleanup (Optional):**
- After successful export, prompt: "Export successful. Delete raw video to free up space?" [Keep/Delete]
- After 30 days, prompt: "Videos older than 30 days found. Delete to free up space?" [Review/Delete All]

### 12.4 Incident Response (External APIs)

**Vendor Status Page Monitoring:**
- Subscribe to status pages:
  - AssemblyAI: https://status.assemblyai.com
  - Shotstack: https://status.shotstack.io (TBD)
  - Mux: https://status.mux.com (TBD)
- Set up Slack webhook alerts for P1/P2 incidents

**Escalation Contacts (TBD):**
- AssemblyAI Support: support@assemblyai.com (P1: 1h SLA)
- Shotstack Support: support@shotstack.io
- Mux Support: support@mux.com
- Cutout.Pro Support: support@cutout.pro (Phase 2)

**Switch to Fallback Procedure:**
1. Detect trigger condition (5 failures OR SLA breach)
2. Log switchover event: `{ timestamp, vendor: 'AssemblyAI', fallback: 'Deepgram', reason: 'SLA_BREACH' }`
3. Update feature flag: `USE_ASSEMBLYAI = false, USE_DEEPGRAM = true`
4. Send alert to #engineering Slack: "Switched to Deepgram fallback due to AssemblyAI SLA breach"
5. Monitor fallback performance, switch back after 1h if primary recovered
6. Post-incident review: Document in `incidents/YYYY-MM-DD-assemblyai.md`

**Rollback to Primary Procedure:**
1. Verify primary vendor status page shows "All Systems Operational" for ≥1h
2. Run health check: Submit test clip, verify success
3. Update feature flag: `USE_ASSEMBLYAI = true, USE_DEEPGRAM = false`
4. Monitor for 24h, revert if issues recur

---

## 13. Release Plan

### 13.1 Beta Launch Criteria

**Must-Have (Blocking):**
- [ ] All M0-M5 milestones complete with exit criteria met
- [ ] No P0/P1 bugs in backlog
- [ ] Processing success rate ≥90% over 100 test jobs
- [ ] Export works on iOS (share sheet) and Android (share intent)
- [ ] Crash rate <5% across device matrix
- [ ] VoiceOver/TalkBack audit passed (all screens labeled)
- [ ] Local analytics capturing all funnel events
- [ ] Beta distribution set up (TestFlight for iOS, Expo for Android)

**Nice-to-Have (Non-Blocking):**
- [ ] Advanced error recovery (background removal stub)
- [ ] Performance optimizations (lazy loading, image caching)
- [ ] Telemetry toggle tested with backend endpoint

### 13.2 Beta Rollout Plan

**Phase 1: Internal Alpha (Week 9)**
- **Audience:** 5 team members (2 eng, 1 PM, 1 designer, 1 QA)
- **Duration:** 3 days
- **Goal:** Smoke test all critical paths, identify showstoppers
- **Distribution:** TestFlight (iOS), APK via Expo (Android)
- **Feedback:** Daily standups, shared bug tracker

**Phase 2: Closed Beta (Week 10)**
- **Audience:** 20 creators across 3 niches (Healthcare: 7, Finance: 7, Fitness: 6)
- **Duration:** 1 week
- **Goal:** Validate niche-specific workflows, gather UX feedback, measure KPIs
- **Distribution:** TestFlight invites (iOS), Google Play Internal Testing (Android)
- **Feedback:** Google Form survey + in-app feedback button → Slack #beta-feedback
- **Monitoring:** Sentry crash reports, processing success rate dashboard, cost tracking

**Phase 3: Public Beta (Post-MVP, Month 2)**
- **Audience:** 100 users (open application or referral)
- **Duration:** 2 weeks
- **Goal:** Stress-test infrastructure, validate pricing model, refine UX
- **Distribution:** TestFlight Public Link (iOS), Google Play Open Testing (Android)

### 13.3 Go/No-Go Checklist (Pre-Beta)

**Technical Readiness:**
- [ ] Backend API stable (uptime >99% over 7 days)
- [ ] Vendor integrations functional (AssemblyAI, Shotstack, Mux)
- [ ] Processing success rate ≥90% (100 test jobs)
- [ ] Export success rate ≥95% (50 export attempts)
- [ ] Crash rate <5% (Sentry monitoring)
- [ ] All P0/P1 bugs resolved

**User Experience:**
- [ ] Time-to-first-export <10 min (median of 10 users)
- [ ] Completion rate ≥70% (recording → export)
- [ ] All empty/error states implemented and tested
- [ ] VoiceOver/TalkBack labels verified

**Business & Legal:**
- [ ] DPAs signed with AssemblyAI, Shotstack, Mux
- [ ] Data retention policies documented (<30 days)
- [ ] Privacy policy reviewed (no cloud storage, local-only)
- [ ] Cost per clip <$0.50 validated (100 test clips)

**Operational:**
- [ ] Incident response playbook documented
- [ ] Vendor status page alerts configured
- [ ] Sentry alerts set up (P1 errors, crash rate >5%)
- [ ] Beta feedback form live (Google Form + Slack integration)

**Decision:** PM + Eng Lead review checklist; all boxes checked = **GO**, else = **NO-GO** with mitigation plan.

### 13.4 Success Metrics (Beta)

**Quantitative (Measured via Local Analytics + Sentry):**
- Time-to-first-export: <10 min (median)
- Completion rate: ≥70% (recording → export)
- Processing success rate: ≥90%
- Export success rate: ≥95%
- Crash rate: <5%
- Feature opt-in rates: Subtitles (≥80%), Filler removal (≥60%), Intro/Outro (≥40%)

**Qualitative (Measured via Feedback Form):**
- Net Promoter Score (NPS): ≥40
- Top feature requests: Rank by frequency
- Top pain points: Categorize (UX, performance, bugs)
- Niche-specific feedback: Healthcare vs. Finance vs. Fitness

**Post-Beta Actions:**
- If success rate <90%: Root cause analysis, prioritize fixes for public beta
- If crash rate >5%: Delay public beta, triage P0 crashes
- If NPS <40: UX review, interview beta users, iterate on pain points

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **MVP** | Minimum Viable Product (Phase 1 features) |
| **Processing Job** | Server-side workflow: Upload → Transcription → Composition → Encoding → Download |
| **Filler-Word Removal** | Automatic trimming of disfluencies (um, uh, like) using transcript + cut-list |
| **Teleprompter WPM** | Words per minute; controls scroll speed (80-200, default 140) |
| **SLA** | Service Level Agreement (e.g., 99.9% uptime) |
| **DPA** | Data Processing Addendum (GDPR compliance contract) |
| **WER** | Word Error Rate (transcription accuracy metric) |
| **p50/p95** | 50th/95th percentile latency (median and worst-case) |
| **Circuit Breaker** | Auto-failover pattern (switch to fallback after N failures) |
| **Cut-List** | Array of time ranges to remove from video (for filler-word removal) |
| **Soft Delete** | Mark record as deleted (isDeleted: true) without removing from storage |

### 14.2 Configuration Matrix (Feature Flags)

| Flag | Dev | Staging | Production | Description |
|------|-----|---------|------------|-------------|
| `ENABLE_AI_SCRIPT` | true | true | true | OpenAI GPT-4o script generation |
| `ENABLE_MODERATION` | true | true | true | Content moderation filter |
| `ENABLE_SUBTITLES` | true | true | true | Burn-in subtitles via composition |
| `ENABLE_FILLER_REMOVAL` | true | true | true | Filler-word detection + cut-list |
| `ENABLE_INTRO_OUTRO` | true | true | true | Intro/outro templates from Shotstack |
| `ENABLE_BG_REMOVAL` | false | false | false | Background removal (deferred to Phase 2) |
| `ENABLE_MUSIC` | false | false | false | Background music (deferred pending demand) |
| `USE_ASSEMBLYAI` | true | true | true | Primary transcription provider |
| `USE_DEEPGRAM` | false | true | true | Fallback transcription (enabled in staging for testing) |
| `USE_SHOTSTACK` | true | true | true | Primary composition provider |
| `USE_CLOUDINARY` | false | true | false | Fallback composition |
| `TELEMETRY_ENABLED` | false | false | false | Default OFF; user toggle in Settings |

### 14.3 Sample Payloads

#### Neutral Processing Job (Client → Backend)
```json
{
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "videoId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "idle",
    "progress": 0,
    "requestedFeatures": {
      "subtitles": true,
      "fillerWordRemoval": true,
      "backgroundChange": {
        "enabled": false,
        "presetId": null
      },
      "backgroundMusic": {
        "enabled": false,
        "trackId": null,
        "volume": 80
      },
      "introOutro": {
        "enabled": true,
        "templateId": "intro_health_01"
      }
    },
    "createdAt": "2025-10-15T14:30:00Z",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "retries": 0,
    "outputs": null
  }
}
```

#### AssemblyAI Webhook Payload → Neutral Mapping
```json
{
  "transcript_id": "5551722-f677-48a6-9287-39821bc247c7",
  "status": "completed",
  "text": "Welcome to Shorty AI. This app helps creators make short videos.",
  "words": [
    { "text": "Welcome", "start": 0, "end": 400, "confidence": 0.98, "speaker": "A" },
    { "text": "to", "start": 400, "end": 500, "confidence": 0.99, "speaker": "A" },
    { "text": "Shorty", "start": 500, "end": 900, "confidence": 0.95, "speaker": "A" },
    { "text": "AI", "start": 900, "end": 1200, "confidence": 0.96, "speaker": "A" }
  ],
  "audio_duration": 12.5
}

// Backend transforms to:
job.outputs.transcriptUrl = "https://cdn.example.com/transcripts/550e8400.vtt"
job.internalData.fillerSegments = [] // No filler words detected
job.status = "processing" // Move to composition stage
```

#### Shotstack Render Request (Backend → Shotstack)
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": { "type": "video", "src": "https://cdn.example.com/intro_health_01.mp4" },
            "start": 0,
            "length": 2
          },
          {
            "asset": { "type": "video", "src": "https://cdn.example.com/raw-video-123.mp4" },
            "start": 2,
            "length": 10.5
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "html",
              "html": "<p>Welcome to Shorty AI</p>",
              "css": "p { color: white; font-size: 24px; background: rgba(0,0,0,0.7); }"
            },
            "start": 2.0,
            "length": 0.4,
            "position": "bottom"
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "1080x1920",
    "fps": 30,
    "quality": "high"
  },
  "callback": "https://backend.example.com/webhooks/shotstack"
}
```

#### Error Code Mapping (Vendor → Neutral)
```typescript
// AssemblyAI error → Neutral error
if (assemblyAIResponse.error === 'invalid_audio') {
  job.error = {
    code: 'INVALID_FILE',
    message: 'Audio format not supported. Please record again.',
    retryable: false
  };
}

// Shotstack error → Neutral error
if (shotstackResponse.status === 'failed' && shotstackResponse.error.includes('timeout')) {
  job.error = {
    code: 'TIMEOUT',
    message: 'Video processing timed out. Please try again with a shorter clip.',
    retryable: true
  };
}

// Retry logic
if (job.error.retryable && job.retries < 3) {
  await retryWithBackoff(() => processJob(job));
} else {
  job.status = 'failed';
  notifyUser(job.error.message);
}
```

---

**End of Plan.md**

---

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-10-05 | 1.0 | Eng Lead | Initial delivery plan created from PRD + Vendor Evaluation |

