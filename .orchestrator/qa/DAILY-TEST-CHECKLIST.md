# M1 Daily Test Execution Checklist

**QA Lead Quick Reference Card**
**Test Period:** Oct 28 - Nov 3, 2025

---

## Morning Routine (9:00 AM - 9:30 AM)

### Daily Standup
- [ ] Post Slack update in #qa or #M1-testing:
  ```
  M1 QA Update - [Date]

  Yesterday:
  - Executed: [X test cases] (TC-B1-01 to TC-B1-03)
  - Pass: [Y], Fail: [Z]
  - Bugs found: [P0: X, P1: Y] (links)

  Today:
  - Plan: [X test cases] (TC-B2-01 to TC-B2-04)
  - Devices: iPhone 12, Pixel 5
  - Focus: Capture flow, video specs

  Blockers:
  - [None or list blockers]
  ```

### Pre-Test Setup
- [ ] Check PlanBoard for dev updates (any new PRs merged?)
- [ ] Review GitHub notifications (bug fix PRs ready for verification?)
- [ ] Charge all test devices (100% battery for perf testing)
- [ ] Deploy latest M1 branch to Expo Go (if new build available)
- [ ] Open test-execution-log.csv (ready to update results)

---

## Test Execution (9:30 AM - 4:00 PM)

### Per Test Case
1. [ ] Read test case from M1-test-plan.md (TC-XXX)
2. [ ] Set up test environment (device, OS, permissions, storage)
3. [ ] Execute test steps (follow acceptance criteria exactly)
4. [ ] Observe expected vs. actual behavior
5. [ ] Take screenshot if:
   - Test FAILS (show actual behavior)
   - Visual verification needed (UI state, overlay, etc.)
   - Bug found (evidence for GitHub Issue)
6. [ ] Update test-execution-log.csv:
   - Status: In Progress → Complete
   - Pass/Fail: PASS or FAIL
   - Date: 2025-XX-XX
   - Notes: Brief description or "As expected"
   - Bug Ticket: Link to GitHub Issue if bug found
7. [ ] If FAIL: Create GitHub Issue immediately (see Bug Report section below)

### Test Pace Guide
- **Simple tests (Permissions, State Machine):** 20-30 min each
- **Complex tests (Capture, Teleprompter):** 30-45 min each
- **Performance tests:** 1-2 hours (warm start: 10 runs, FPS: 60s measurement)
- **A11y tests:** 1 hour each (VoiceOver/TalkBack: record video)

**Daily Target:** 4-6 test cases executed across 2-4 devices (8-20 execution entries in log)

---

## Bug Report Workflow

### When Bug Found
1. [ ] Take screenshot/video (evidence)
2. [ ] Verify reproducibility (try 3 times on same device)
3. [ ] Test on second device (check if platform-specific)
4. [ ] Determine priority (P0/P1/P2/P3 - see guide below)
5. [ ] Create GitHub Issue (use template below)
6. [ ] Add labels: M1, bug, P0/P1/P2/P3, B1/B2/etc.
7. [ ] Notify ENG-LEAD in Slack (if P0, immediate ping)
8. [ ] Update test-execution-log.csv with bug ticket link

### GitHub Issue Template (Quick Copy-Paste)
```markdown
**Title:** [M1-BX] Short description (device, OS)

**Priority:** P0/P1/P2/P3

**Device:** iPhone 12, iOS 16.5 / Pixel 5, Android 12

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Screenshots/Video
[Attach evidence]

### Impact
[User impact, functionality affected]

### Reproducibility
Always / Sometimes (X out of Y attempts) / Once

### Related Test Case
TC-XXX

---
Labels: M1, bug, P0/P1/P2/P3, BX
Assignee: [FE Dev 1 / FE Dev 2 / BEI]
```

### Priority Quick Guide
- **P0 (Critical):** App crashes, core feature broken, data loss, WCAG AA violation → IMMEDIATE escalation
- **P1 (High):** Major feature impaired (workaround exists), performance miss >20%, confusing UX → Fix before M1 merge
- **P2 (Medium):** Cosmetic, edge case, minor perf issue 5-20%, UX improvement → Defer to M2 or fix if time
- **P3 (Low):** Feature request, enhancement, non-blocking → Defer to backlog

---

## Bug Verification Workflow

### When Dev Fixes Bug
1. [ ] Pull latest M1 branch (dev merged hotfix PR)
2. [ ] Re-test on **original device** (exact device/OS from bug report)
3. [ ] Follow **exact steps** from bug report (reproduce original scenario)
4. [ ] Verify expected behavior now occurs (bug fixed)
5. [ ] Test related functionality (regression check, ensure fix didn't break other features)
6. [ ] Test on second device (ensure no new platform-specific issues)
7. [ ] Comment on GitHub Issue:
   ```
   ✅ Verified Fixed
   - Device: iPhone 12, iOS 16.5
   - Test Date: 2025-10-30
   - Result: [Expected behavior now occurs]
   - Regression: No issues found
   - Screenshots: [Attach if helpful]
   ```
8. [ ] Close GitHub Issue (if verified fixed)
9. [ ] OR re-open with details (if not fixed)
10. [ ] Update test-execution-log.csv (change FAIL → PASS if fixed)

---

## Screenshot Naming Convention

Save all screenshots to `.orchestrator/qa/screenshots/`

### File Naming Format
```
[Category]-[TestCase]-[Device]-[PassFail].png

Examples:
B1-permissions-modal-iphone12-pass.png
B2-countdown-3-pixel5-pass.png
B3-teleprompter-overlay-iphone12-fail.png
perf-fps-monitor-pixel5-pass.png
a11y-voiceover-focus-iphone12-pass.png
```

### Special Categories
- **Performance:** `perf-[metric]-[device]-[result].png`
- **Accessibility:** `a11y-[test]-[device]-[result].png`
- **Touch Targets:** `touch-targets/[element]-[device].png`

---

## End of Day (4:00 PM - 5:00 PM)

### Daily Wrap-Up
- [ ] Review test-execution-log.csv (calculate today's pass rate)
  - Formula: Pass Rate = (Passed / Executed) × 100%
- [ ] Update M1-test-report.md (if significant progress)
  - Update test coverage table (# passed, failed, blocked)
  - Update bug summary (P0/P1/P2/P3 counts)
- [ ] Identify blockers for tomorrow (missing devices, dev dependencies, PRs not merged)
- [ ] Prepare tomorrow's test plan (select 4-6 test cases to execute)

### EOD Summary (if P0/P1 bugs found)
Send Slack message to ORCH, ENG-LEAD:
```
M1 QA EOD Summary - [Date]

Today's Execution:
- Test cases executed: [X]
- Pass rate: [Y%]
- Bugs found: P0: [X], P1: [Y]

Critical Issues (P0):
- [M1-BX] Short description - [GitHub Issue link]

Blockers for Tomorrow:
- [None or list blockers]

Tomorrow's Plan:
- Execute: [TC-XXX to TC-YYY]
- Devices: [iPhone 12, Pixel 5]
```

---

## Weekly Summary (Mondays: Oct 28, Nov 4)

### Email to Team
**To:** ORCH, ENG-LEAD, FE Dev 1, FE Dev 2, BEI, PD, PM
**Subject:** M1 QA Weekly Summary - Week of [Date]

**Content:**
```
M1 QA Weekly Summary - Week of [Oct 28 / Nov 4]

Test Progress:
- Test cases completed: X out of 60 (Y%)
- Pass rate: Z% (W passed, V failed, U blocked)

Bugs Found:
- P0 (Critical): X [list with links]
- P1 (High): Y [list with links]
- P2 (Medium): Z [deferred to M2]
- P3 (Low): W [deferred to backlog]

Bugs Fixed This Week:
- P0: X closed [list]
- P1: Y closed [list]

Top 3 Issues:
1. [M1-BX] Description - [GitHub Issue link] - Status: [Open/Fixed]
2. [M1-BY] Description - [GitHub Issue link] - Status: [Open/Fixed]
3. [M1-BZ] Description - [GitHub Issue link] - Status: [Open/Fixed]

Blockers:
- [None or list blockers affecting test execution]

Next Week Focus:
- Test cases planned: TC-XXX to TC-YYY
- Categories: [B3 Teleprompter, B4 State Machine, Performance, A11y]
- Device matrix: [All 4 devices]

Device Matrix Status:
- iPhone 12 (iOS 16): ✓ Available
- iPhone 14 (iOS 17): ✓ Available
- Pixel 5 (Android 12): ✗ Pending procurement
- Pixel 7 (Android 13): ✓ Available
```

---

## Performance Testing Day (Nov 2 AM)

### Warm Start (TC-PERF-01)
- [ ] Device: iPhone 12 (and others)
- [ ] Tool: Expo DevTools Performance monitor OR stopwatch
- [ ] Procedure:
  1. Launch Expo DevTools in browser
  2. Background app
  3. Foreground app, navigate to Record screen
  4. Record "Time to Interactive" (camera preview visible)
  5. Repeat 10 times
- [ ] Calculate p50 (median), p95 (95th percentile)
- [ ] Record in test-execution-log.csv: Pass if p50 <2s, Fail otherwise
- [ ] Take screenshot of Expo DevTools performance graph

### Cold Start (TC-PERF-02)
- [ ] Same as warm start, but force quit app before each run
- [ ] Target: p50 <4s

### Teleprompter FPS (TC-PERF-03)
- [ ] Device: iPhone 12, Pixel 5
- [ ] Tool: Expo DevTools Perf Monitor (shake device → "Show Perf Monitor")
- [ ] Procedure:
  1. Enable FPS overlay
  2. Start teleprompter scroll at 140 WPM
  3. Observe FPS for 60s
  4. Record min/avg/max FPS
- [ ] Take screenshot of FPS overlay
- [ ] Record in log: Pass if avg ≥60fps, Fail otherwise

### Memory Usage (TC-PERF-04)
- [ ] Device: iPhone 12, Pixel 5
- [ ] Tool: Xcode Instruments (iOS) or Android Studio Profiler (Android)
- [ ] Procedure:
  1. Measure baseline memory (before recording)
  2. Start recording
  3. Record for 120s
  4. Measure peak memory
  5. Calculate delta
- [ ] Record in log: Pass if delta <300MB, Fail otherwise

### Crash Rate (TC-PERF-05)
- [ ] 50 recording sessions distributed across 4 devices (12-13 per device)
- [ ] Vary scenarios: 30s/60s/120s clips, pause/resume, errors
- [ ] Log all crashes with stack traces
- [ ] Calculate: (crashes / total sessions) × 100%
- [ ] Record in log: Pass if crash rate <5%, Fail otherwise

---

## A11y Testing Day (Nov 2 PM)

### VoiceOver (TC-A11Y-01)
- [ ] Device: iPhone 12, iPhone 14
- [ ] Enable VoiceOver: Settings → Accessibility → VoiceOver
- [ ] Navigate Record screen, swipe through all controls
- [ ] Verify labels: "Record video button", "Pause recording button", etc.
- [ ] Record screen video with VoiceOver audio
- [ ] Upload to `.orchestrator/qa/videos/voiceover-audit.mp4`

### TalkBack (TC-A11Y-02)
- [ ] Device: Pixel 5, Pixel 7
- [ ] Enable TalkBack: Settings → Accessibility → TalkBack
- [ ] Navigate Record screen, swipe through all controls
- [ ] Verify labels same as VoiceOver
- [ ] Record screen video with TalkBack audio
- [ ] Upload to `.orchestrator/qa/videos/talkback-audit.mp4`

### Contrast Check (TC-A11Y-05)
- [ ] Take screenshot of teleprompter overlay
- [ ] Open https://webaim.org/resources/contrastchecker/
- [ ] Extract colors:
  - Foreground: Current sentence (#FFFFFF at 80% opacity)
  - Background: Overlay background (estimate #222222)
- [ ] Input into WebAIM tool
- [ ] Verify contrast ratio ≥4.5:1
- [ ] Take screenshot of WebAIM results
- [ ] Upload to `.orchestrator/qa/screenshots/a11y-contrast-check.png`

### Touch Targets (TC-A11Y-04)
- [ ] Take screenshot of Record screen
- [ ] Import into Figma or image editor
- [ ] Use Figma Measure plugin (or manual measurement)
- [ ] Measure all interactive elements:
  - Record button (target ≥88pt)
  - Pause/Resume/Stop buttons (target ≥44pt)
  - WPM slider thumb (target ≥44pt)
  - Font toggle buttons (target ≥44pt)
- [ ] Take screenshots of measurements
- [ ] Upload to `.orchestrator/qa/screenshots/touch-targets/`
- [ ] Document in M1-test-report.md table

---

## Demo Video Recording (Nov 3 AM)

### Setup
- [ ] Device: iPhone 14 (iOS 17) - latest, best camera quality
- [ ] Tool: iOS screen recording (Control Center → Screen Recording)
- [ ] Pre-flight: Clear all notifications, charge to 100%, enable Do Not Disturb

### Recording Steps
1. [ ] Start screen recording
2. [ ] Launch app → Navigate to Projects
3. [ ] Select project → Tap +
4. [ ] Show script screen (pre-filled script ≥20 words)
5. [ ] Navigate to Record screen (camera preview, teleprompter visible)
6. [ ] Tap Record → Show countdown 3-2-1
7. [ ] Recording starts, teleprompter scrolls (record ~30s)
8. [ ] Tap Pause → Show overlay dims
9. [ ] Tap Resume → Scrolling continues
10. [ ] Tap Stop → Transition to Reviewing state
11. [ ] Show raw preview with Accept/Retake buttons
12. [ ] Tap Accept → Navigate to Feature Selection (placeholder)
13. [ ] Stop screen recording

### Post-Processing
- [ ] Trim to 2-3 minutes (remove setup/cleanup)
- [ ] (Optional) Add text overlay for key moments ("Countdown", "Teleprompter sync", "Pause/Resume")
- [ ] Export as MP4 (1080p or higher, <100MB)
- [ ] Upload to `.orchestrator/qa/M1-demo-video.mp4`
- [ ] Test playback (ensure audio/video sync)

---

## Final Report Completion (Nov 3 PM)

### M1-test-report.md Checklist
- [ ] Executive Summary: Overall status (Pass/Conditional/Fail), recommendation
- [ ] Test Coverage Summary: Fill all tables with actual counts
- [ ] Bug Summary: List top 3 issues with GitHub links
- [ ] Performance Results: Fill all tables with measurements (warm start, FPS, crash rate)
- [ ] A11y Audit Results: Fill tables with contrast ratios, touch target measurements, VO/TB results
- [ ] Screenshots/Videos: Verify all files uploaded, add links to report
- [ ] Recommendations: Write 3-5 recommendations (sign-off, fix before merge, defer)
- [ ] Sign-Off: QA Lead name, date (2025-11-03)

### Exit-Review Prep
- [ ] Demo video ready to play (test playback)
- [ ] Screenshots folder reviewed (all key screenshots present)
- [ ] GitHub Issues filtered link ready: [M1 + bug label]
- [ ] Performance metrics table (copy from report, ready to share)
- [ ] A11y audit summary (checklist, ready to share)
- [ ] Talking points (optional slides or bullet list)

---

## Quick Links (Copy-Paste)

### Documents
- Test Plan: `.orchestrator/qa/M1-test-plan.md`
- Test Report: `.orchestrator/qa/M1-test-report.md`
- Bug Tracking Guide: `.orchestrator/qa/bug-tracking-guide.md`
- Execution Log: `.orchestrator/qa/test-execution-log.csv`

### GitHub Issues
- All M1 Bugs: https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug
- P0 Bugs: https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug+label%3AP0+is%3Aopen
- P1 Bugs: https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug+label%3AP1+is%3Aopen

### Tools
- Expo DevTools: http://localhost:19002
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- ffprobe (video specs): `ffprobe -v error -show_format -show_streams video.mp4`

---

**Print this checklist or keep open in browser tab during test execution.**
**Update daily. Stay organized. Ship quality M1!**
