# M1 Kickoff Messages - Recording & Teleprompter

**Milestone:** M1 (Recording & Teleprompter)
**Window:** 2025-10-21 to 2025-11-03 (2 weeks)
**Mid-Review:** 2025-10-27
**Exit-Review:** 2025-11-03
**Branch:** `milestone/M1-recording-teleprompter`

---

## Message 1: To ENG-LEAD (Engineering Lead)

**From:** ORCH
**To:** ENG-LEAD
**Ref:** plan.md > M1 Recording & Teleprompter

### Objective
Provide architectural guidance for M1 capture/teleprompter implementation, review PRs, enforce circuit breaker patterns, and coordinate technical risk mitigation.

### Context
M0 Foundations complete with 57.77% unit coverage. M1 introduces expo-camera integration, FileSystem storage, and complex state machines (Recording, Teleprompter). No external API calls in M1 (processing deferred to M2), but must scaffold telemetry hooks for future cost tracking.

### Task List
1. Review and approve architecture for:
   - expo-camera configuration (1080x1920@30fps portrait)
   - FileSystem directory structure (raw/, processed/, temp/)
   - Recording state machine (Idle → Countdown → Recording ↔ Paused → Reviewing → ReadyForFeatures)
   - Teleprompter state machine (Hidden → VisiblePaused → Scrolling ↔ Paused → Completed)
2. Validate circuit-breaker config in `src/config/circuit-breakers.ts` covers future processing latency/error thresholds
3. Review all M1 PRs for:
   - SOLID principles, DRY violations
   - Error handling patterns
   - Performance (warm start <2s, 60fps scroll)
   - Security (permissions handling, file path validation)
4. Coordinate with FE on permissions UX (Settings deep link for denied access)
5. Sign off on test coverage (≥80% for state machines, storage utils)

### Acceptance Criteria
**Given:** M1 tickets B1-B4, C2-C3 submitted for review
**When:** ENG-LEAD reviews architecture and PRs
**Then:**
- All PRs approved with zero P0 architectural issues
- Circuit breaker config includes placeholder thresholds for M2 processing (p95 <180s, error rate <5%)
- State machine unit tests achieve ≥90% coverage
- Recording warm start <2s verified on iPhone 12/Pixel 5

### Constraints
- Expo Go only (no custom native modules)
- All thresholds from prompt: opacity=0.55, WPM 80-200 (default 140), max 120s recording, 1080x1920 portrait

### Branch Plan
- **Milestone Branch:** `milestone/M1-recording-teleprompter`
- **Feature Branches:** Review PRs from `feature/capture-B*` and `feature/storage-C*`
- **Commits:** Conventional Commits + ticket ID (e.g., `feat(B2): add portrait 1080x1920 capture`)
- **PR Template:** Summary | Scope | Screenshots | Tests | Risks | Rollback
- **Checks:** typecheck, lint, unit (≥80%), integration, e2e, a11y, bundle
- **Approvals:** ENG-LEAD + QA required

### Due Date
- **Mid-Review:** 2025-10-27 (architecture review checkpoint)
- **Exit-Review:** 2025-11-03 (final signoff before merge to main)

### Artifacts Requested
1. Architecture review notes (doc or comments in PRs)
2. Circuit breaker config validation (checklist)
3. PR approval comments with any requested changes

### Dependencies
- PD provides Figma designs for Recording/Teleprompter screens (E1-M1)
- FE implements tickets B1-B4, C2-C3
- QA provides test plan for validation (F1-M1)

### Checkpoints
- **2025-10-27 Mid-Review:** Review B1-B2 PRs (permissions + capture), validate camera config
- **2025-11-03 Exit-Review:** Final approval of all M1 PRs, sign off on state machine tests

---

## Message 2: To FE (Frontend Developer 1 - Recording/Teleprompter)

**From:** ORCH
**To:** FE Dev 1
**Ref:** plan.md > Epic B: Capture & Teleprompter

### Objective
Implement camera/audio capture with teleprompter overlay, recording state machine, and permissions handling for M1.

### Context
M0 navigation and storage complete. M1 adds recording flow: permissions → countdown → capture @1080x1920 → teleprompter sync → save to FileSystem. Targets: warm start <2s, 60fps teleprompter scroll, storage warning <500MB.

### Task List

#### **Ticket B1: Camera Permissions & Error States** (6h)
**Goal:** Request camera/mic permissions with graceful error handling.

**Acceptance Criteria:**
- GIVEN user navigates to Record screen
- WHEN permissions not granted
- THEN show modal: "Camera and microphone access required. Enable in Settings." with Cancel/Open Settings buttons
- WHEN user denies
- THEN block recording, show persistent banner
- WHEN user grants
- THEN initialize camera, proceed to recording UI

**Files:**
- Create `src/screens/RecordScreen.tsx`
- Add permissions utility `src/utils/permissions.ts`
- Handle Settings deep link on iOS (`Linking.openURL`) and Android

**Tests:** Unit test permissions flow, integration test Settings deep link

---

#### **Ticket B2: Portrait Video Capture** (16h)
**Goal:** Implement video recording with constraints and storage checks.

**Acceptance Criteria:**
- GIVEN user on Record screen with permissions granted
- WHEN user taps Record
- THEN show 3-2-1 countdown overlay
- AND start recording @1080x1920 portrait, 30fps, AAC audio 44.1kHz
- WHEN recording reaches 120s
- THEN auto-stop, save to `raw/{projectId}/{timestamp}.mp4`
- WHEN free storage <500MB before recording
- THEN show banner "Storage low. Free up space before recording." with Manage Storage button, block recording
- WHEN recording completes
- THEN save VideoAsset to AsyncStorage: `{ id, projectId, type: 'raw', localUri, durationSec, sizeBytes, createdAt, status: 'ready' }`

**Files:**
- `src/screens/RecordScreen.tsx` (camera component)
- `src/hooks/useCamera.ts` (camera logic)
- `src/utils/storage.ts` (storage check utility)

**Tests:** Unit test countdown timer, storage check logic; integration test recording save to FileSystem

---

#### **Ticket B3: Teleprompter Overlay** (20h)
**Goal:** Overlay teleprompter with adjustable settings and sync with recording.

**Acceptance Criteria:**
- GIVEN user has script text (≥20 words)
- WHEN Record screen loads
- THEN teleprompter overlay appears @55% opacity, lower 60% of screen
- AND current sentence highlighted @80% brightness, upcoming 50%, past 30%
- WHEN user adjusts WPM slider (80-200, default 140)
- THEN scroll speed updates real-time, estimated duration updates (words ÷ WPM × 60)
- WHEN user taps font size toggle (S/M/L)
- THEN text renders @14pt/18pt/22pt
- WHEN user taps Play
- THEN teleprompter scrolls from top, synced with recording start
- WHEN user taps Pause
- THEN scrolling stops, overlay dims to 40% opacity
- WHEN user taps Resume
- THEN scrolling resumes at exact position
- WHEN script empty
- THEN hide teleprompter, show message "Add script to enable teleprompter."

**Files:**
- `src/components/Teleprompter.tsx` (overlay component)
- `src/hooks/useTeleprompter.ts` (scroll logic)
- `src/utils/wpmCalculator.ts` (duration estimation)

**Tests:** Unit test WPM calculation, scroll sync; performance test 60fps scroll on low-end device

---

#### **Ticket B4: Recording State Machine & Controls** (12h)
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

**Files:**
- `src/state/recordingStateMachine.ts` (state machine logic)
- `src/screens/RecordScreen.tsx` (integrate state machine)
- `src/screens/ReviewScreen.tsx` (raw preview)

**Tests:** Unit test all state transitions (10+ test cases), integration test error recovery

---

### Constraints
- Expo Go managed workflow ONLY
- Use expo-camera, expo-av, expo-file-system, expo-haptics
- Thresholds binding: opacity=0.55, WPM 80-200 (default 140), max 120s, 1080x1920 portrait, 30fps

### Branch Plan
- **Milestone Branch:** `milestone/M1-recording-teleprompter`
- **Feature Branches:**
  - `feature/capture-B1-permissions`
  - `feature/capture-B2-portrait-1080x1920`
  - `feature/capture-B3-teleprompter-overlay`
  - `feature/capture-B4-state-machine`
- **Commits:** `feat(B1): add camera permissions modal`, `test(B2): verify 120s auto-stop`
- **PR Template:** Include screenshots of Recording/Teleprompter screens, demo video if possible
- **Checks:** All CI checks green before merge (typecheck, lint, unit ≥80%, a11y)
- **Approvals:** ENG-LEAD + QA

### Due Dates
- **B1:** 2025-10-23
- **B2:** 2025-10-26
- **B3:** 2025-10-31
- **B4:** 2025-11-03

### Artifacts Requested
- PR URLs for B1-B4
- Demo video: Record 30s clip with teleprompter, show pause/resume, final save
- Test report: Unit + integration coverage ≥80%

### Dependencies
- PD provides Figma designs for Recording screen + Teleprompter overlay (E1-M1)
- C2 provides FileSystem paths (raw/) before B2 can save videos
- ENG-LEAD reviews architecture for state machines

### Checkpoints
- **2025-10-27 Mid-Review:** B1-B2 PRs submitted, permissions + capture working
- **2025-11-03 Exit-Review:** All B1-B4 PRs merged, state machine tests passing

---

## Message 3: To FE Dev 2 (Storage & Metadata)

**From:** ORCH
**To:** FE Dev 2
**Ref:** plan.md > Epic C: Local Storage & Data Model

### Objective
Organize video files in structured FileSystem directories and provide CRUD utilities for video metadata in AsyncStorage.

### Context
M0 completed AsyncStorage schema v1 (C1). M1 adds FileSystem video storage (raw/, processed/, temp/) and VideoAsset metadata management. Must support soft delete, cleanup logic, and query utils.

### Task List

#### **Ticket C2: FileSystem Paths & File Management** (10h)
**Goal:** Organize video files in structured directories with cleanup logic.

**Acceptance Criteria:**
- GIVEN FileSystem paths defined
- WHEN raw video saved
- THEN create directory `videos/raw/{projectId}/` if not exists, save as `raw_{projectId}_{timestamp}.mp4`
- WHEN processed video downloaded (M2+)
- THEN save to `videos/processed/` as `processed_{videoId}_{timestamp}.mp4`
- WHEN temp upload file created (M2+)
- THEN save to `videos/temp/{videoId}.mp4`, delete after successful upload confirmation
- WHEN user deletes project (soft delete)
- THEN optionally delete associated videos (show confirmation: "Delete 5 videos permanently?")
- WHEN user cancels processing (M2+)
- THEN show option: "Keep raw video" or "Discard raw video"

**Files:**
- `src/storage/fileSystem.ts` (path builders, CRUD operations)
- `src/utils/fileNaming.ts` (naming convention helpers)

**Tests:** Unit test path generation, directory creation; integration test file save/delete

---

#### **Ticket C3: Video Metadata CRUD & Query Utilities** (6h)
**Goal:** Provide helpers to read/write video metadata from AsyncStorage.

**Acceptance Criteria:**
- GIVEN video metadata utilities
- WHEN creating new video
- THEN append to `AsyncStorage.videos` with unique `id` (uuid)
- WHEN querying videos by project
- THEN filter `videos.filter(v => v.projectId === id && !v.isDeleted)`
- WHEN updating video status (e.g., processing → complete) (M2+)
- THEN mutate in-place, save back to AsyncStorage
- WHEN deleting video
- THEN remove from array, optionally delete file from FileSystem

**Files:**
- `src/storage/videoMetadata.ts` (CRUD operations)
- Update `src/storage/schema.ts` to include VideoAsset type

**Tests:** Unit tests for CRUD, query filters (by project, by type, by status); coverage ≥90%

---

### Constraints
- Expo FileSystem only (no expo-media-library for M1, export in M4)
- File naming convention: `raw_{projectId}_{timestamp}.mp4`, `processed_{videoId}_{timestamp}.mp4`

### Branch Plan
- **Milestone Branch:** `milestone/M1-recording-teleprompter`
- **Feature Branches:**
  - `feature/storage-C2-filesystem-paths`
  - `feature/storage-C3-metadata-crud`
- **Commits:** `feat(C2): add FileSystem directory structure`, `test(C3): validate query by project`
- **PR Template:** Include test coverage report
- **Checks:** All CI checks green (typecheck, lint, unit ≥90%)
- **Approvals:** ENG-LEAD + QA

### Due Dates
- **C2:** 2025-10-28
- **C3:** 2025-11-01

### Artifacts Requested
- PR URLs for C2-C3
- Test coverage report: Unit ≥90% for storage utils
- FileSystem directory structure diagram (optional, in PR description)

### Dependencies
- M0 C1 (AsyncStorage schema) complete
- B2 needs C2 complete to save raw videos

### Checkpoints
- **2025-10-27 Mid-Review:** C2 PR submitted, FileSystem paths functional
- **2025-11-03 Exit-Review:** C3 merged, metadata CRUD tested

---

## Message 4: To BEI (Backend Integrator)

**From:** ORCH
**To:** BEI
**Ref:** plan.md > Epics D, G

### Objective
Scaffold telemetry hooks and cost tracking infrastructure for M1, prepare adapter interfaces for M2 processing pipeline.

### Context
M1 focuses on capture/storage (no external APIs yet). BEI tasks: add telemetry event tracking scaffolds, prepare circuit breaker config for M2, document adapter interfaces.

### Task List
1. **Telemetry Hooks (Scaffold Only):**
   - Add event tracking placeholders in RecordScreen: `record_started`, `record_completed`, `record_cancelled`
   - Store events in AsyncStorage.analytics with 30-day rotation logic
   - No backend transmission in M1 (telemetry toggle in Settings, default OFF)
2. **Circuit Breaker Config Review:**
   - Validate `src/config/circuit-breakers.ts` includes M2 thresholds:
     - Processing p95 <180s
     - Error rate <5%
     - Cost per clip <$0.50
     - Webhook failure rate <1%
   - Add placeholder functions: `isSLABreach()`, `getCircuitBreakerConfig()`
3. **Adapter Interface Documentation:**
   - Document provider-agnostic interfaces in `docs/architecture/adapters.md`:
     - UploadAdapter, TranscriptionAdapter, CompositionAdapter, EncodingAdapter
   - Prepare for M2 implementation (AssemblyAI, Shotstack, Mux)

### Acceptance Criteria
**Given:** M1 recording flow functional
**When:** BEI adds telemetry hooks
**Then:**
- Events logged to AsyncStorage.analytics: `record_started`, `record_completed`, `record_cancelled`
- Circuit breaker config includes M2 thresholds
- Adapter interfaces documented with TypeScript types

### Constraints
- No external API calls in M1
- Telemetry must respect user toggle (default OFF)
- Circuit breaker config must be testable (unit tests ≥80%)

### Branch Plan
- **Milestone Branch:** `milestone/M1-recording-teleprompter`
- **Feature Branches:**
  - `feature/telemetry-M1-hooks`
  - `feature/circuit-breakers-M1-validation`
- **Commits:** `feat(telemetry): add recording event hooks`, `docs(adapters): document M2 interfaces`
- **PR Template:** Include telemetry event schema, circuit breaker test cases
- **Checks:** Unit tests for circuit breaker logic ≥80%
- **Approvals:** ENG-LEAD + QA

### Due Date
- **Telemetry hooks:** 2025-10-30
- **Circuit breaker validation:** 2025-11-02

### Artifacts Requested
- PR URL for telemetry hooks
- Circuit breaker config test coverage report
- Adapter interface doc (Markdown or inline TypeScript)

### Dependencies
- FE provides recording event triggers (B4 state machine)
- ENG-LEAD reviews circuit breaker config

### Checkpoints
- **2025-10-27 Mid-Review:** Telemetry event schema finalized
- **2025-11-03 Exit-Review:** Circuit breaker config validated

---

## Message 5: To PD (Product Designer)

**From:** ORCH
**To:** PD
**Ref:** plan.md > Epic E: UI/UX & Accessibility

### Objective
Design Recording screen and Teleprompter overlay with WCAG AA compliance, annotated for M1 implementation.

### Context
M0 design system complete (E1). M1 adds Recording screen (camera preview, controls) and Teleprompter overlay (opacity 0.55, WPM controls, font size toggle). Must meet a11y targets: VO/TalkBack labels, touch targets ≥44pt, contrast ≥4.5:1.

### Task List
1. **Recording Screen Design:**
   - Camera preview (9:16 portrait, full-screen)
   - Controls overlay (bottom third):
     - Record/Pause/Resume buttons (≥44×44pt)
     - Storage indicator (MB free)
     - Countdown overlay (3-2-1)
   - Permissions modal (camera/mic denied): icon, message, Cancel/Open Settings buttons
   - Error states: Storage low (<500MB), permissions denied
2. **Teleprompter Overlay Design:**
   - Semi-transparent panel (opacity 0.55, lower 60% of screen)
   - Text rendering: current sentence 80% brightness, upcoming 50%, past 30%
   - Controls (overlay top):
     - WPM slider (80-200, default 140)
     - Font size toggle (S/M/L: 14pt/18pt/22pt)
     - Play/Pause/Restart buttons
   - Duration estimate display (e.g., "~45s at 140 WPM")
3. **Accessibility Annotations:**
   - VoiceOver labels: "Record video button", "Pause teleprompter", "Adjust scroll speed slider"
   - Touch targets: All buttons ≥44×44pt
   - Contrast check: All text on overlay ≥4.5:1
   - Font scaling: Support up to 200% system scaling

### Acceptance Criteria
**Given:** M1 kickoff
**When:** PD delivers Figma designs
**Then:**
- Recording screen with 3 states: Idle, Recording, Reviewing
- Teleprompter overlay with WPM/font controls
- Permissions/error modals with actionable CTAs
- All elements annotated with VO labels, touch target dimensions
- PDF handoff with component specs (colors, fonts, spacing)

### Constraints
- Design for iOS and Android (Expo Go)
- Opacity locked at 0.55 for teleprompter
- WPM range 80-200, default 140
- Font sizes S/M/L (14/18/22pt)

### Branch Plan
- **Milestone Branch:** N/A (design deliverable, not code)
- **Figma Link:** Share with FE Dev 1 for implementation
- **PDF Export:** Annotated screens with component specs

### Due Date
- **Figma Designs:** 2025-10-24
- **PDF Handoff:** 2025-10-25

### Artifacts Requested
1. Figma link (view access for team)
2. PDF export: Recording + Teleprompter screens (annotated)
3. Component spec sheet: colors, fonts, spacing, VO labels

### Dependencies
- M0 design system (E1) provides base components
- FE Dev 1 implements designs in B1-B4

### Checkpoints
- **2025-10-27 Mid-Review:** Recording screen design approved
- **2025-11-03 Exit-Review:** Teleprompter overlay design validated

---

## Message 6: To QA (QA Lead)

**From:** ORCH
**To:** QA
**Ref:** plan.md > Epic F: QA & Release

### Objective
Execute M1 test plan covering permissions, capture, teleprompter, performance, and a11y across device matrix.

### Context
M0 QA complete (F1) with 23/23 unit tests passing. M1 adds recording flow; QA must validate:
- Permissions (camera/mic granted/denied)
- Capture (1080x1920@30fps, 120s auto-stop)
- Teleprompter (opacity 0.55, WPM 80-200, scroll sync)
- Performance (warm start <2s, 60fps scroll)
- A11y (VoiceOver labels, touch targets ≥44pt)

### Task List
1. **Test Plan M1:**
   - Define test cases for:
     - B1 (permissions: grant, deny, revoke mid-recording)
     - B2 (capture: 30s/60s/120s clips, storage low warning)
     - B3 (teleprompter: WPM 80/140/200, font S/M/L, pause/resume)
     - B4 (state machine: Idle → Recording → Paused → Reviewing → Accept/Retake)
     - C2 (FileSystem: raw/ directory creation, file naming)
     - C3 (metadata: CRUD operations, query by project)
   - Cover edge cases:
     - App backgrounded during recording
     - Permissions revoked mid-session
     - Storage full during save
     - Teleprompter with empty script
2. **Device Matrix Execution:**
   - iOS: iPhone 12 (iOS 16), iPhone 14 (iOS 17)
   - Android: Pixel 5 (Android 12), Pixel 7 (Android 13)
   - Test on WiFi, 4G, Offline (offline M1 scope: local recording only, no uploads)
3. **Performance Validation:**
   - Warm start: App foreground → Record screen <2s (iPhone 12, Pixel 5)
   - Teleprompter scroll: 60fps sustained (measure with Expo DevTools)
   - Crash rate: <5% across 50 recording sessions
4. **A11y Audit:**
   - VoiceOver (iOS): All controls labeled, focus order logical
   - TalkBack (Android): Announce recording status, teleprompter state
   - Contrast check: Teleprompter overlay text ≥4.5:1
   - Touch targets: Measure Record/Pause buttons ≥44×44pt

### Acceptance Criteria
**Given:** M1 PRs merged to milestone branch
**When:** QA executes test plan
**Then:**
- All test cases pass (permissions, capture, teleprompter, state machine)
- No P0 bugs, ≤2 P1 bugs
- Performance targets met: warm start <2s, 60fps scroll
- A11y audit passed: VO/TalkBack labels verified, contrast ≥4.5:1
- Test report published with device matrix results

### Constraints
- Expo Go testing only (no native build)
- Device matrix: 4 devices (2 iOS, 2 Android)
- Performance baseline: iPhone 12/Pixel 5

### Branch Plan
- **Milestone Branch:** `milestone/M1-recording-teleprompter`
- **Feature Branch:** `feature/qa-M1-test-plan`
- **Commits:** `test(M1): add permissions test cases`, `docs(M1): device matrix results`
- **PR Template:** Include test report, bug tracker link
- **Checks:** Manual test execution (no CI for manual tests)
- **Approvals:** ENG-LEAD sign-off

### Due Date
- **Test Plan:** 2025-10-25
- **Execution:** 2025-10-28 to 2025-11-02
- **Report:** 2025-11-03

### Artifacts Requested
1. Test plan document (Google Docs or Markdown)
2. Bug tracker link (GitHub Issues with `M1` label)
3. Test report: Pass/fail per device, performance metrics, a11y audit results
4. Demo video: Recording flow from permissions → capture → save

### Dependencies
- FE completes B1-B4, C2-C3 before test execution
- PD provides designs for visual validation

### Checkpoints
- **2025-10-27 Mid-Review:** Test plan finalized, B1-B2 manual testing started
- **2025-11-03 Exit-Review:** All tests executed, report published

---

## Message 7: To PM (Product Manager)

**From:** ORCH
**To:** PM
**Ref:** plan.md > Section 9: Risks & Mitigations

### Objective
Track M1 scope, schedule, budget, and risks; coordinate mid/exit reviews; escalate blockers.

### Context
M0 complete (delayed from Oct 20 to Oct 6 actual). M1 window: Oct 21-Nov 3 (2 weeks). Budget impact: zero external API costs in M1 (capture/storage only). Risks: performance (warm start, fps), permissions UX, a11y compliance.

### Task List
1. **Scope Tracking:**
   - Monitor M1 tickets (B1-B4, C2-C3, telemetry hooks, circuit breaker validation, design, QA)
   - Update PlanBoard weekly: story points completed, burnup chart
   - Flag scope creep or descoping needs
2. **Schedule Coordination:**
   - Schedule mid-review: 2025-10-27 (1h meeting, attendees: ORCH, ENG-LEAD, FE, PD, QA)
   - Schedule exit-review: 2025-11-03 (1.5h meeting, demo + retrospective)
   - Track critical path: B1 → B2 → B3 → B4 (FE Dev 1) + C2 → C3 (FE Dev 2)
   - Escalate blockers (e.g., PD design delay, device matrix unavailable)
3. **Budget Guardrails:**
   - M1 budget: $0 external APIs (local dev only)
   - Validate circuit breaker config includes M2 cost thresholds (<$0.50/clip, <$359/month)
4. **Risk Register Update:**
   - Review active risks from plan.md Section 9:
     - Performance: warm start <2s, 60fps scroll (Medium likelihood, High impact)
     - Permissions UX: iOS Settings deep link, Android permissions (Low likelihood, Medium impact)
     - A11y compliance: WCAG AA (Low likelihood, Critical impact)
   - Add M1-specific risks:
     - expo-camera compatibility issues on Expo SDK 54 (Low, High)
     - Teleprompter scroll performance on low-end Android (Medium, Medium)
     - Storage full during recording (Low, Medium)
   - Document mitigation plans, assign owners

### Acceptance Criteria
**Given:** M1 in progress
**When:** PM tracks scope/schedule/risks
**Then:**
- PlanBoard updated weekly (burnup chart, completed story points)
- Mid/exit reviews scheduled with calendar invites sent
- Risk register includes 3+ M1-specific risks with mitigation plans
- No critical path blockers unresolved >24h

### Constraints
- Budget: $0 external APIs for M1
- Schedule: 2-week window (Oct 21-Nov 3)
- Scope: 6 core tickets (B1-B4, C2-C3) + supporting tasks

### Branch Plan
- **Milestone Branch:** N/A (PM role, not code)
- **Tracking:** Update PlanBoard, risk register in `.orchestrator/`

### Due Dates
- **Mid-review scheduled:** 2025-10-21 (send invites)
- **Exit-review scheduled:** 2025-10-21 (send invites)
- **PlanBoard updated:** Every Monday (Oct 28, Nov 4)
- **Risk register updated:** 2025-10-27 (mid-review), 2025-11-03 (exit-review)

### Artifacts Requested
1. Calendar invites: Mid-review (Oct 27), Exit-review (Nov 3)
2. Updated PlanBoard (`.orchestrator/planboard.md`)
3. Updated Risk Register (`.orchestrator/risks.md`)
4. Weekly status email (optional, to stakeholders)

### Dependencies
- All subagents provide progress updates for PlanBoard
- ENG-LEAD flags architectural risks
- QA flags quality risks (crash rate, performance)

### Checkpoints
- **2025-10-27 Mid-Review:** Review burnup, risks, adjust scope if needed
- **2025-11-03 Exit-Review:** Final demo, retrospective, sign-off for merge to main

---

## Summary: M1 Kickoff

**Total Tickets:** 6 core (B1-B4, C2-C3) + 3 supporting (telemetry, circuit breakers, design)
**Total Story Points:** 68h dev + 20h design/QA + 4h PM = 92h total
**Critical Path:** B1 → B2 → B3 → B4 (FE Dev 1) blocks recording flow
**Parallel Work:** C2 → C3 (FE Dev 2) can proceed independently
**External Dependencies:** PD designs by Oct 24, QA test plan by Oct 25

**Success Criteria:**
- Recording flow functional: permissions → countdown → capture → save
- Teleprompter overlay working: opacity 0.55, WPM 80-200, scroll sync
- Performance: warm start <2s, 60fps scroll
- A11y: VoiceOver/TalkBack labels, touch targets ≥44pt, contrast ≥4.5:1
- Tests: Unit ≥80%, no P0 bugs, crash rate <5%
- Milestone tag: `v0.1.0-M1` created after exit-review approval

**Next Orchestrator Action:** Monitor PR submissions, coordinate mid-review 2025-10-27, verify exit criteria by 2025-11-03.

---

**Orchestrator:** Ready to execute. All messages sent to subagents. Awaiting feature branch creation and first PR submissions.
