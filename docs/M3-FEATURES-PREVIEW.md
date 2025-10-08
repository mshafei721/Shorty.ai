# M3: Feature Selection & Preview

**Milestone:** M3 (Nov 18–24, 2025)
**Status:** ✅ Complete
**Dependencies:** M0 (Foundations), M1 (Recording & Teleprompter), M2 (Processing Pipeline POC)

## Overview

M3 adds **Feature Selection** and **Preview** capabilities to Shorty.ai, enabling users to:
- Configure automated editing features (filler removal, jump-cuts, captions, intro/outro)
- Preview videos with live caption overlay
- Generate draft renders through M2 processing pipeline
- Persist feature presets per project

## Architecture

### Data Flow

```
ProjectsList → FeaturesScreen → PreviewScreen → M2 Pipeline
                    ↓                  ↓
              AsyncStorage         Gateway API
              (Presets)         (Transcript/Draft)
```

### State Machine

```
idle → loading_data → ready → generating_draft → draft_ready
         ↓                           ↓
       error ←──────────────────────┘
```

## Components

### 1. FeaturesScreen

**Location:** `src/features/m3/screens/FeaturesScreen.tsx`

**Features:**
- Toggle controls for editing features
- Slider for caption size (12-32px)
- Caption style selector (boxed/shadow/outline)
- Frame margin slider (0-48px)
- Save/Reset/Preview actions

**Storage:**
- Key: `shortyai:project:{projectId}:m3:preset`
- Schema: `M3Preset` (see `src/features/m3/types.ts`)

**Usage:**
```typescript
navigation.navigate('Features', {
  projectId: 'project_123',
  assetId: 'asset_456',
  rawVideoUri: 'file://video.mp4',
});
```

### 2. PreviewScreen

**Location:** `src/features/m3/screens/PreviewScreen.tsx`

**Features:**
- Portrait video player (9:16 aspect ratio)
- Live caption overlay from transcript
- Play/Pause controls
- Draft render generation
- Progress tracking for draft jobs

**Data Sources:**
- Raw video: Local FileSystem URI
- Draft video: M2 artifact URL (when available)
- Captions: M2 transcript tokens

**Caption Rendering:**
- Syncs captions with playback position
- Displays 5-token window (adjustable)
- Respects preset style/size configuration

### 3. M2Gateway

**Location:** `src/features/m3/gateway/`

**Purpose:** Provider-agnostic interface to M2 processing pipeline.

**Implementations:**
- `M2GatewayClient`: Real HTTP client (production)
- `MockM2Gateway`: In-memory mock (development/testing)

**Environment:**
```bash
EXPO_PUBLIC_M2_BASE_URL=https://api.shorty.ai/m2  # Production
EXPO_PUBLIC_M2_BASE_URL=mock                       # Mock mode (default)
```

**Methods:**
```typescript
interface M2Gateway {
  getLatestJob(projectId: string, assetId: string): Promise<M2JobStatus>;
  getTranscript(projectId: string, assetId: string): Promise<NormalizedTranscript>;
  getFillerSpans(projectId: string, assetId: string): Promise<FillerSpan[]>;
  requestDraft(req: DraftRenderRequest): Promise<{ renderId: string }>;
  pollDraft(renderId: string): Promise<DraftRenderStatus>;
}
```

### 4. Preview State Machine

**Location:** `src/features/m3/state/previewMachine.ts`

**States:**
- `idle`: Initial state
- `loading_data`: Fetching transcript/fillers from M2
- `ready`: Data loaded, ready for playback
- `generating_draft`: Draft render in progress
- `draft_ready`: Draft artifact available
- `error`: Unrecoverable error occurred

**Events:**
- `LOAD_DATA`: Start loading preview data
- `DATA_OK`: Data loaded successfully
- `DATA_ERR`: Data loading failed
- `GENERATE_DRAFT`: Request draft render
- `DRAFT_OK`: Draft completed successfully
- `DRAFT_ERR`: Draft failed
- `RETRY`: Retry from error state
- `RESET`: Reset draft and return to ready

**Side Effects:**
- `onEnter.loading_data`: Parallel fetch of transcript + fillers
- `on GENERATE_DRAFT`: Submit draft request, poll until terminal state (max 2min)
- `on DRAFT_OK`: Swap player source to artifact URL

## Data Contracts

### M3Preset

```typescript
type M3Preset = {
  fillerRemoval: boolean;
  jumpCuts: boolean;
  captions: {
    enabled: boolean;
    size: number; // 12-32px
    style: 'boxed' | 'shadow' | 'outline';
  };
  introOutro: boolean;
  frameMarginPx: number; // 0-48px
  version: 1;
  updatedAt: string; // ISO 8601
};
```

### NormalizedTranscript

```typescript
type NormalizedTranscript = {
  tokens: Array<{
    text: string;
    startMs: number;
    endMs: number;
    confidence?: number;
  }>;
  fullText: string;
  durationMs: number;
  language?: string;
};
```

### FillerSpan

```typescript
type FillerSpan = {
  startMs: number;
  endMs: number;
  text: string; // "um", "uh", etc.
  confidence: number; // 0-1
};
```

## Telemetry

**Events:** (30-day retention, PII-free)

| Event | Trigger | Metadata |
|-------|---------|----------|
| `m3_features_opened` | User opens Features screen | `projectIdHash` |
| `m3_preset_applied` | User saves preset | `projectIdHash`, feature toggles |
| `m3_preview_play` | User plays preview | `projectIdHash` |
| `m3_draft_render_requested` | User requests draft | `projectIdHash`, enabled features |
| `m3_draft_render_ready` | Draft completes | `projectIdHash`, `durationMs` |
| `m3_preview_error` | Error occurs | `projectIdHash`, `errorType` |

**Privacy:**
- Project IDs are SHA-256 hashed (16-char prefix)
- No transcript text or script content stored
- No user PII captured

**Usage:**
```typescript
import { trackFeaturesOpened } from '../telemetry/events';

await trackFeaturesOpened(projectId);
```

## Navigation

**Routes:**
- `/features/:projectId/:assetId` → FeaturesScreen
- `/preview/:projectId/:assetId` → PreviewScreen

**Deep Links:**
```
shortyai://features/project_123/asset_456
shortyai://preview/project_123/asset_456
```

**Programmatic:**
```typescript
// Open Features
navigation.navigate('Features', {
  projectId: 'project_123',
  assetId: 'asset_456',
  rawVideoUri: 'file://path/to/video.mp4',
});

// Open Preview (from Features)
navigation.navigate('Preview', {
  projectId: 'project_123',
  assetId: 'asset_456',
  rawVideoUri: 'file://path/to/video.mp4',
  preset: currentPreset,
});
```

## Testing

### Unit Tests

**Coverage Targets:**
- New modules: ≥85%
- Overall codebase: ≥65%

**Test Files:**
- `src/features/m3/__tests__/presetStorage.test.ts`
- `src/features/m3/__tests__/MockM2Gateway.test.ts`
- `src/features/m3/__tests__/previewMachine.test.ts`

**Run Tests:**
```bash
npm test -- --testPathPattern=m3
```

### Integration Testing

**Mock M2 Gateway:**
```typescript
import { setM2Gateway } from '../gateway';
import { MockM2Gateway } from '../gateway/MockM2Gateway';

setM2Gateway(new MockM2Gateway());
```

**Mock Transcript:**
The `MockM2Gateway` provides realistic transcript data with filler words for testing caption rendering and filler removal UX.

## Accessibility

**Features:**
- All controls have `accessibilityLabel`
- Toggles use native `Switch` (screen reader compatible)
- Buttons have clear labels and testIDs
- Caption text meets WCAG contrast requirements (4.5:1 minimum)
- Keyboard focus order follows logical flow

**Screen Reader Support:**
- FeaturesScreen: All toggles, sliders, and buttons announced
- PreviewScreen: Play/pause button, draft status announced
- Caption overlay: Not announced (visual only, transcribed speech is in audio)

## Performance

**Optimization:**
- Preset loading: <100ms (AsyncStorage read)
- Draft polling: 2s interval, 60 attempts max (2min timeout)
- Caption rendering: Only visible window (5 tokens) processed per frame
- Video player: Native `expo-av` (hardware-accelerated)

**Memory:**
- Transcript cached in state (not re-fetched on re-render)
- Video uses streaming (not loaded into memory)

## Known Limitations

1. **M2 Pipeline Dependency:** If M2 endpoints are unavailable, falls back to `MockM2Gateway`. Real integration requires M2 deployment.

2. **Draft Polling:** Currently uses simple 2s polling. Future: WebSocket or Server-Sent Events for real-time updates.

3. **Caption Sync:** Captions sync to playback position with ~50ms precision (expo-av callback frequency).

4. **Offline Mode:** Preview requires M2 data (transcript/fillers). Works offline for raw video playback only.

## Future Enhancements (M4+)

- [ ] Preset sharing across projects
- [ ] Preview scrubber with thumbnail preview
- [ ] Side-by-side raw vs. draft comparison
- [ ] Export to camera roll from preview
- [ ] Filler-word highlight visualization
- [ ] Caption timing adjustments (manual override)
- [ ] Custom intro/outro upload

## Migration Notes

**From M1 → M3:**
- No breaking changes to M0/M1 schemas
- New AsyncStorage keys added (scoped to `shortyai:project:{projectId}:m3:*`)
- Navigation extended with 2 new routes (non-breaking)

**Rollback:**
If M3 needs to be disabled:
1. Remove `Features` and `Preview` route registrations from `RootNavigator.tsx`
2. No data cleanup required (AsyncStorage keys are scoped and ignored)

## Support

**Issues:**
- GitHub: https://github.com/yourorg/shortyai/issues
- Tag: `milestone:M3`

**Logs:**
- Preview errors: Check `PreviewScreen` console logs
- Gateway failures: Check `M2Gateway` console logs
- Telemetry: Verify `telemetryEnabled` setting in Settings screen

## License

© 2025 Shorty.ai. All rights reserved.
