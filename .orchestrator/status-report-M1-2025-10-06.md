# M1 Status Report - Recording & Teleprompter

**Milestone:** M1 (Recording & Teleprompter)
**Date:** 2025-10-06
**Reporting Period:** Kickoff (Week 0)
**Next Report:** 2025-10-13 (Week 1 progress)

---

## Summary

M1 milestone officially kicked off on 2025-10-06 after M0 completion. Created `milestone/M1-recording-teleprompter` branch and generated comprehensive kickoff messages for 7 agents covering 6 core tickets (B1-B4, C2-C3) and 5 supporting tasks. M1 focuses on camera/audio capture with teleprompter overlay, state machines, and local FileSystem storage. No external API costs in M1 (recording/storage only, processing deferred to M2). Target: 2-week delivery (Oct 21-Nov 3) with mid-review Oct 27 and exit-review Nov 3.

---

## Burnup

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Planned Story Points** | 68h (core) | 68h | ✅ Baseline |
| **Completed Story Points** | 0h | 34h (50% by mid-review) | ⏳ Week 0 |
| **Completion Rate** | 0% (0/6 tickets) | 100% by Nov 3 | ⏳ On Schedule |

### Ticket Status

| Ticket | Owner | Est. | Status | Due | Notes |
|--------|-------|------|--------|-----|-------|
| **B1** | FE Dev 1 | 6h | ⏳ Not Started | Oct 23 | Camera permissions & error states |
| **B2** | FE Dev 1 | 16h | ⏳ Not Started | Oct 26 | Portrait 1080x1920 capture, 120s auto-stop |
| **B3** | FE Dev 1 | 20h | ⏳ Not Started | Oct 31 | Teleprompter overlay (opacity 0.55, WPM 80-200) |
| **B4** | FE Dev 1 | 12h | ⏳ Not Started | Nov 3 | Recording state machine (Idle → Recording ↔ Paused → Reviewing) |
| **C2** | FE Dev 2 | 10h | ⏳ Not Started | Oct 28 | FileSystem paths (raw/, processed/, temp/) |
| **C3** | FE Dev 2 | 6h | ⏳ Not Started | Nov 1 | Video metadata CRUD, query utils |

### Critical Path

```
B1 → B2 → B3 → B4 (FE Dev 1) [sequential, recording flow]
C2 → C3 (FE Dev 2) [parallel, storage layer]
```

---

## Quality Gates

| Gate | Target | Actual | Status | Notes |
|------|--------|--------|--------|-------|
| **Unit Coverage** | ≥80% | N/A (M1 week 0) | ⏳ Pending | M0 baseline: 57.77% (will increase with M1 tests) |
| **Warm Start** | <2s | N/A (M1 week 0) | ⏳ Pending | Target: iPhone 12/Pixel 5 baseline |
| **Scroll FPS** | 60fps | N/A (M1 week 0) | ⏳ Pending | Teleprompter scroll performance |
| **Crash Rate** | <5% | N/A (M1 week 0) | ⏳ Pending | M0 baseline: 0% (23/23 tests passing) |
| **A11y** | WCAG AA | N/A (M1 week 0) | ⏳ Pending | VoiceOver/TalkBack labels, contrast ≥4.5:1, touch targets ≥44pt |

### Numeric Thresholds (Binding)

| Threshold | Value | Source |
|-----------|-------|--------|
| Teleprompter Opacity | 0.55 | PRD Section 14, M1 prompt |
| WPM Range | 80-200 (default 140) | PRD Section 14, M1 prompt |
| Max Recording Duration | 120s (auto-stop) | PRD Section 10, M1 prompt |
| Video Resolution | 1080x1920 portrait @30fps | PRD Section 10, M1 prompt |
| Storage Warning Threshold | <500 MB free | PRD Section 10 |
| Font Sizes | S/M/L (14pt/18pt/22pt) | PRD Section 14 |
| Touch Target Minimum | 44×44pt | WCAG 2.1 AA, PRD Section 15 |
| Contrast Minimum | 4.5:1 | WCAG 2.1 AA, PRD Section 15 |

---

## Budget

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Per-Clip Cost (USD)** | $0.00 | $0.00 (M1 local only) | ✅ On Budget |
| **Monthly Cost (USD)** | $0.00 | $0.00 (M1 local only) | ✅ On Budget |
| **Forecast (USD)** | $0.00 | $0.00 (M2 will introduce API costs) | ✅ On Budget |

### Budget Notes
- M1 has zero external API costs (recording/storage only, no processing)
- M2 will introduce transcription (AssemblyAI $22.50/mo), composition (Shotstack $300/mo), encoding (Mux $30/mo)
- Circuit breaker config validated in M1 to include M2 cost thresholds (<$0.50/clip, <$359/month)

---

## Risks

### Active Risks (5)

#### R-M1-001: Performance - Warm Start & Scroll FPS
**Likelihood:** Medium | **Impact:** High | **Owner:** ENG-LEAD + FE | **Status:** Open
- **Description:** Recording screen warm start may exceed 2s on iPhone 12/Pixel 5, or teleprompter scroll may drop below 60fps on low-end Android.
- **Mitigation:** Lazy load camera component, use React Native Animated API for scroll, profile with Expo DevTools
- **Trigger:** Warm start >2s OR scroll <60fps during mid-review testing (Oct 27)

#### R-M1-002: Permissions UX - iOS Settings Deep Link
**Likelihood:** Low | **Impact:** Medium | **Owner:** FE Dev 1 | **Status:** Open
- **Description:** iOS Settings deep link may fail on some iOS versions, leaving users stuck after denying permissions.
- **Mitigation:** Test on iOS 16/17, fallback to copy-pasteable instructions, handle `openURL` errors
- **Trigger:** Settings deep link fails on any test device during QA (Oct 28-Nov 2)

#### R-M1-003: A11y Compliance - WCAG AA
**Likelihood:** Low | **Impact:** Critical | **Owner:** PD + QA | **Status:** Open
- **Description:** Teleprompter overlay contrast may fall below 4.5:1 at 0.55 opacity, or VoiceOver labels may be incomplete.
- **Mitigation:** Contrast check with WebAIM tool during design, QA validates VO/TalkBack labels, adjust overlay background if needed
- **Trigger:** A11y audit fails during exit-review (Nov 3)

#### R-M1-004: expo-camera Compatibility on Expo SDK 54
**Likelihood:** Low | **Impact:** High | **Owner:** ENG-LEAD + FE Dev 1 | **Status:** Open
- **Description:** expo-camera may have undocumented breaking changes in Expo SDK 54, causing crashes or incorrect video specs.
- **Mitigation:** Review changelog, test on physical devices, fallback to react-native-vision-camera if unstable
- **Trigger:** Capture crashes OR incorrect video specs during B2 implementation (Oct 21-26)

#### R-M1-005: Storage Full During Recording
**Likelihood:** Low | **Impact:** Medium | **Owner:** FE Dev 1 + FE Dev 2 | **Status:** Open
- **Description:** Device storage may fill during recording, causing save failure after recording completes.
- **Mitigation:** Check free storage before recording (<500MB banner), handle FileSystem write errors gracefully
- **Trigger:** Storage full error during QA device matrix testing (Oct 28-Nov 2)

---

## Next Actions

### Top 3 Priorities (Week 1: Oct 7-13)
1. **ENG-LEAD:** Review M1 architecture (camera config, state machines, FileSystem structure) by Oct 23 — architecture decisions must be finalized before B2 implementation.
2. **PD:** Deliver Figma designs for Recording/Teleprompter screens by Oct 24 — blocks FE implementation of B1-B4.
3. **FE Dev 1:** Create feature branches for B1-B4, start B1 (camera permissions) by Oct 21 — critical path starts here.

### Additional Actions
4. **FE Dev 2:** Create feature branches for C2-C3, start C2 (FileSystem paths) by Oct 21 — C2 must complete before B2 can save videos.
5. **BEI:** Add telemetry event hooks (scaffold) by Oct 30 — low priority, can slip to week 2.
6. **QA:** Finalize M1 test plan by Oct 25 — test plan must be ready before manual testing starts Oct 28.
7. **PM:** Schedule mid-review (Oct 27) and exit-review (Nov 3) calendar invites by Oct 21 — coordinate 7 attendees (ORCH, ENG-LEAD, FE, FE-Dev-2, BEI, PD, QA).

---

## Decisions (Since M0)

1. **Milestone Branch Strategy:** Created `milestone/M1-recording-teleprompter` as base for all M1 feature branches. Feature branches (e.g., `feature/capture-B1-permissions`) fork from M1 milestone branch, merge back to M1, then M1 merges to main after exit-review approval. Enforces branch-per-milestone discipline.

2. **Teleprompter Scroll Implementation:** Use React Native Animated API (not ScrollView) for 60fps performance. Decision based on PRD Section 14 requirement "smooth scroll at 60fps" and React Native best practices for performance-critical UI.

3. **FileSystem Directory Structure:** `videos/raw/{projectId}/`, `videos/processed/`, `videos/temp/`. Rationale: Separate raw by project for cleanup logic (delete project → delete raw videos), processed videos shared across projects (export → keep processed), temp directory for upload staging (M2+).

4. **State Machine Library:** Implement custom state machine (not XState) for simplicity and minimal bundle size. XState adds ~40KB; custom implementation <5KB with same functionality. Unit test all transitions (≥90% coverage).

5. **Permissions UX:** On denial, show modal with "Open Settings" deep link (iOS: `app-settings:`, Android: `Settings.ACTION_APPLICATION_DETAILS_SETTINGS`). Fallback: show instructions if deep link unavailable. Aligns with PRD Section 10 "show modal with instructions and 'Open Settings' button".

6. **Telemetry Hooks:** Scaffold event tracking in M1 (local-only), defer backend transmission to M2+ (respects default-OFF toggle per PRD Section 15). Events: `record_started`, `record_completed`, `record_cancelled`. Stored in `AsyncStorage.analytics` with 30-day rotation.

---

## Blockers

**None at kickoff (2025-10-06).**

Potential blockers to monitor in Week 1:
- PD design delay (blocks FE B1-B4 implementation if Figma not ready by Oct 24)
- Device matrix unavailable (blocks QA manual testing if test devices unavailable Oct 28)
- expo-camera compatibility issues (blocks B2 if expo-camera crashes on Expo SDK 54)

---

## Checkpoint Schedule

| Date | Event | Attendees | Agenda |
|------|-------|-----------|--------|
| **2025-10-21** | M1 Kickoff (complete) | ORCH, ENG-LEAD, FE, FE-Dev-2, BEI, PD, QA, PM | Kickoff messages sent, milestone branch created, feature branches planned |
| **2025-10-27** | Mid-Review (1h) | ORCH, ENG-LEAD, FE, PD, QA | Review B1-B2 PRs, validate camera config, assess performance (warm start, fps), adjust scope if needed |
| **2025-11-03** | Exit-Review (1.5h) | ORCH, ENG-LEAD, FE, FE-Dev-2, BEI, PD, QA, PM | Demo recording flow, review all PRs (B1-B4, C2-C3), verify exit criteria, sign off for merge to main, retrospective |

---

## Links

- **Kickoff Messages:** [.orchestrator/M1-kickoff-messages.md](./M1-kickoff-messages.md)
- **Milestone Summary:** [.orchestrator/milestone-summaries/M1.md](./milestone-summaries/M1.md)
- **PlanBoard:** [.orchestrator/planboard.md](./planboard.md)
- **Risk Register:** [.orchestrator/risks.md](./risks.md)
- **PRD:** [PRD.md](../PRD.md) - Sections 10 (Recording), 14 (Teleprompter)
- **Plan:** [plan.md](../plan.md) - M1 Detailed Tickets
- **Git Branch:** `milestone/M1-recording-teleprompter`

---

**Report Status:** COMPLETE | **Next Report:** 2025-10-13 (Week 1 progress, burnup update, first PR submissions)
