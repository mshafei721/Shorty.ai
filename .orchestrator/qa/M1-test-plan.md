# M1 Test Plan: Recording & Teleprompter

**Milestone:** M1 (Recording & Teleprompter)
**Test Window:** 2025-10-28 to 2025-11-03
**QA Lead:** QA Agent
**Version:** 1.0
**Created:** 2025-10-06

---

## Section 1: Test Scope

### Tickets Covered
- **B1:** Camera Permissions & Error States
- **B2:** Portrait Video Capture (1080x1920@30fps, max 120s)
- **B3:** Teleprompter Overlay (opacity 0.55, WPM 80-200, font S/M/L)
- **B4:** Recording State Machine (Idle → Countdown → Recording ↔ Paused → Reviewing)
- **C2:** FileSystem Paths & File Management (raw/, processed/, temp/)
- **C3:** Video Metadata CRUD (AsyncStorage)

### Out of Scope (Deferred to Future Milestones)
- **M2:** Processing pipeline (upload, external API job creation, polling)
- **M2:** AI script generation
- **M3:** Feature selection UI (subtitles, background change, filler-word removal)
- **M4:** Export via native share sheet
- **M4:** Preview screen with playback controls

### Test Platforms
- **iOS 16:** iPhone 12 (physical device or simulator)
- **iOS 17:** iPhone 14 (physical device or simulator)
- **Android 12:** Pixel 5 (physical device or emulator)
- **Android 13:** Pixel 7 (physical device or emulator)
- **Environment:** Expo Go managed workflow (SDK 54)
- **Network Conditions:** WiFi, 4G (if available), Offline

### Test Types
1. **Functional Testing:** Verify all B1-B4, C2-C3 acceptance criteria
2. **Performance Testing:** Warm start <2s, 60fps scroll, memory usage
3. **Accessibility Testing:** VoiceOver/TalkBack, contrast, touch targets
4. **Edge Case Testing:** App backgrounding, permissions revocation, storage limits

---

## Section 2: Functional Test Cases

### B1 - Camera Permissions

**TC-B1-01: Permissions granted on first request**
- **Preconditions:** Fresh install, permissions not previously requested
- **Steps:**
  1. Launch app, navigate to Projects screen
  2. Create new project, tap + to start recording flow
  3. Observe camera/mic permission dialog
  4. Grant permissions
- **Expected:** Camera initializes, show "Camera ready" placeholder or live camera preview
- **Priority:** P0
- **Device Matrix:** All (iOS 16/17, Android 12/13)

**TC-B1-02: Permissions denied**
- **Preconditions:** Permissions not granted
- **Steps:**
  1. Navigate to Record screen
  2. Deny camera/mic permissions when prompted
- **Expected:** Modal appears with message "Camera and microphone access required. Enable in Settings." with Cancel and "Open Settings" buttons
- **Priority:** P0
- **Device Matrix:** All

**TC-B1-03: Open Settings button (iOS)**
- **Preconditions:** Permissions denied, modal visible
- **Steps:**
  1. Tap "Open Settings" button
- **Expected:** iOS Settings app opens to Shorty.ai permissions page
- **Priority:** P1
- **Device Matrix:** iOS 16, iOS 17

**TC-B1-04: Open Settings button (Android)**
- **Preconditions:** Permissions denied, modal visible
- **Steps:**
  1. Tap "Open Settings" button
- **Expected:** Android Settings app opens to app details/permissions page
- **Priority:** P1
- **Device Matrix:** Android 12, Android 13

**TC-B1-05: Permissions blocked (user denied twice)**
- **Preconditions:** User denied permissions twice (iOS) or selected "Don't ask again" (Android)
- **Steps:**
  1. Navigate to Record screen
- **Expected:** Modal appears with "Open Settings" button, no system permission dialog
- **Priority:** P1
- **Device Matrix:** All

**TC-B1-06: Permissions granted, then revoked mid-session**
- **Preconditions:** Permissions initially granted, user backgrounds app and revokes in Settings
- **Steps:**
  1. Grant permissions, reach Record screen
  2. Background app (Home button)
  3. Open device Settings, revoke camera/mic permissions
  4. Return to app
- **Expected:** Banner appears: "Camera access revoked. Recording disabled." with "Open Settings" button
- **Priority:** P1
- **Device Matrix:** All

**TC-B1-07: Cancel button on modal**
- **Preconditions:** Permissions denied, modal visible
- **Steps:**
  1. Tap Cancel button
- **Expected:** Navigate back to Projects screen
- **Priority:** P2
- **Device Matrix:** All

---

### B2 - Portrait Video Capture

**TC-B2-01: Tap Record → Countdown → Start recording**
- **Preconditions:** Permissions granted, Record screen loaded
- **Steps:**
  1. Tap Record button
- **Expected:**
  - 3-2-1 countdown overlay appears (1s per digit)
  - After countdown, recording starts
  - Record button changes to Pause/Stop buttons
  - Recording timer starts (00:00)
- **Priority:** P0
- **Device Matrix:** All

**TC-B2-02: Record 30s clip → Stop manually → Save**
- **Preconditions:** Recording in progress
- **Steps:**
  1. Record for ~30s
  2. Tap Stop button
- **Expected:**
  - Recording stops
  - Transition to Reviewing state
  - Video saved to `FileSystem.documentDirectory/videos/raw/{projectId}/raw_{projectId}_{timestamp}.mp4`
  - Metadata saved to AsyncStorage (videoId, projectId, localUri, durationSec ~30, sizeBytes, createdAt, status: 'ready')
- **Priority:** P0
- **Device Matrix:** All

**TC-B2-03: Record 120s clip → Auto-stop → Save**
- **Preconditions:** Recording in progress
- **Steps:**
  1. Record for 120s (2 minutes)
  2. Wait for auto-stop
- **Expected:**
  - Recording auto-stops at exactly 120s
  - Transition to Reviewing state
  - Video saved with durationSec ~120
- **Priority:** P0
- **Device Matrix:** iPhone 12, Pixel 5 (low-end devices)

**TC-B2-04: Storage <500MB warning**
- **Preconditions:** Device free storage <500MB
- **Steps:**
  1. Navigate to Record screen
- **Expected:**
  - Warning banner appears: "Storage low. Free up space before recording." with "Manage Storage" button
  - Record button disabled
- **Priority:** P1
- **Device Matrix:** At least one device (simulate low storage)

**TC-B2-05: Storage full during recording**
- **Preconditions:** Recording in progress, storage fills up mid-recording
- **Steps:**
  1. Start recording
  2. Simulate storage full (fill device storage)
- **Expected:**
  - Error message appears: "Storage full. Unable to save video."
  - Offer options: "Delete old videos" or "Cancel"
  - Transition to ErrorState
- **Priority:** P2
- **Device Matrix:** At least one device (manual simulation)

**TC-B2-06: Video specs verification**
- **Preconditions:** Video recorded and saved
- **Steps:**
  1. Record 30s clip, save
  2. Extract video file from device
  3. Verify with media info tool (ffprobe, MediaInfo, or similar)
- **Expected:**
  - Resolution: 1080x1920 (portrait)
  - Frame rate: 30fps
  - Audio: AAC, 44.1kHz, mono or stereo
  - Container: MP4 (H.264 video codec)
- **Priority:** P0
- **Device Matrix:** iPhone 12, Pixel 5

**TC-B2-07: File saved to correct path**
- **Preconditions:** Video recorded
- **Steps:**
  1. Record and save video
  2. Use FileSystem.getInfoAsync() or device file explorer to verify path
- **Expected:**
  - File exists at `videos/raw/{projectId}/raw_{projectId}_{timestamp}.mp4`
  - Directory `videos/raw/{projectId}/` created automatically
- **Priority:** P0
- **Device Matrix:** All

**TC-B2-08: Metadata saved correctly**
- **Preconditions:** Video recorded
- **Steps:**
  1. Record and save video
  2. Query AsyncStorage `videos` key
- **Expected:**
  - Metadata entry exists with:
    - `id`: valid UUID
    - `projectId`: matches current project
    - `type`: 'raw'
    - `localUri`: correct FileSystem path
    - `durationSec`: matches actual duration
    - `sizeBytes`: matches file size
    - `createdAt`: ISO8601 timestamp
    - `status`: 'ready'
- **Priority:** P0
- **Device Matrix:** All

---

### B3 - Teleprompter Overlay

**TC-B3-01: Script available → Teleprompter visible**
- **Preconditions:** Project has script with ≥20 words
- **Steps:**
  1. Navigate to Record screen
- **Expected:**
  - Teleprompter overlay visible at 0.55 opacity
  - Occupies lower 60% of screen
  - Script text displayed
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-02: Adjust WPM slider (80, 140, 200)**
- **Preconditions:** Teleprompter visible
- **Steps:**
  1. Adjust WPM slider to 80
  2. Observe scroll speed (if playing)
  3. Adjust to 140 (default)
  4. Observe scroll speed
  5. Adjust to 200
  6. Observe scroll speed
- **Expected:**
  - Scroll speed updates in real-time
  - Duration estimate updates (e.g., "~60s at 80 WPM", "~45s at 140 WPM", "~30s at 200 WPM")
  - Faster WPM = faster scroll
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-03: Font size toggle (S/M/L)**
- **Preconditions:** Teleprompter visible
- **Steps:**
  1. Toggle font to Small
  2. Measure/observe text size
  3. Toggle to Medium
  4. Toggle to Large
- **Expected:**
  - Small: 14pt text
  - Medium: 18pt text (default)
  - Large: 22pt text
  - Text re-renders without clipping or overflow
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-04: Tap Play → Scrolling starts**
- **Preconditions:** Teleprompter visible, paused
- **Steps:**
  1. Tap Play button
- **Expected:**
  - Teleprompter scrolls from top
  - Current sentence highlighted at 80% brightness (#FFFFFF 80%)
  - Upcoming sentences at 50% brightness
  - Past sentences at 30% brightness
  - Smooth 60fps scroll
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-05: Tap Pause → Scrolling stops**
- **Preconditions:** Teleprompter scrolling
- **Steps:**
  1. Tap Pause button
- **Expected:**
  - Scrolling stops immediately
  - Overlay dims to 40% opacity
  - Current scroll position locked (not reset)
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-06: Tap Resume → Scrolling continues from exact position**
- **Preconditions:** Teleprompter paused mid-scroll
- **Steps:**
  1. Tap Resume button
- **Expected:**
  - Scrolling resumes from exact paused position
  - Overlay returns to 55% opacity
  - No skip or jump in text position
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-07: Tap Restart → Scroll resets to top**
- **Preconditions:** Teleprompter scrolling or paused mid-scroll
- **Steps:**
  1. Tap Restart button
- **Expected:**
  - Scroll position resets to top (first sentence)
  - Scrolling pauses (user must tap Play to resume)
- **Priority:** P1
- **Device Matrix:** All

**TC-B3-08: Script empty → Teleprompter hidden**
- **Preconditions:** Project has no script or script <20 words
- **Steps:**
  1. Navigate to Record screen
- **Expected:**
  - Teleprompter overlay hidden
  - Message displayed: "Add script to enable teleprompter."
- **Priority:** P1
- **Device Matrix:** All

**TC-B3-09: Teleprompter sync with recording**
- **Preconditions:** Script available, permissions granted
- **Steps:**
  1. Tap Record button
  2. Observe countdown (3-2-1)
  3. Observe teleprompter behavior
- **Expected:**
  - Teleprompter auto-plays when recording starts (after countdown)
  - Scroll synchronized with recording timer
  - If recording paused, teleprompter pauses
  - If recording resumed, teleprompter resumes
- **Priority:** P0
- **Device Matrix:** All

**TC-B3-10: Scroll performance → 60fps**
- **Preconditions:** Teleprompter visible, scrolling at 140 WPM
- **Steps:**
  1. Enable Expo DevTools FPS monitor (shake device → "Show Perf Monitor")
  2. Start teleprompter scroll
  3. Observe FPS for 60s
- **Expected:**
  - FPS ≥60 sustained for entire scroll duration
  - No frame drops or stutters
  - Smooth visual scroll
- **Priority:** P0
- **Device Matrix:** iPhone 12, Pixel 5 (low-end baseline)

---

### B4 - Recording State Machine

**TC-B4-01: Idle → Tap Record → Countdown → Recording**
- **Preconditions:** Recording state machine in Idle state
- **Steps:**
  1. Tap Record button
- **Expected:**
  - Transition: Idle → Countdown (3s) → Recording
  - UI updates: countdown overlay, then recording timer
  - State persisted (if inspecting state machine)
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-02: Recording → Tap Pause → Paused**
- **Preconditions:** State machine in Recording state
- **Steps:**
  1. Tap Pause button
- **Expected:**
  - Transition: Recording → Paused
  - Video recording pauses
  - Teleprompter dims to 40% opacity
  - Recording timer stops
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-03: Paused → Tap Resume → Recording**
- **Preconditions:** State machine in Paused state
- **Steps:**
  1. Tap Resume button
- **Expected:**
  - Transition: Paused → Recording
  - Video recording resumes
  - Teleprompter returns to 55% opacity, scrolling continues
  - Recording timer resumes
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-04: Recording → Tap Stop → Reviewing**
- **Preconditions:** Recording in progress
- **Steps:**
  1. Tap Stop button
- **Expected:**
  - Transition: Recording → Reviewing
  - Show raw preview with Accept/Retake buttons
  - Video saved to FileSystem
  - Metadata saved to AsyncStorage
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-05: Recording → 120s auto-stop → Reviewing**
- **Preconditions:** Recording for 120s
- **Steps:**
  1. Wait for auto-stop at 120s
- **Expected:**
  - Transition: Recording → Reviewing (same as manual stop)
  - No user interaction required
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-06: Reviewing → Tap Retake → Countdown (confirm overwrite)**
- **Preconditions:** State machine in Reviewing state, raw video exists
- **Steps:**
  1. Tap Retake button
  2. Observe confirmation prompt (if video exists)
  3. Confirm overwrite
- **Expected:**
  - Confirmation prompt: "Overwrite previous recording?"
  - On confirm: Transition Reviewing → Countdown → Recording
  - Old raw video deleted
- **Priority:** P1
- **Device Matrix:** All

**TC-B4-07: Reviewing → Tap Accept → Navigate to Feature Selection**
- **Preconditions:** State machine in Reviewing state
- **Steps:**
  1. Tap Accept button
- **Expected:**
  - Transition: Reviewing → ReadyForFeatures
  - Navigate to Feature Selection screen (placeholder in M1, full impl in M3)
  - Raw video retained in FileSystem
- **Priority:** P0
- **Device Matrix:** All

**TC-B4-08: ErrorState - Permissions revoked mid-recording**
- **Preconditions:** Recording in progress, permissions granted
- **Steps:**
  1. Background app mid-recording
  2. Revoke camera/mic permissions in Settings
  3. Return to app
- **Expected:**
  - Transition: Recording → ErrorState
  - Modal appears: "Camera access lost. Recording stopped."
  - Options: "Open Settings" or "Cancel"
  - Recording stopped, partial video saved (optional)
- **Priority:** P1
- **Device Matrix:** All

**TC-B4-09: ErrorState - Storage full mid-recording**
- **Preconditions:** Recording in progress, storage fills up
- **Steps:**
  1. Simulate storage full during recording
- **Expected:**
  - Transition: Recording → ErrorState
  - Error message: "Storage full. Recording stopped."
  - Options: "Delete old videos" or "Cancel"
- **Priority:** P2
- **Device Matrix:** At least one device

---

### C2 - FileSystem Paths & File Management

**TC-C2-01: Save raw video → Directory created**
- **Preconditions:** New project created, no raw videos yet
- **Steps:**
  1. Record and save first video for project
  2. Inspect FileSystem
- **Expected:**
  - Directory created: `videos/raw/{projectId}/`
  - File saved: `raw_{projectId}_{timestamp}.mp4`
  - File naming convention matches spec
- **Priority:** P0
- **Device Matrix:** All

**TC-C2-02: Multiple projects → Separate directories**
- **Preconditions:** 2+ projects created
- **Steps:**
  1. Record video in Project A
  2. Record video in Project B
  3. Inspect FileSystem
- **Expected:**
  - Separate directories: `videos/raw/{projectA_id}/`, `videos/raw/{projectB_id}/`
  - Videos isolated per project
- **Priority:** P0
- **Device Matrix:** All

**TC-C2-03: Delete project (soft delete) → Prompt to delete videos**
- **Preconditions:** Project with 5 videos
- **Steps:**
  1. Soft delete project (set isDeleted=true)
  2. Observe confirmation prompt
  3. Confirm permanent deletion
- **Expected:**
  - Confirmation prompt: "Delete 5 videos permanently?"
  - On confirm: All video files deleted from FileSystem
  - Metadata removed from AsyncStorage
- **Priority:** P1
- **Device Matrix:** All

**TC-C2-04: Get available storage → Returns correct free space**
- **Preconditions:** Device with known free storage
- **Steps:**
  1. Call storage utility function (e.g., `getAvailableStorage()`)
  2. Cross-check with device Settings → Storage
- **Expected:**
  - Returned value matches device free space (±10% tolerance)
  - Used to trigger <500MB warning
- **Priority:** P1
- **Device Matrix:** All

**TC-C2-05: Get directory size → Returns correct size**
- **Preconditions:** Project with 3 videos (known sizes)
- **Steps:**
  1. Call utility function (e.g., `getDirectorySize('videos/raw/{projectId}')`)
- **Expected:**
  - Returns sum of all video file sizes in directory
  - Accurate within ±1KB
- **Priority:** P2
- **Device Matrix:** All

**TC-C2-06: Cleanup temp videos → Deletes all temp files**
- **Preconditions:** Temp videos exist in `videos/temp/` (created manually or from M2+ processing)
- **Steps:**
  1. Call cleanup utility (e.g., `cleanupTempVideos()`)
  2. Inspect FileSystem
- **Expected:**
  - All files in `videos/temp/` deleted
  - Directory remains (empty)
- **Priority:** P2
- **Device Matrix:** All (manual setup required)

---

### C3 - Video Metadata CRUD & Query Utilities

**TC-C3-01: Save video → Metadata stored in AsyncStorage**
- **Preconditions:** New video recorded
- **Steps:**
  1. Record and save video
  2. Query AsyncStorage `videos` key
  3. Parse JSON
- **Expected:**
  - Array contains new entry with:
    - `id`: UUID
    - `projectId`: current project ID
    - `type`: 'raw'
    - `localUri`: FileSystem path
    - `durationSec`: number
    - `sizeBytes`: number
    - `createdAt`: ISO8601 string
    - `status`: 'ready'
- **Priority:** P0
- **Device Matrix:** All

**TC-C3-02: Query videos by project → Returns only project videos**
- **Preconditions:**
  - Project A has 3 videos
  - Project B has 2 videos
  - 1 video soft-deleted (isDeleted=true)
- **Steps:**
  1. Call query utility: `getVideosByProject(projectA_id)`
- **Expected:**
  - Returns 3 videos for Project A only
  - Excludes Project B videos
  - Excludes soft-deleted videos (isDeleted=true filtered out)
- **Priority:** P0
- **Device Matrix:** All

**TC-C3-03: Update video status (e.g., processing → complete)**
- **Preconditions:** Video with status 'ready'
- **Steps:**
  1. Call update utility: `updateVideoStatus(videoId, 'processing')`
  2. Query metadata
  3. Update again: `updateVideoStatus(videoId, 'complete')`
- **Expected:**
  - First update: status changes to 'processing'
  - Second update: status changes to 'complete'
  - Metadata persisted in AsyncStorage
- **Priority:** P0
- **Device Matrix:** All (unit test + manual verification)

**TC-C3-04: Delete video → Removed from AsyncStorage and FileSystem**
- **Preconditions:** Video exists
- **Steps:**
  1. Call delete utility: `deleteVideo(videoId, deleteFile=true)`
  2. Query AsyncStorage `videos`
  3. Check FileSystem
- **Expected:**
  - Metadata entry removed from AsyncStorage
  - Video file deleted from FileSystem
  - If `deleteFile=false`, file retained but metadata removed
- **Priority:** P0
- **Device Matrix:** All

---

## Section 3: Performance Test Cases

**TC-PERF-01: Warm start (app foreground → RecordScreen) <2s**
- **Preconditions:** App already launched, backgrounded
- **Steps:**
  1. Foreground app
  2. Navigate to Projects → Select project → Tap +
  3. Measure time to camera preview visible
- **Expected:**
  - Time <2s on iPhone 12, Pixel 5
  - Time <1.5s on iPhone 14, Pixel 7
- **Measurement:** Use stopwatch or Expo DevTools Performance monitor
- **Priority:** P0
- **Device Matrix:** All

**TC-PERF-02: Cold start (app launch → RecordScreen) <4s**
- **Preconditions:** App terminated, not in memory
- **Steps:**
  1. Force quit app
  2. Launch app
  3. Navigate: Projects → Select project → Tap +
  4. Measure time to camera preview visible
- **Expected:**
  - Time <4s on iPhone 12, Pixel 5
  - Time <3s on iPhone 14, Pixel 7
- **Priority:** P0
- **Device Matrix:** All

**TC-PERF-03: Teleprompter scroll → 60fps sustained**
- **Preconditions:** Teleprompter visible, WPM=140
- **Steps:**
  1. Enable Expo DevTools Perf Monitor (shake device)
  2. Start teleprompter scroll
  3. Record FPS for 60s
  4. Calculate average FPS
- **Expected:**
  - Average FPS ≥60 over 60s
  - No frame drops >5 frames
- **Priority:** P0
- **Device Matrix:** iPhone 12, Pixel 5 (baseline low-end)

**TC-PERF-04: Memory usage during 120s recording <300MB increase**
- **Preconditions:** Baseline memory usage recorded
- **Steps:**
  1. Measure baseline memory (Expo DevTools or Xcode/Android Studio profiler)
  2. Start recording
  3. Record for 120s
  4. Measure peak memory usage
  5. Calculate delta
- **Expected:**
  - Memory increase <300MB (from baseline to peak)
  - No memory leaks (memory returns to baseline after stop)
- **Priority:** P1
- **Device Matrix:** iPhone 12, Pixel 5

**TC-PERF-05: Crash rate <5% across 50 recording sessions**
- **Preconditions:** 50 recording sessions planned
- **Steps:**
  1. Execute 50 recording sessions with variations:
     - 10 sessions: 30s clips
     - 10 sessions: 60s clips
     - 10 sessions: 120s clips (auto-stop)
     - 10 sessions: Pause/Resume mid-recording
     - 10 sessions: Simulate errors (permissions revoked, storage low)
  2. Count crashes (app force closes, unrecoverable errors)
- **Expected:**
  - ≤2 crashes in 50 sessions (4% crash rate)
  - All crashes logged with stack traces
- **Priority:** P0
- **Device Matrix:** All (distribute sessions across devices)

---

## Section 4: Accessibility Test Cases

**TC-A11Y-01: VoiceOver enabled (iOS) → All controls announced**
- **Preconditions:** VoiceOver enabled (Settings → Accessibility → VoiceOver)
- **Steps:**
  1. Navigate to Record screen
  2. Swipe through all controls with VoiceOver
  3. Verify labels announced
- **Expected:**
  - Record button: "Record video button"
  - Pause button: "Pause recording button"
  - Stop button: "Stop recording button"
  - WPM slider: "Adjust scroll speed slider, currently 140 words per minute"
  - Font toggle: "Font size toggle, currently Medium"
  - All buttons have descriptive labels
  - Focus order is logical (top to bottom)
- **Priority:** P0
- **Device Matrix:** iOS 16, iOS 17

**TC-A11Y-02: TalkBack enabled (Android) → All controls announced**
- **Preconditions:** TalkBack enabled (Settings → Accessibility → TalkBack)
- **Steps:**
  1. Navigate to Record screen
  2. Swipe through all controls with TalkBack
  3. Verify labels announced
- **Expected:**
  - Same labels as TC-A11Y-01
  - TalkBack announces recording status changes ("Recording started", "Recording paused")
- **Priority:** P0
- **Device Matrix:** Android 12, Android 13

**TC-A11Y-03: Font scaling 200% → UI adjusts without clipping**
- **Preconditions:** System font scaling set to 200% (Settings → Display → Font Size → Largest)
- **Steps:**
  1. Navigate to Record screen
  2. Inspect all text elements (buttons, labels, teleprompter)
- **Expected:**
  - All text scales up without clipping
  - No overlap between UI elements
  - Touch targets remain ≥44×44pt
  - Teleprompter text scales (may require scroll)
- **Priority:** P1
- **Device Matrix:** iPhone 12, Pixel 5

**TC-A11Y-04: Touch targets ≥44×44pt**
- **Preconditions:** Record screen visible
- **Steps:**
  1. Take screenshot of Record screen
  2. Use design tool overlay (Figma Measure plugin, or manual measurement)
  3. Measure all interactive elements
- **Expected:**
  - Record button: ≥88×88pt (large target)
  - Pause/Resume/Stop buttons: ≥44×44pt
  - WPM slider thumb: ≥44×44pt
  - Font toggle buttons: ≥44×44pt
  - "Open Settings" button (permissions modal): ≥44×44pt
- **Priority:** P0
- **Device Matrix:** All (measure on one device, verify on others)

**TC-A11Y-05: Contrast → Teleprompter text ≥4.5:1**
- **Preconditions:** Teleprompter visible
- **Steps:**
  1. Take screenshot of teleprompter overlay
  2. Use color contrast analyzer (WebAIM Contrast Checker, or similar)
  3. Measure contrast ratio for:
     - Current sentence (80% white on 55% black overlay)
     - Upcoming sentence (50% white)
     - Past sentence (30% white)
- **Expected:**
  - Current sentence: ≥4.5:1 contrast (WCAG AA)
  - Upcoming/past sentences: Best effort ≥3:1 (if possible)
  - If contrast fails, adjust overlay background color (darker)
- **Priority:** P0
- **Device Matrix:** All (measure on screenshots)

**TC-A11Y-06: Focus order → Logical tab order**
- **Preconditions:** External keyboard connected (for tab navigation testing)
- **Steps:**
  1. Navigate Record screen
  2. Use Tab key to cycle through focusable elements
- **Expected:**
  - Focus order: Top → Bottom, Left → Right
  - First focus: Record button (or first visible control)
  - No focus traps (can tab through all elements)
  - Focus indicators visible (highlight/outline)
- **Priority:** P2
- **Device Matrix:** iPhone 12 (Bluetooth keyboard), Pixel 5 (USB-C keyboard)

---

## Section 5: Edge Case Test Cases

**TC-EDGE-01: App backgrounded during recording**
- **Preconditions:** Recording in progress
- **Steps:**
  1. Press Home button (background app)
  2. Wait 10s
  3. Return to app (tap app icon)
- **Expected:**
  - Recording pauses automatically
  - On return: prompt "Resume recording?" or auto-resume
  - Recording timer shows correct elapsed time
  - No data loss
- **Priority:** P1
- **Device Matrix:** All

**TC-EDGE-02: Phone call during recording**
- **Preconditions:** Recording in progress
- **Steps:**
  1. Receive incoming phone call (simulate or actual)
  2. Answer call
  3. End call, return to app
- **Expected:**
  - Recording pauses when call starts
  - After call ends, show prompt: "Resume recording?" or auto-resume
  - Audio track unaffected (no call audio in video)
- **Priority:** P1
- **Device Matrix:** iPhone 12, Pixel 5 (require phone SIM or VoIP)

**TC-EDGE-03: Low battery (<10%) during recording**
- **Preconditions:** Device battery <10%, recording in progress
- **Steps:**
  1. Start recording
  2. Wait for low battery warning
- **Expected:**
  - Warning toast: "Low battery. Save soon or continue at your own risk."
  - User can choose: Continue or Save & Stop
  - No forced stop (allow user decision)
- **Priority:** P2
- **Device Matrix:** At least one device (drain battery manually)

**TC-EDGE-04: Network offline → No impact (M1 offline-capable)**
- **Preconditions:** Device offline (Airplane mode)
- **Steps:**
  1. Enable Airplane mode
  2. Navigate to Record screen
  3. Record 30s clip
  4. Save
- **Expected:**
  - No errors or warnings (M1 has no network dependencies)
  - Recording and saving work offline
  - Metadata saved locally
- **Priority:** P1
- **Device Matrix:** All

**TC-EDGE-05: Device rotated during recording**
- **Preconditions:** Recording in progress, portrait orientation
- **Steps:**
  1. Rotate device to landscape
  2. Rotate back to portrait
- **Expected:**
  - Recording continues unaffected (orientation locked to portrait)
  - UI remains in portrait mode (no landscape support)
  - Video remains portrait 1080x1920
- **Priority:** P2
- **Device Matrix:** All

---

## Section 6: Test Execution Schedule

### Week 1 (Oct 21-27): Permissions & Capture
- **Oct 21-23:** B1 manual testing (permissions)
  - TC-B1-01 to TC-B1-07
  - Device matrix: All 4 devices
  - Focus: Permissions flow, Settings deep link
- **Oct 24-27:** B2 manual testing (capture)
  - TC-B2-01 to TC-B2-08
  - Device matrix: All 4 devices
  - Focus: Video specs, file paths, metadata

### Week 2 (Oct 28-Nov 2): Teleprompter & State Machine
- **Oct 28-30:** B3 manual testing (teleprompter)
  - TC-B3-01 to TC-B3-10
  - Device matrix: All 4 devices
  - Focus: Scroll performance, WPM, sync
- **Oct 31-Nov 1:** B4 manual testing (state machine)
  - TC-B4-01 to TC-B4-09
  - Device matrix: All 4 devices
  - Focus: State transitions, error recovery
- **Nov 1:** C2, C3 testing (storage)
  - TC-C2-01 to TC-C2-06, TC-C3-01 to TC-C3-04
  - Device matrix: All 4 devices

### Nov 2-3: Performance & A11y Audit
- **Nov 2 AM:** Performance testing
  - TC-PERF-01 to TC-PERF-05
  - Device matrix: Focus on iPhone 12, Pixel 5 (baseline)
- **Nov 2 PM:** A11y audit
  - TC-A11Y-01 to TC-A11Y-06
  - Device matrix: iOS 16 (VoiceOver), Android 12 (TalkBack)
- **Nov 3 AM:** Edge case testing
  - TC-EDGE-01 to TC-EDGE-05
  - Device matrix: Distributed across devices
- **Nov 3 PM:** Final test report, demo video

---

## Section 7: Device Matrix

| Device | OS Version | Role | Priority |
|--------|-----------|------|----------|
| iPhone 12 | iOS 16 | Baseline low-end iOS | P0 |
| iPhone 14 | iOS 17 | Latest iOS | P1 |
| Pixel 5 | Android 12 | Baseline low-end Android | P0 |
| Pixel 7 | Android 13 | Latest Android | P1 |

**Notes:**
- Physical devices preferred (camera/mic required)
- Simulators/emulators acceptable if physical unavailable (note limitations: no real camera)
- Test on WiFi primarily, 4G if available
- Offline testing required (Airplane mode)

---

## Section 8: Bug Tracking

### GitHub Issues Template
```
**Title:** [M1-B2] Storage warning not shown when <500MB free

**Device:** iPhone 12, iOS 16.5

**Priority:** P1 (blocks recording)

**Steps to Reproduce:**
1. Fill device storage to <500MB free
2. Navigate to Record screen
3. Observe no warning banner

**Expected Behavior:**
Warning banner: "Storage low. Free up space before recording."
Record button disabled.

**Actual Behavior:**
No warning shown, recording proceeds, fails on save.

**Screenshots/Video:**
[Attach screenshot or video]

**Severity:**
P1 - Blocks core recording functionality

**Labels:** M1, bug, P1, B2
```

### Priority Definitions
- **P0 (Critical):** Blocks release, app crashes or core feature broken
- **P1 (High):** Major functionality impaired, workaround exists
- **P2 (Medium):** Minor issue, edge case, cosmetic
- **P3 (Low):** Nice-to-have, future improvement

### Bug Triage Process
1. **Discovery:** QA creates GitHub Issue with M1 label
2. **Triage:** ENG-LEAD assigns priority (P0/P1/P2/P3)
3. **Assignment:** Assign to relevant dev (FE/BEI)
4. **Fix:** Dev creates hotfix branch, submits PR
5. **Verify:** QA re-tests on same device/scenario
6. **Close:** If verified fixed, close issue

---

## Section 9: Performance Testing Details

### Warm Start Measurement
- **Tool:** Expo DevTools Performance monitor OR manual stopwatch
- **Procedure:**
  1. Launch Expo DevTools in browser (scan QR code)
  2. Navigate to Performance tab
  3. Background app
  4. Foreground app, navigate to Record screen
  5. Record "Time to Interactive" (camera preview visible)
  6. Repeat 10 times, calculate p50 (median) and p95 (95th percentile)
- **Target:**
  - p50 <2s on iPhone 12, Pixel 5
  - p95 <2.5s
- **Report:** Include table with all 10 measurements

### Teleprompter Scroll FPS
- **Tool:** Expo DevTools Perf Monitor (shake device → "Show Perf Monitor")
- **Procedure:**
  1. Enable Perf Monitor overlay
  2. Start teleprompter scroll at 140 WPM
  3. Observe FPS overlay for 60s
  4. Record min/avg/max FPS
  5. Screenshot FPS overlay (if possible)
- **Target:**
  - Avg FPS ≥60
  - Min FPS ≥55 (no sustained drops)
- **Device:** iPhone 12, Pixel 5 (low-end baseline)

### Crash Rate
- **Procedure:**
  1. Execute 50 recording sessions across 4 devices (12-13 per device)
  2. Vary scenarios: 30s/60s/120s clips, pause/resume, errors
  3. Log all crashes with stack traces (Expo crash reporter)
  4. Calculate crash rate: (crashes / total sessions) × 100%
- **Target:** <5% crash rate (≤2 crashes in 50 sessions)
- **Report:** List all crashes with:
  - Device
  - Scenario
  - Stack trace
  - Reproducibility

---

## Section 10: Accessibility Audit Details

### VoiceOver Testing (iOS)
- **Setup:**
  1. Settings → Accessibility → VoiceOver → Enable
  2. Triple-click side button to toggle VoiceOver
- **Procedure:**
  1. Navigate to Record screen with VoiceOver enabled
  2. Swipe right/left to cycle through all elements
  3. Double-tap to activate buttons
  4. Verify labels announced correctly
- **Record:** Video of audit (screen recording with VoiceOver audio)
- **Checklist:**
  - [ ] Record button labeled
  - [ ] Pause/Resume/Stop buttons labeled
  - [ ] WPM slider labeled with current value
  - [ ] Font toggle labeled with current size
  - [ ] Focus order is logical
  - [ ] Recording status changes announced ("Recording started")

### TalkBack Testing (Android)
- **Setup:**
  1. Settings → Accessibility → TalkBack → Enable
  2. Volume up + down to toggle TalkBack
- **Procedure:** Same as VoiceOver
- **Checklist:** Same as VoiceOver

### Contrast Check
- **Tool:** WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- **Procedure:**
  1. Take screenshot of teleprompter overlay
  2. Extract colors:
     - Foreground: Current sentence text (#FFFFFF at 80% opacity = #CCCCCC)
     - Background: Overlay background (0.55 opacity black over camera preview, estimate #222222)
  3. Input into WebAIM tool
  4. Verify contrast ratio ≥4.5:1
- **If fails:** Adjust overlay background to darker color (#000000) or increase text brightness

### Touch Target Measurement
- **Tool:** Figma Measure plugin OR manual measurement (ruler on screenshot)
- **Procedure:**
  1. Take screenshot of Record screen (exact pixels)
  2. Import into Figma or image editor
  3. Measure interactive elements (buttons, sliders)
  4. Convert pixels to points (iOS: 1pt = 1px @1x, 2px @2x; Android: 1dp ≈ 1px @160dpi)
- **Target:** All elements ≥44×44pt
- **Report:** Table with measurements:
  - Element | Width | Height | Pass/Fail

---

## Section 11: Demo Video Specification

### Purpose
- Demonstrate M1 recording flow for exit-review (Nov 3)
- Show permissions, countdown, capture, teleprompter, pause/resume, save

### Requirements
- **Duration:** 2-3 minutes
- **Device:** iPhone 14 (latest iOS, best quality camera for screen recording)
- **Flow:**
  1. Launch app → Navigate to Projects → Select project
  2. Tap + → Show script screen (pre-filled script ≥20 words)
  3. Navigate to Record screen
  4. Show camera preview, teleprompter overlay visible
  5. Tap Record → Countdown 3-2-1 → Recording starts
  6. Teleprompter scrolls, current sentence highlighted
  7. Record for ~30s
  8. Tap Pause → Show overlay dims, scrolling stops
  9. Tap Resume → Scrolling continues
  10. Tap Stop → Transition to Reviewing state
  11. Show raw preview with Accept/Retake buttons
  12. Tap Accept → Navigate to Feature Selection placeholder
  13. (Optional) Show FileSystem path, metadata in AsyncStorage
- **Output:** MP4, 1080p or higher, <100MB file size
- **Upload:** `.orchestrator/qa/M1-demo-video.mp4`

### Recording Tools
- **iOS:** Built-in screen recording (Control Center → Screen Recording)
- **Android:** Built-in screen recording (Quick Settings → Screen record)
- **Editing:** Trim to 2-3 minutes, add text overlay for key moments (optional)

---

## Section 12: Final Test Report Template

### Executive Summary
- **Overall Status:** Pass / Conditional Pass / Fail
- **Test Coverage:** X% test cases passed (Y out of Z total)
- **Blockers:** List P0/P1 bugs (if any)
- **Recommendation:** Sign-off for merge / Defer to M2 / Fix before merge

### Test Coverage Summary
| Category | Total Cases | Passed | Failed | Blocked | Pass Rate |
|----------|-------------|--------|--------|---------|-----------|
| B1 (Permissions) | 7 | X | Y | Z | % |
| B2 (Capture) | 8 | X | Y | Z | % |
| B3 (Teleprompter) | 10 | X | Y | Z | % |
| B4 (State Machine) | 9 | X | Y | Z | % |
| C2 (FileSystem) | 6 | X | Y | Z | % |
| C3 (Metadata) | 4 | X | Y | Z | % |
| Performance | 5 | X | Y | Z | % |
| Accessibility | 6 | X | Y | Z | % |
| Edge Cases | 5 | X | Y | Z | % |
| **Total** | **60** | **X** | **Y** | **Z** | **%** |

### Device Matrix Results
| Device | B1-B4 | C2-C3 | Perf | A11y | Edge | Status |
|--------|-------|-------|------|------|------|--------|
| iPhone 12 (iOS 16) | Pass | Pass | Pass | Pass | Pass | ✓ |
| iPhone 14 (iOS 17) | Pass | Pass | Pass | Pass | Pass | ✓ |
| Pixel 5 (Android 12) | Pass | Pass | Fail | Pass | Pass | ✗ |
| Pixel 7 (Android 13) | Pass | Pass | Pass | Pass | Pass | ✓ |

### Bug Summary
| Priority | Count | Top Issues |
|----------|-------|------------|
| P0 (Critical) | X | [M1-B2] Crash on 120s auto-stop (Pixel 5) |
| P1 (High) | Y | [M1-B3] Teleprompter scroll drops to 45fps on Android 12 |
| P2 (Medium) | Z | [M1-B1] Settings deep link slow to open (iOS 16) |
| P3 (Low) | W | [M1-B3] Font size toggle animation jerky |

### Performance Results
| Metric | Target | iPhone 12 | iPhone 14 | Pixel 5 | Pixel 7 | Status |
|--------|--------|-----------|-----------|---------|---------|--------|
| Warm Start (p50) | <2s | 1.8s | 1.5s | 2.1s | 1.7s | Pixel 5 FAIL |
| Cold Start (p50) | <4s | 3.5s | 3.0s | 3.8s | 3.2s | PASS |
| Teleprompter FPS (avg) | ≥60 | 60 | 60 | 55 | 60 | Pixel 5 FAIL |
| Memory Increase | <300MB | 250MB | 220MB | 280MB | 240MB | PASS |
| Crash Rate | <5% | 0% | 0% | 8% | 0% | Pixel 5 FAIL |

### Accessibility Audit Results
| Test | Target | iOS 16 | iOS 17 | Android 12 | Android 13 | Status |
|------|--------|--------|--------|------------|------------|--------|
| VoiceOver/TalkBack | All labeled | ✓ | ✓ | ✓ | ✓ | PASS |
| Font scaling 200% | No clipping | ✓ | ✓ | ✓ | ✓ | PASS |
| Touch targets | ≥44pt | ✓ | ✓ | ✓ | ✓ | PASS |
| Contrast (current sentence) | ≥4.5:1 | 5.2:1 | 5.2:1 | 5.2:1 | 5.2:1 | PASS |
| Focus order | Logical | ✓ | ✓ | ✓ | ✓ | PASS |

### Screenshots/Videos
- [M1-demo-video.mp4](.orchestrator/qa/M1-demo-video.mp4)
- [Screenshots folder](.orchestrator/qa/screenshots/)
  - B1-permissions-modal.png
  - B2-countdown-3.png
  - B3-teleprompter-overlay.png
  - B4-reviewing-state.png

### Recommendations
1. **Pixel 5 Performance Issues (P0):**
   - Warm start exceeds 2s target (2.1s)
   - Teleprompter scroll drops to 55fps (target ≥60fps)
   - Crash rate 8% (target <5%)
   - **Recommendation:** Optimize camera initialization, teleprompter rendering for low-end Android before M1 merge
2. **All Other Tests (P1):**
   - Minor issues acceptable (P2/P3 deferred to M2 backlog)
   - **Recommendation:** Conditional sign-off, fix Pixel 5 issues first
3. **Demo Video:**
   - Ready for exit-review presentation
   - Showcases core M1 features successfully

---

## Section 13: Test Execution Tracking

### Test Case Execution Log
Use this table to track progress during test execution:

| Test Case | Device | Tester | Status | Date | Notes |
|-----------|--------|--------|--------|------|-------|
| TC-B1-01 | iPhone 12 | QA | Pending | - | - |
| TC-B1-01 | iPhone 14 | QA | Pending | - | - |
| TC-B1-01 | Pixel 5 | QA | Pending | - | - |
| TC-B1-01 | Pixel 7 | QA | Pending | - | - |
| ... | ... | ... | ... | ... | ... |

**Status values:** Pending, In Progress, Pass, Fail, Blocked

---

## Appendix A: Tools & Resources

### Test Tools
- **Expo DevTools:** Performance monitor, FPS overlay, memory profiler
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **ffprobe (video specs):** https://ffmpeg.org/ffprobe.html
- **Figma Measure Plugin:** Touch target measurement
- **iOS Settings:** Accessibility → VoiceOver
- **Android Settings:** Accessibility → TalkBack

### Reference Documents
- **PRD:** [PRD.md](../../PRD.md) - Sections 10, 14 (Recording, Teleprompter)
- **CLAUDE.md:** [CLAUDE.md](../../CLAUDE.md) - M1 context
- **M1 Kickoff:** [.orchestrator/M1-kickoff-messages.md](../M1-kickoff-messages.md)
- **M1 Summary:** [.orchestrator/milestone-summaries/M1.md](../milestone-summaries/M1.md)

### GitHub Issues
- **M1 Bug Tracker:** https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1
- **Label Filters:** M1, bug, P0, P1, P2, P3, B1, B2, B3, B4, C2, C3

---

## Appendix B: Risks & Mitigations

### Testing Risks
1. **Physical devices unavailable:**
   - Mitigation: Use simulators/emulators, note limitations (no real camera)
   - Fallback: Borrow devices from team, use cloud device farms (BrowserStack, AWS Device Farm)
2. **Expo SDK 54 camera issues:**
   - Mitigation: Test on multiple OS versions (iOS 16/17, Android 12/13)
   - Fallback: Coordinate with ENG-LEAD for expo-camera workaround
3. **Performance targets unmet:**
   - Mitigation: Optimize during test execution, prioritize low-end devices
   - Escalation: Report to ENG-LEAD for architecture review
4. **A11y audit fails:**
   - Mitigation: Coordinate with PD for design adjustments (contrast, labels)
   - Escalation: Block release if WCAG AA not met (Critical priority)

---

**Document Status:** Draft v1.0
**Next Review:** 2025-10-25 (after test plan finalized)
**Owner:** QA Lead
**Last Updated:** 2025-10-06
