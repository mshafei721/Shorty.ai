# M1 Architecture Review Notes: Recording & Teleprompter

**Reviewer:** Engineering Lead
**Date:** 2025-10-06
**Milestone:** M1 (Oct 21 - Nov 3, 2025)
**Branch:** `milestone/M1-recording-teleprompter`
**Status:** Architecture Approved with Recommendations

---

## Executive Summary

**Verdict:** ✅ **APPROVED FOR IMPLEMENTATION** with 3 P1 recommendations

The M1 architecture (expo-camera integration, FileSystem storage, state machines) is **sound and implementable** on Expo SDK 54. The foundation from M0 provides excellent scaffolding (AsyncStorage schema, permissions utilities, circuit breaker config). **No P0 blockers identified.**

**Key Findings:**
- ✅ expo-camera SDK 54 compatible (v17.0.8 installed)
- ⚠️ `pictureSize` API has known inconsistencies → mitigation required
- ✅ State machines deterministic and testable
- ✅ FileSystem structure prevents directory traversal
- ⚠️ Teleprompter scroll performance needs 60fps validation
- ✅ Circuit breaker config includes M2 thresholds

**Confidence Level:** 85% (high) — proceed with implementation, address P1 items in first sprint.

---

## 1. expo-camera Configuration Analysis

### 1.1 SDK 54 Compatibility ✅

**Finding:** expo-camera v17.0.8 is confirmed compatible with Expo SDK 54 (React Native 0.81.4).

**Evidence:**
- `package.json` shows `"expo-camera": "^17.0.8"` installed
- Expo SDK 54 changelog confirms camera API stable
- Context7 docs show `CameraView` API (replaces legacy `Camera` component in SDK 52+)

**Recommendation:** Use modern `CameraView` API, not deprecated `Camera` component.

```typescript
// ✅ CORRECT (SDK 52+)
import { CameraView, useCameraPermissions } from 'expo-camera';

// ❌ AVOID (deprecated in SDK 52)
import { Camera } from 'expo-camera';
```

### 1.2 Portrait 1080x1920 @30fps Configuration ⚠️

**Status:** Achievable with caveats

**Analysis:**
1. **Resolution Setting:** expo-camera uses `pictureSize` prop for photo capture, but **does NOT directly control video recording resolution** in SDK 54.
2. **Video Recording:** Resolution determined by `Camera.recordAsync()` options, which defaults to device-dependent values.
3. **Known Issues:** GitHub issues #2874 and #31077 document `pictureSize` inconsistencies across Android devices.

**Recommended Approach:**

**Option A (Recommended):** Post-processing resize strategy
```typescript
// Record at device's maximum quality, resize post-capture
const recording = await cameraRef.current?.recordAsync({
  quality: Camera.Constants.VideoQuality['1080p'], // Not guaranteed 1080x1920
  maxDuration: 120,
  codec: Camera.Constants.VideoCodec.H264,
  videoBitrate: 8_000_000, // 8 Mbps
  audioBitrate: 128_000, // 128 kbps
});

// After recording, use ImageManipulator or backend processing to ensure 1080x1920
```

**Option B (Fallback):** react-native-vision-camera
- Context7 shows `react-native-vision-camera` (trust score 10/10) offers granular format control
- **Tradeoff:** Requires custom native module → violates Expo Go managed workflow constraint
- **Use only if:** Option A fails validation during M1 testing

**Action Item for FE Dev 1:**
- [ ] Test `Camera.Constants.VideoQuality['1080p']` on iPhone 12 & Pixel 5
- [ ] Verify aspect ratio is 9:16 (portrait)
- [ ] If incorrect, implement post-recording resize via expo-image-manipulator or backend adapter
- [ ] Document actual recorded resolution in telemetry

### 1.3 Frame Rate (30fps) ✅

**Finding:** Expo-camera defaults to 30fps for video recording on both platforms.

**Validation:** Run `Camera.getAvailableCameraTypesAsync()` to confirm 30fps support. No custom config needed.

### 1.4 Permissions Handling ✅

**Review of `src/utils/permissions.ts`:**
- ✅ Uses modern `useCameraPermissions()` hook
- ✅ Handles `canAskAgain === false` (blocked state) correctly
- ✅ Deep link to settings works on iOS (`app-settings:`) and Android (`Linking.openSettings()`)

**Code Quality:** Excellent. No changes needed.

**Security Check:**
- ✅ No user-controlled paths in permissions code
- ✅ Error boundaries catch permission failures

---

## 2. FileSystem Directory Structure Validation

### 2.1 Proposed Structure ✅

**Spec from PRD:**
```
FileSystem.documentDirectory/
  videos/
    raw/{projectId}/{timestamp}.mp4
    processed/{videoId}_{timestamp}.mp4
    temp/{videoId}.mp4
```

**Analysis:**
- ✅ Namespaced under `videos/` (prevents collision with Expo internals)
- ✅ `raw/` uses `{projectId}` subdirectory → enables bulk cleanup on project delete
- ✅ `processed/` flat structure → faster lookups by videoId
- ✅ `temp/` ephemeral files deleted post-upload

### 2.2 Path Validation & Security 🔐

**Review of `src/utils/fileNaming.ts`:**
- ✅ UUID validation (`validateUUID()`) prevents directory traversal via `../` injection
- ✅ Filename regex enforces `raw_{uuid}_{timestamp}.mp4` format
- ✅ No user-controlled path components

**Recommendation:** Add path sanitization helper for future use:

```typescript
// Add to src/utils/fileNaming.ts
import * as FileSystem from 'expo-file-system';

export function sanitizeFilePath(filename: string): string {
  // Block directory traversal
  if (filename.includes('..') || filename.includes('~')) {
    throw new Error('Invalid filename: directory traversal detected');
  }

  // Only allow alphanumeric, hyphen, underscore, dot
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    throw new Error('Invalid filename: contains unsafe characters');
  }

  return filename;
}

export function ensureDirectoryExists(dirPath: string): Promise<void> {
  return FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
}
```

**Security Checklist:**
- ✅ No symlink traversal risk (FileSystem API doesn't follow symlinks)
- ✅ UUID validation prevents injection attacks
- ✅ All writes scoped to `documentDirectory` (sandboxed)

### 2.3 Storage Quota Handling ✅

**Spec:** Warn if <500MB free, block recording.

**Recommendation:** Implement `checkStorageQuota()` utility:

```typescript
// Add to src/utils/storage.ts
import * as FileSystem from 'expo-file-system';

export async function checkStorageQuota(): Promise<{
  freeSpace: number; // bytes
  totalSpace: number; // bytes
  canRecord: boolean;
}> {
  const info = await FileSystem.getFreeDiskStorageAsync();
  const freeSpaceMB = info / (1024 * 1024);

  return {
    freeSpace: info,
    totalSpace: 0, // Not exposed by FileSystem API
    canRecord: freeSpaceMB >= 500,
  };
}
```

**Action Item for FE Dev 2:**
- [ ] Call `checkStorageQuota()` before recording starts
- [ ] Show banner if `canRecord === false`
- [ ] Test on device with <500MB free

### 2.4 Cleanup Logic on Project Delete ⚠️

**Concern:** Soft delete (`isDeleted: true`) retains videos on disk until user confirms hard delete.

**Recommendation:** Implement two-step delete:

```typescript
// In project CRUD logic
async function softDeleteProject(projectId: string) {
  // Mark project as deleted (reversible)
  const projects = await getProjects();
  const updated = projects.map(p =>
    p.id === projectId ? { ...p, isDeleted: true } : p
  );
  await AsyncStorage.setItem('projects', JSON.stringify(updated));
}

async function hardDeleteProject(projectId: string) {
  // Show confirmation dialog with video count
  const videos = await getVideosForProject(projectId);

  Alert.alert(
    'Delete Permanently?',
    `This will delete ${videos.length} videos and free up ${formatBytes(getTotalSize(videos))}.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        // Delete raw videos directory
        const rawDir = `${FileSystem.documentDirectory}videos/raw/${projectId}/`;
        await FileSystem.deleteAsync(rawDir, { idempotent: true });

        // Delete processed videos (filter by projectId)
        for (const video of videos.filter(v => v.type === 'processed')) {
          await FileSystem.deleteAsync(video.localUri, { idempotent: true });
        }

        // Remove from AsyncStorage
        await softDeleteProject(projectId);
      }}
    ]
  );
}
```

**Action Item for FE Dev 2:**
- [ ] Implement two-step delete with size calculation
- [ ] Test with 10+ videos to verify full cleanup
- [ ] Log cleanup failures to Sentry (non-blocking)

---

## 3. State Machine Validation

### 3.1 Recording State Machine ✅

**Spec from plan.md:**
```
Idle → [Tap Record] → Countdown → Recording ↔ Paused → Reviewing → ReadyForFeatures
```

**Analysis:**
- ✅ Deterministic transitions (no ambiguous edges)
- ✅ Error transitions defined (permissions revoked → ErrorState)
- ✅ Auto-stop at 120s → Reviewing (time-bounded)

**Recommendation:** Implement with XState or simple reducer:

```typescript
// Recommended: XState for complex state logic
import { createMachine } from 'xstate';

const recordingMachine = createMachine({
  id: 'recording',
  initial: 'idle',
  states: {
    idle: {
      on: { TAP_RECORD: 'countdown' }
    },
    countdown: {
      after: { 3000: 'recording' },
      on: { CANCEL: 'idle' }
    },
    recording: {
      on: {
        PAUSE: 'paused',
        STOP: 'reviewing',
        AUTO_STOP: 'reviewing', // 120s timeout
        ERROR: 'errorState',
      }
    },
    paused: {
      on: {
        RESUME: 'recording',
        CANCEL: 'idle',
      }
    },
    reviewing: {
      on: {
        ACCEPT: 'readyForFeatures',
        RETAKE: 'countdown',
      }
    },
    readyForFeatures: { type: 'final' },
    errorState: {
      on: { RETRY: 'idle' }
    }
  }
});
```

**Testing Strategy:**
- Unit tests: Assert all transitions (jest + @xstate/test)
- Integration tests: Walk through full flow with Detox
- Edge cases: Backgrounding during recording, permissions revoked mid-recording

**Coverage Target:** ≥90% (per plan.md)

### 3.2 Teleprompter State Machine ✅

**Spec from plan.md:**
```
Hidden → [Script available] → VisiblePaused → [Start] → Scrolling ↔ [Pause] → VisiblePaused
```

**Analysis:**
- ✅ Sync'd with recording state (teleprompter pauses when recording pauses)
- ✅ Restart transition (Completed → Scrolling)
- ✅ Fallback to static script on overlay error

**Race Condition Check:**
- ⚠️ Teleprompter scroll position must persist across Paused → Scrolling transition
- ✅ Use `useRef` to store scroll offset (not state to avoid re-renders)

**Recommendation:**

```typescript
const scrollOffsetRef = useRef(0);

const handlePause = () => {
  scrollOffsetRef.current = currentScrollY; // Capture position
  setTeleprompterState('VisiblePaused');
};

const handleResume = () => {
  // Resume from exact position
  scrollViewRef.current?.scrollTo({ y: scrollOffsetRef.current, animated: false });
  setTeleprompterState('Scrolling');
};
```

### 3.3 Error Transitions 🔐

**Critical Scenarios:**

1. **Permissions Revoked Mid-Recording:**
   - Transition: `Recording → ErrorState`
   - UX: Save partial recording, show "Permissions revoked. Grant access to continue."
   - Implementation: Listen to `AppState` changes, re-check permissions on foreground

2. **Storage Full During Recording:**
   - Transition: `Recording → ErrorState`
   - UX: Save partial recording (if ≥5s), show "Storage full. Free up space."
   - Implementation: Check free space every 10s during recording

3. **App Backgrounded:**
   - iOS: Recording stops automatically (OS limitation)
   - Android: Recording continues in background (with notification)
   - Transition: `Recording → Paused` (iOS) or no transition (Android)

**Action Item for FE Dev 1:**
- [ ] Implement AppState listeners for permission/storage checks
- [ ] Test all error transitions on both platforms
- [ ] Log error transitions to telemetry

---

## 4. Teleprompter Performance (60fps Requirement)

### 4.1 Scroll Performance Analysis ⚠️

**Requirement:** Teleprompter must scroll at 60fps (16ms frame budget).

**Concern:** React Native `ScrollView` with dynamic content may drop frames at WPM 200 (3.3 words/sec).

**Recommended Approaches:**

**Option A (Preferred):** React Native Animated API
```typescript
import { Animated, Easing } from 'react-native';

const scrollY = useRef(new Animated.Value(0)).current;

const startScrolling = (wpm: number, totalHeight: number, durationSec: number) => {
  Animated.timing(scrollY, {
    toValue: totalHeight,
    duration: durationSec * 1000,
    easing: Easing.linear,
    useNativeDriver: true, // 60fps native thread
  }).start();
};
```

**Option B (Fallback):** react-native-reanimated
- Higher performance for complex gestures
- **Tradeoff:** Larger bundle size (+200KB)
- **Use if:** Option A drops frames during testing

**Performance Validation:**
- [ ] Profile with React DevTools Profiler at WPM 80, 140, 200
- [ ] Measure frame rate with `perf monitor` in Expo Dev Client
- [ ] Pass criteria: ≥55fps avg at WPM 200 (11ms frame time)

**Action Item for FE Dev 1:**
- [ ] Implement Option A (Animated API with `useNativeDriver`)
- [ ] If <55fps at WPM 200, escalate to Option B (Reanimated)
- [ ] Document performance metrics in M1 testing report

### 4.2 Highlighting Current Sentence ✅

**Spec:** Current sentence 80% brightness, upcoming 50%, past 30%.

**Recommendation:** Use memoized highlight state:

```typescript
const highlightedWords = useMemo(() => {
  return words.map((word, idx) => ({
    ...word,
    brightness: idx === currentWordIndex ? 0.8 : idx > currentWordIndex ? 0.5 : 0.3,
  }));
}, [words, currentWordIndex]);
```

**Memory Optimization:** For scripts >300 words, virtualize with `FlatList` instead of `ScrollView`.

---

## 5. Circuit Breaker Config Review (M2 Preparation)

### 5.1 Existing Config Analysis ✅

**Review of `src/config/circuit-breakers.ts`:**
- ✅ Includes all M2 thresholds (transcription, composition, encoding)
- ✅ Latency p95 <180s for 60s clip (composition)
- ✅ Error rate <5% threshold
- ✅ Cost per clip <$0.50
- ✅ Webhook failure rate monitoring (99% delivery target)

**Code Quality:** Excellent. Well-documented, testable functions (`isSLABreach()`, `calculateUptime()`).

### 5.2 Testing Recommendations ✅

**Action Item for FE Dev 2 (or Backend Integrator):**
- [ ] Unit test `isSLABreach()` with edge cases:
  - Exactly at threshold (should NOT breach)
  - 1ms over threshold (should breach)
  - Zero requests (should return uptime 100%)
- [ ] Unit test `getCircuitBreakerConfig()` with env override:
  - Test environment: `enabled: false`
  - Dev environment: 2× latency/error tolerance
- [ ] Mock circuit breaker state transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)

**Coverage Target:** ≥95% for circuit breaker logic (critical path for M2).

---

## 6. Security Review 🔐

### 6.1 Permissions Handling ✅

**Finding:** Graceful error states implemented.

**Evidence:**
- `src/utils/permissions.ts` returns `'blocked'` when `canAskAgain === false`
- `src/components/PermissionModal.tsx` shows "Open Settings" button
- Deep link to settings tested on iOS & Android

**Recommendation:** Add telemetry for permission denial:

```typescript
// In permissions.ts
export async function requestCameraPermissions(): Promise<PermissionResult> {
  const result = await Camera.requestCameraPermissionsAsync();

  if (result.status === 'denied') {
    trackEvent('permission_denied', { type: 'camera' });
  }

  return result.status === 'granted' ? 'granted' : 'denied';
}
```

### 6.2 File Paths (Directory Traversal Prevention) ✅

**Finding:** UUID validation prevents injection.

**Evidence:**
- `validateUUID()` regex blocks `../`, `~/`, and non-alphanumeric chars
- All file writes scoped to `FileSystem.documentDirectory`

**No changes needed.**

### 6.3 Raw Video Deletion (User Confirmation) ✅

**Spec:** Prompt user before discarding raw video.

**Recommendation:** Implement two-option dialog:

```typescript
Alert.alert(
  'Discard Recording?',
  'This will permanently delete the raw video (cannot be undone).',
  [
    { text: 'Keep Video', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => {
      FileSystem.deleteAsync(rawVideoUri, { idempotent: true });
      trackEvent('raw_video_discarded', { projectId, videoId });
    }}
  ]
);
```

**Action Item for FE Dev 1:**
- [ ] Show dialog on Retake (overwrite) and Cancel (discard)
- [ ] Test with airplane mode (ensure local delete works offline)

### 6.4 Privacy (No PII Transmitted) ✅

**Spec:** Local-only storage, no cloud backup.

**Validation:**
- ✅ No network calls in recording flow (all local)
- ✅ Telemetry toggle defaults to OFF (`src/analytics/telemetry.ts`)
- ✅ AsyncStorage keys contain only UUIDs (no user names/emails)

**Recommendation:** Add privacy audit checklist to PR template:
- [ ] No new network calls in recording/preview flow
- [ ] No PII in logs or telemetry (use UUIDs only)
- [ ] All file writes scoped to `documentDirectory`

---

## 7. Performance Checklist ⚡

### 7.1 Warm Start Target (<2s) ✅

**Current Status:** M0 warm start measured at ~1.8s (iPhone 12 Simulator).

**M1 Impact:** Adding camera initialization may add +300-500ms.

**Mitigation:**
- Lazy load camera: Only initialize on Record screen mount
- Defer non-critical renders (settings, analytics)

**Validation:** Measure with React Native Performance Monitor.

### 7.2 Teleprompter Scroll (60fps) ⚠️

**See §4.1 above.** Use `useNativeDriver: true` for 60fps native thread execution.

### 7.3 Camera Initialization Latency ✅

**Recommendation:** Pre-warm camera 500ms before user taps Record:

```typescript
useEffect(() => {
  // Pre-warm camera when user lands on Script screen
  const timer = setTimeout(() => {
    Camera.requestCameraPermissionsAsync(); // Background request
  }, 500);

  return () => clearTimeout(timer);
}, []);
```

### 7.4 Memory (120s @30fps ~80MB) ✅

**Finding:** 120s video at 30fps, 8 Mbps bitrate = ~72MB raw file.

**Recommendation:**
- Monitor memory usage with `Performance.memory` API (Chrome DevTools)
- Test on iPhone 12 (4GB RAM) and Pixel 5 (8GB RAM)
- If memory warnings occur, reduce bitrate to 6 Mbps

**Pass Criteria:** No memory warnings during 120s recording on iPhone 12.

---

## 8. Recommendations for FE Dev 1 & FE Dev 2

### 8.1 FE Dev 1 (Camera & Teleprompter) - Priority Order

**P1 (Must Fix Before Implementation):**
1. **Validate 1080x1920 Resolution:**
   - Test `VideoQuality['1080p']` on iPhone 12 & Pixel 5
   - If incorrect, implement post-processing resize (expo-image-manipulator or backend)
   - Document actual resolution in telemetry

2. **Implement Teleprompter Scroll Performance:**
   - Use Animated API with `useNativeDriver: true`
   - Profile at WPM 200, target ≥55fps
   - Escalate to Reanimated if <55fps

3. **Error Transitions for Recording State Machine:**
   - AppState listeners for permission/storage checks
   - Test permissions revoked mid-recording
   - Test storage full during recording

**P2 (Important, Non-Blocking):**
4. Pre-warm camera on Script screen (reduces perceived latency)
5. Implement confirmation dialog for Retake/Discard
6. Add telemetry for permission denials

**P3 (Nice-to-Have):**
7. Virtualize teleprompter text with FlatList (>300 words)

### 8.2 FE Dev 2 (Storage & Data Model) - Priority Order

**P1 (Must Fix Before Implementation):**
1. **Implement Storage Quota Check:**
   - `checkStorageQuota()` utility (see §2.3)
   - Call before recording starts
   - Test on device with <500MB free

2. **Two-Step Project Delete:**
   - Soft delete (reversible) + hard delete (confirmation with size)
   - Test with 10+ videos to verify cleanup
   - Log cleanup failures to Sentry

3. **Unit Tests for Circuit Breaker Logic:**
   - Test `isSLABreach()`, `getCircuitBreakerConfig()`
   - Target ≥95% coverage (critical for M2)

**P2 (Important, Non-Blocking):**
4. Add `sanitizeFilePath()` helper (see §2.2)
5. Implement `ensureDirectoryExists()` wrapper
6. Add privacy audit checklist to PR template

**P3 (Nice-to-Have):**
7. Storage usage breakdown in Settings screen

---

## 9. Testing Strategy

### 9.1 Unit Tests (≥90% Coverage)

**Recording State Machine:**
- [ ] All state transitions (idle → countdown → recording → paused → reviewing)
- [ ] Error transitions (permissions revoked, storage full)
- [ ] Auto-stop at 120s

**Teleprompter State Machine:**
- [ ] Pause/resume maintains scroll position
- [ ] Restart resets to top
- [ ] Sync with recording state

**FileSystem Utils:**
- [ ] UUID validation (valid/invalid inputs)
- [ ] Filename generation (raw/processed)
- [ ] Filename parsing (regex matches)

**Circuit Breaker Logic:**
- [ ] `isSLABreach()` edge cases
- [ ] Environment overrides (test/dev/prod)
- [ ] State transitions (CLOSED → OPEN → HALF_OPEN)

### 9.2 Integration Tests (Detox or Maestro)

**Happy Path:**
1. Grant permissions → Record 30s → Review → Accept → Navigate to Features

**Error Paths:**
1. Deny permissions → Show modal → Open Settings
2. Storage <500MB → Show banner → Block recording
3. Revoke permissions mid-recording → Save partial → Show error

**Performance:**
1. Teleprompter scroll at WPM 200 → Profile FPS
2. Warm start time (app foreground → Record screen interactive)

### 9.3 Device Matrix (Manual Testing)

| Device | OS | Network | Storage | Permissions |
|--------|----|---------|---------| ------------|
| iPhone 12 | iOS 16 | WiFi | 10GB free | Granted |
| iPhone 12 | iOS 16 | Offline | <500MB | Denied → Granted |
| Pixel 5 | Android 12 | 4G | 5GB free | Granted |
| Pixel 5 | Android 12 | Airplane Mode | <500MB | Blocked |

---

## 10. P0 Blockers (None Identified)

**Status:** ✅ **NO BLOCKERS**

All identified issues are P1 (fixable during implementation) or P2 (non-blocking improvements).

---

## 11. Risk Mitigation

### 11.1 Risk: expo-camera Resolution Inconsistency

**Probability:** Medium (40%) — Known GitHub issues on Android
**Impact:** High — Breaks 1080x1920 requirement
**Mitigation:**
- Implement post-processing resize (backend or expo-image-manipulator)
- Test on 3+ Android devices (Samsung, Pixel, OnePlus)
- Document fallback to react-native-vision-camera if unresolvable

**Escalation Path:**
1. Test on target devices (Week 1 of M1)
2. If resolution incorrect, implement resize (Week 2)
3. If resize fails, escalate to Eng Lead for vision-camera evaluation

### 11.2 Risk: Teleprompter Frame Drops at WPM 200

**Probability:** Low (20%) — Animated API generally performant
**Impact:** Medium — Poor UX for fast readers
**Mitigation:**
- Use `useNativeDriver: true` (offload to native thread)
- Fallback to Reanimated if <55fps
- Virtualize text with FlatList for >300 words

**Pass Criteria:** ≥55fps at WPM 200 on iPhone 12 & Pixel 5.

### 11.3 Risk: Memory Pressure During 120s Recording

**Probability:** Low (15%) — Modern devices handle 80MB files
**Impact:** Medium — App crash or recording failure
**Mitigation:**
- Test on iPhone 12 (4GB RAM, worst case)
- Reduce bitrate to 6 Mbps if memory warnings occur
- Implement memory monitoring with `Performance.memory`

**Pass Criteria:** No memory warnings during 120s recording on iPhone 12.

---

## 12. Approval & Next Steps

### 12.1 Architecture Approval ✅

**Verdict:** ✅ **APPROVED FOR IMPLEMENTATION**

**Conditions:**
- Address 3 P1 recommendations (see §8) in first sprint (Week 1 of M1)
- Complete unit test coverage (≥90%) for state machines
- Validate resolution & FPS on target devices before B2 kickoff

### 12.2 Implementation Order

**Week 1 (Oct 21-27):**
1. FE Dev 1: Implement Recording State Machine (B4 from plan.md)
2. FE Dev 2: Implement Storage Quota Check (C2 from plan.md)
3. **Validation:** Test resolution on iPhone 12 & Pixel 5

**Week 2 (Oct 28-Nov 3):**
1. FE Dev 1: Implement Teleprompter Overlay (B3 from plan.md)
2. FE Dev 2: Implement Two-Step Delete (C2 from plan.md)
3. **Validation:** Profile teleprompter FPS at WPM 200

### 12.3 Documentation to Update

**Before B2 Kickoff (Oct 23):**
- [ ] Update `CLAUDE.md` §4.2 (FileSystem paths) with sanitization helpers
- [ ] Add M1 testing checklist to `.orchestrator/M1-testing-plan.md`
- [ ] Document known expo-camera limitations in `docs/architecture/camera-config.md`

**After M1 Complete (Nov 3):**
- [ ] Update `M0-STATUS.md` → `M1-STATUS.md` with test results
- [ ] Add performance metrics (FPS, resolution, warm start) to status report
- [ ] Document any fallbacks used (vision-camera, Reanimated) in architecture docs

---

## 13. References

**Documents Reviewed:**
- `PRD.md` §10 (Recording), §14 (Teleprompter)
- `plan.md` Epic B (Capture & Teleprompter), Epic C (Storage)
- `src/config/circuit-breakers.ts` (M2 thresholds)
- `src/utils/permissions.ts` (permissions handling)
- `src/utils/fileNaming.ts` (path validation)
- `src/storage/schema.ts` (data model)
- `docs/architecture/adapters.md` (provider-agnostic design)
- Expo SDK 54 Changelog
- expo-camera v17.0.8 documentation (Context7)
- GitHub Issues #2874, #31077 (pictureSize inconsistencies)

**External References:**
- react-native-vision-camera (Context7 Trust Score 10/10)
- XState documentation (state machine library)
- React Native Animated API (performance best practices)

---

## Appendix A: Quick Reference Checklist

**FE Dev 1 (Camera & Teleprompter):**
- [ ] P1: Validate 1080x1920 resolution on devices
- [ ] P1: Implement Animated API teleprompter (60fps)
- [ ] P1: Error transitions (permissions, storage)
- [ ] P2: Pre-warm camera on Script screen
- [ ] P2: Confirmation dialogs (Retake/Discard)
- [ ] P3: Virtualize teleprompter text (>300 words)

**FE Dev 2 (Storage & Data Model):**
- [ ] P1: Storage quota check utility
- [ ] P1: Two-step delete with size confirmation
- [ ] P1: Unit tests for circuit breaker (≥95% coverage)
- [ ] P2: `sanitizeFilePath()` helper
- [ ] P2: Privacy audit checklist
- [ ] P3: Storage breakdown in Settings

**Eng Lead (Oversight):**
- [ ] Review P1 implementations in Week 1
- [ ] Approve expo-camera resolution fallback strategy
- [ ] Review teleprompter FPS profiling results
- [ ] Sign off on M1 completion criteria

---

**End of Architecture Review**

**Status:** Ready for M1 Implementation (Oct 21)
**Next Review:** M1 Completion Retrospective (Nov 3)
