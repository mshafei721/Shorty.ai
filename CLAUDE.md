# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shorty.ai** — Mobile-first Expo Go short-form video creator for niche-focused creators. Users onboard via niche selection, create projects, script/record videos with teleprompter, apply automated edits via external APIs, preview, and export locally stored clips.

**Tech Stack:**
- Expo SDK 50 (managed workflow, Expo Go compatible)
- React Native + TypeScript
- State: React Context or Redux Toolkit (JS only)
- Storage: AsyncStorage (metadata) + FileSystem (video files)
- External APIs: AI script generation, video processing (subtitles, background removal, filler-word removal, music, intro/outro)

**Platform Constraints:**
- NO custom native modules
- NO on-device heavy video processing
- All advanced edits via external REST APIs
- Offline-capable for local video viewing
- Windows dev environment + VSCode

## Architecture Overview

### Data Flow Pattern
```
Onboarding (AsyncStorage userProfile)
  ↓
Projects List (AsyncStorage projects)
  ↓
Create Flow: Script → Record → Features → Processing → Preview → Export
  ↓
Local Storage (FileSystem videos/ + AsyncStorage metadata)
```

### Storage Architecture

**AsyncStorage Keys:**
- `projects`: Array of Project objects
- `scripts`: Array of Script objects
- `videos`: Array of VideoAsset objects
- `analytics`: Local KPI counters (rotated every 30 days)
- `userProfile`: Onboarding niche/sub-niche selection

**FileSystem Structure:**
```
FileSystem.documentDirectory/
  videos/
    raw/{projectId}/{timestamp}.mp4
    processed/{videoId}_{timestamp}.mp4
    temp/{videoId}.mp4 (deleted post-upload)
```

### State Machines (Critical Flows)

**Recording:** Idle → Countdown → Recording ↔ Paused → Reviewing → ReadyForFeatures

**Teleprompter:** Hidden → VisiblePaused ↔ Scrolling → Completed

**Processing Job:** Idle → Uploading → Queued → Processing → Complete/Failed/Cancelled

### External API Integration

**Provider-agnostic adapter layer** required to swap transcription/rendering providers.

**Endpoints:**
- `POST /uploads` — Upload raw video (multipart/form-data)
- `POST /jobs` — Create processing job with feature toggles
- `GET /jobs/{jobId}` — Poll status (2s interval, 20min max, 600 attempts)
- `GET /downloads/{jobId}` — Download processed video (verify checksum)
- `POST /jobs/{jobId}/cancel` — Cancel processing

**Error Handling:** Exponential backoff (2s/4s/8s), max 3 retries, handle 413/415/429/500/503.

### Data Model (TypeScript Interfaces)

```typescript
Project {
  id: string(uuid)
  name: string
  niche: string
  subNiche: string
  createdAt: ISO8601
  updatedAt: ISO8601
  isDeleted: boolean
}

Script {
  id: string(uuid)
  projectId: string
  text: string
  wordsCount: number
  wpmTarget: number
  createdAt: ISO8601
  source: 'ai' | 'manual'
}

VideoAsset {
  id: string(uuid)
  projectId: string
  type: 'raw' | 'processed'
  scriptId: string | null
  localUri: string
  durationSec: number
  sizeBytes: number
  createdAt: ISO8601
  exportedAt: ISO8601 | null
  status: 'ready' | 'processing' | 'failed' | 'cancelled'
}

FeatureSelections {
  videoId: string
  subtitles: boolean
  backgroundChange: { enabled: boolean; presetId: string | null }
  backgroundMusic: { enabled: boolean; trackId: string | null; volume: number }
  introOutro: { enabled: boolean; templateId: string | null }
  fillerWordRemoval: boolean
}

ProcessingJob {
  id: string(uuid)
  videoId: string
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled'
  progress: number (0-100)
  requestedFeatures: FeatureSelections
  startedAt: ISO8601
  completedAt: ISO8601 | null
  error: { code: string; message: string } | null
  retries: number
}
```

## Critical Specs

### Script Generation (Section 11)
Two modes:
1. **Paste script:** Text box for manual entry (20-500 words)
2. **Generate with AI:** Prompt for topic (required) + short description (optional) → AI researches & generates ≤250 words

Validation: ≥20 words required before recording; warn if >120s estimated duration.

### Recording & Teleprompter (Sections 10, 14)
- Portrait 9:16, 1080x1920, 30fps, max 120s (auto-stop)
- Expo Camera + permissions (camera/mic)
- Teleprompter overlay: 55% opacity, WPM 80-200 (default 140), font size S/M/L
- Highlight: current sentence 80% brightness, upcoming 50%, past 30%
- Controls: Play/Pause, Restart, Speed slider, Font size toggle
- Storage warning if <500 MB free

### Processing Pipeline (Section 12)
1. Upload raw video → `POST /uploads`
2. Create job with feature toggles → `POST /jobs`
3. Poll every 2000ms → `GET /jobs/{jobId}` (max 20min)
4. Download processed → `GET /downloads/{jobId}` (verify checksum)
5. Save to `processed/` directory

**Defaults:** Subtitles ON, Music OFF, Filler-word removal ON

### Export (Section 13)
- Use `Sharing.shareAsync()` with native iOS/Android share sheet
- Output: MP4 H.264, 1080x1920, 8-12 Mbps video, 128 kbps audio
- Fallback: Save to media library if share unavailable
- Mark `exportedAt` timestamp on success

## Navigation Structure

```
Onboarding Stack: Splash → Niche Selection → Sub-niche Confirmation
Main Stack:
  - Projects List (home)
  - Project Dashboard
  - Create Flow (modal): Script → Record → Feature Selection → Processing → Preview → Export
  - Settings (telemetry toggle, storage info, version)
Deep Link: shortyai://project/{id}
```

## Performance Requirements

- Warm start: <2s (iPhone 12, Pixel 5)
- Cold start: <4s
- UI interactions: <100ms response
- Screen transitions: <300ms
- Processing poll: Fixed 2000ms interval
- Offline mode: Graceful degradation (allow local video viewing, queue uploads)

## Privacy & Security

- **All files stored locally** (no cloud backup in MVP)
- No user accounts or personal data transmission
- Explicit camera/mic consent required
- Purge cancelled raw videos on user discard
- Telemetry default OFF (toggle in Settings)

## Development Notes

### Expo Modules Allowed
expo-camera, expo-av, expo-file-system, expo-sharing, expo-media-library, expo-permissions, expo-haptics, expo-clipboard, expo-constants, expo-network

### File Naming Convention
- Raw: `raw_{projectId}_{timestamp}.mp4`
- Processed: `processed_{videoId}_{timestamp}.mp4`
- Temp: `/temp/{videoId}.mp4` (delete post-upload)

### AsyncStorage Schema Migration
Use `appStateVersion` key to track schema updates for future migrations.

### Error UX Patterns
- Permissions denied: Modal with "Open Settings" deep link
- Storage low: Banner with "Manage Storage" button
- Offline: Top banner "You're offline. We'll resume uploads once you're back."
- Processing failed: Error card with Retry/Keep raw video options
- Export unavailable: Show local save path

## Non-Goals (MVP)

- Cloud backup or cross-device sync
- User accounts or social features
- Custom native modules
- Manual timeline editing
- On-device heavy video processing
- Advanced analytics backend

## Open Questions

See [PRD.md](PRD.md) Section 20 for current open questions regarding AI providers, intro/outro branding, and offline queue requirements.
