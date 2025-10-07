# M1 Bug Tracking Guide

**Purpose:** Guide for QA to create, track, and manage bugs found during M1 testing
**Milestone:** M1 (Recording & Teleprompter)
**Version:** 1.0
**Created:** 2025-10-06

---

## GitHub Issues Setup

### Labels Required

Create the following labels in GitHub repository (if not already exists):

| Label | Color | Description |
|-------|-------|-------------|
| `M1` | #0366d6 | M1 Recording & Teleprompter milestone |
| `bug` | #d73a4a | Something isn't working |
| `P0` | #b60205 | Critical - Blocks release |
| `P1` | #d93f0b | High - Major functionality impaired |
| `P2` | #fbca04 | Medium - Minor issue or edge case |
| `P3` | #0e8a16 | Low - Nice-to-have, future improvement |
| `B1` | #c5def5 | Permissions ticket |
| `B2` | #c5def5 | Capture ticket |
| `B3` | #c5def5 | Teleprompter ticket |
| `B4` | #c5def5 | State Machine ticket |
| `C2` | #c5def5 | FileSystem ticket |
| `C3` | #c5def5 | Metadata ticket |
| `performance` | #f9d0c4 | Performance issue |
| `a11y` | #f9d0c4 | Accessibility issue |
| `edge-case` | #f9d0c4 | Edge case scenario |

---

## Bug Report Template

Use this template when creating GitHub Issues for M1 bugs:

```markdown
**Title:** [M1-B2] Storage warning not shown when <500MB free

**Ticket:** B2 - Portrait Video Capture
**Priority:** P1
**Device:** iPhone 12, iOS 16.5
**Environment:** Expo Go SDK 54, WiFi

---

### Steps to Reproduce
1. Fill device storage to <500MB free (Settings → General → iPhone Storage)
2. Launch Shorty.ai
3. Navigate to Projects → Select project → Tap +
4. Observe Record screen

### Expected Behavior
- Warning banner appears: "Storage low. Free up space before recording."
- "Manage Storage" button visible
- Record button disabled

### Actual Behavior
- No warning banner shown
- Record button enabled
- User can start recording, but fails on save with error: "Storage full. Unable to save video."

### Screenshots/Video
[Attach screenshot of Record screen with no warning]
[Attach screenshot of error message on save failure]

### Device Details
- **Device:** iPhone 12
- **OS Version:** iOS 16.5
- **Expo Go Version:** 2.30.8
- **App Version:** 0.2.0 (M1 branch)
- **Free Storage:** 420 MB (verified in Settings)

### Impact
- Users can start recording but lose work when save fails
- Blocks core recording functionality
- Frustrating UX (no proactive warning)

### Severity Justification
**P1:** Major functionality impaired. Storage check exists but warning not triggered correctly. Workaround: manually check storage before recording.

### Reproducibility
**Always reproducible** (100% on iPhone 12 with <500MB storage)

### Related Test Case
TC-B2-04: Storage <500MB warning

### Additional Context
- Tested on iPhone 14 (iOS 17): Same issue
- Tested on Pixel 5 (Android 12): Warning works correctly
- Possible iOS-specific FileSystem API issue

### Suggested Fix
- Review `getAvailableStorage()` implementation for iOS
- Lower threshold from 500MB to 600MB (safety buffer)
- Add unit test for storage check on iOS

---

**Labels:** M1, bug, P1, B2, performance

**Assignee:** FE Dev 1

**Milestone:** M1 (Recording & Teleprompter)
```

---

## Priority Definitions

### P0 - Critical (Blocks Release)
- **Criteria:**
  - App crashes or becomes unresponsive
  - Core feature completely broken (cannot record, cannot save)
  - Data loss or corruption
  - Security vulnerability
  - A11y WCAG AA violation (if blocking requirement)
- **Examples:**
  - [M1-B2] App crashes on 120s auto-stop
  - [M1-B4] Recording state machine deadlock (cannot exit Paused state)
  - [M1-C3] Metadata corruption causes all videos to disappear
- **Action:** MUST fix before M1 merge to main
- **Owner:** ENG-LEAD assigns to dev immediately
- **SLA:** Fix within 24h or escalate to ORCH

### P1 - High (Major Functionality Impaired)
- **Criteria:**
  - Major feature partially broken (workaround exists)
  - Performance target significantly missed (>20% deviation)
  - Incorrect behavior that confuses users
  - A11y issue affecting usability
- **Examples:**
  - [M1-B2] Storage warning not shown when <500MB free
  - [M1-B3] Teleprompter scroll drops to 45fps on Pixel 5 (target 60fps)
  - [M1-B1] Settings deep link fails on iOS 16, user stuck
- **Action:** Fix before M1 merge OR defer with explicit approval from ENG-LEAD + PM
- **Owner:** Assigned to dev, tracked in PlanBoard
- **SLA:** Fix within 3-5 days or create follow-up ticket for M2

### P2 - Medium (Minor Issue or Edge Case)
- **Criteria:**
  - Cosmetic issue (visual glitch, misaligned UI)
  - Edge case scenario (rare combination of conditions)
  - Performance issue within acceptable range (5-20% deviation)
  - Minor UX improvement
- **Examples:**
  - [M1-B3] Font size toggle animation jerky
  - [M1-B1] Settings deep link slow to open (2s delay, but works)
  - [M1-B2] Countdown overlay slightly off-center
- **Action:** Defer to M2 backlog or fix if time permits
- **Owner:** Tracked in backlog, assigned in M2 planning
- **SLA:** No SLA, best effort

### P3 - Low (Nice-to-have)
- **Criteria:**
  - Feature request or enhancement
  - Future improvement
  - Non-blocking suggestion
- **Examples:**
  - [M1-B3] Add haptic feedback on teleprompter play/pause
  - [M1-B2] Allow custom countdown duration (3s, 5s, 10s)
- **Action:** Defer to backlog, may not be implemented
- **Owner:** PM reviews for future roadmap
- **SLA:** No SLA

---

## Bug Lifecycle

### 1. Discovery (QA)
- QA discovers bug during test execution
- Take screenshots/video
- Verify reproducibility (try 3 times on same device)
- Create GitHub Issue using template
- Add labels: `M1`, `bug`, priority (`P0`/`P1`/`P2`/`P3`), ticket (`B1`/`B2`/etc.)

### 2. Triage (ENG-LEAD + PM)
- ENG-LEAD reviews bug report within 24h
- Validate priority (may upgrade/downgrade)
- Assign to developer (FE Dev 1, FE Dev 2, BEI)
- Add to PlanBoard if P0/P1
- Comment on issue with triage decision

### 3. Fix (Developer)
- Developer creates hotfix branch: `hotfix/M1-B2-storage-warning`
- Implement fix, add unit test
- Submit PR with reference to GitHub Issue: "Fixes #123"
- Request review from ENG-LEAD + QA

### 4. Verify (QA)
- QA re-tests on same device/scenario
- Verify fix works as expected
- Test regression: ensure fix didn't break related functionality
- Comment on PR: "Verified fixed on iPhone 12, iOS 16.5"

### 5. Close (QA or Developer)
- If verified: Close GitHub Issue, merge PR
- If not fixed: Re-open issue, comment with details, developer fixes again
- Update test report with bug status

---

## Bug Tracking Dashboard

### GitHub Issues Filters

**All M1 Bugs:**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug
```

**P0 Bugs (Critical):**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug+label%3AP0+is%3Aopen
```

**P1 Bugs (High):**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug+label%3AP1+is%3Aopen
```

**By Ticket (e.g., B2 bugs):**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3AB2+label%3Abug
```

**Performance Bugs:**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Aperformance
```

**A11y Bugs:**
```
https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Aa11y
```

### Weekly Bug Summary

QA sends weekly email to team with:

**Subject:** M1 QA Weekly Summary - Week of [Date]

**Content:**
- **Test Progress:** X% test cases completed (Y out of Z)
- **Bugs Found:** X P0, Y P1, Z P2, W P3
- **Bugs Fixed:** X P0, Y P1 (closed this week)
- **Blockers:** List any P0/P1 bugs blocking test execution
- **Top 3 Issues:** [Brief description + GitHub Issue link]
- **Next Week Focus:** [Test cases planned]

---

## Bug Verification Checklist

When verifying a bug fix, QA must:

- [ ] **Re-test on original device/OS** (e.g., iPhone 12, iOS 16.5)
- [ ] **Re-test on at least one other device** (e.g., Pixel 5) to verify no platform-specific regression
- [ ] **Follow exact steps from bug report** (reproduce original scenario)
- [ ] **Verify expected behavior now occurs** (warning shown, button enabled, etc.)
- [ ] **Test related functionality** (regression check)
  - Example: If fixing storage warning, also test recording save flow
- [ ] **Test edge cases mentioned in bug report**
  - Example: If fix works at 450MB, test at 490MB, 510MB (boundary values)
- [ ] **Comment on GitHub Issue with verification results:**
  ```
  ✅ **Verified Fixed**
  - **Device:** iPhone 12, iOS 16.5
  - **Test Date:** 2025-10-30
  - **Result:** Storage warning now appears at <500MB free. Record button disabled. "Manage Storage" button works.
  - **Regression:** No issues found. Recording save flow still works when storage sufficient.
  - **Screenshots:** [Attach screenshot of fixed behavior]
  ```
- [ ] **Close issue or re-open with details if not fixed**

---

## Common Bug Scenarios & Templates

### Crash Bug Template

```markdown
**Title:** [M1-B2] App crashes on 120s auto-stop (Pixel 5, Android 12)

**Priority:** P0

### Steps to Reproduce
1. Record video for 120s
2. Wait for auto-stop
3. Observe crash

### Stack Trace
```
[Paste stack trace from Expo crash reporter or logcat]
```

### Frequency
100% reproducible on Pixel 5, Android 12
Not reproducible on iPhone 12, iOS 16

### Expected
Recording auto-stops at 120s, transitions to Reviewing state

### Actual
App crashes with "OutOfMemoryError" at ~118s

### Impact
Users lose 120s recording, frustrating UX, blocks long-form content

---

**Labels:** M1, bug, P0, B2, performance
```

### Performance Bug Template

```markdown
**Title:** [M1-B3] Teleprompter scroll drops to 45fps on Pixel 5 (target 60fps)

**Priority:** P1

### Performance Measurement
- **Device:** Pixel 5, Android 12
- **Tool:** Expo DevTools Perf Monitor
- **Scenario:** Teleprompter scroll at 140 WPM for 60s
- **Result:**
  - Avg FPS: 45
  - Min FPS: 38
  - Max FPS: 60
- **Target:** Avg FPS ≥60, Min FPS ≥55

### Screenshots
[Attach Expo DevTools FPS overlay screenshot]

### Expected
Smooth 60fps scroll on Pixel 5 (baseline low-end device)

### Actual
Frequent frame drops, stuttering visible

### Impact
Poor UX on Android low-end devices, affects readability

### Suggested Fix
- Use React Native Animated API instead of ScrollView
- Reduce re-renders, optimize component tree
- Profile with Android Studio profiler

---

**Labels:** M1, bug, P1, B3, performance
```

### A11y Bug Template

```markdown
**Title:** [M1-A11Y] Record button missing VoiceOver label

**Priority:** P1

### A11y Test
- **Tool:** VoiceOver (iOS)
- **Device:** iPhone 12, iOS 16
- **Expected:** "Record video button" announced
- **Actual:** "Button" announced (generic label)

### WCAG Criteria
Fails WCAG 2.1 Level AA - 1.3.1 Info and Relationships

### Impact
VoiceOver users cannot identify button purpose

### Fix
Add `accessibilityLabel="Record video button"` to button component

---

**Labels:** M1, bug, P1, a11y
```

---

## Escalation Process

### When to Escalate to ENG-LEAD
- P0 bug found (immediate notification)
- Bug cannot be reproduced (needs dev investigation)
- Bug fix creates regression (revert and re-fix)
- Bug priority unclear (ENG-LEAD decides)

### When to Escalate to PM
- Multiple P1 bugs threaten M1 timeline
- Scope creep discovered (feature not in PRD)
- Device unavailable for testing (need procurement approval)

### When to Escalate to ORCH
- M1 timeline at risk due to bug backlog
- Team disagreement on bug priority or fix approach
- External dependency blocking bug fix (e.g., Expo SDK bug)

---

## Bug Metrics (Tracked in Test Report)

### Bug Discovery Rate
- **Formula:** Bugs found per day of testing
- **Target:** <3 bugs/day (sustained)
- **Alert:** >5 bugs/day (indicates quality issues, may delay M1)

### Bug Fix Rate
- **Formula:** Bugs closed per day
- **Target:** ≥ Bug discovery rate (burn down backlog)
- **Alert:** Fix rate < Discovery rate (backlog growing)

### Bug Escape Rate (Post-Release)
- **Formula:** Bugs found in production / Total bugs found
- **Target:** <10% (catch 90% in M1 QA)
- **Measurement:** Track in M2+ (retroactive)

---

**Document Status:** Active
**Next Review:** After M1 testing complete (2025-11-03)
**Owner:** QA Lead
**Last Updated:** 2025-10-06
