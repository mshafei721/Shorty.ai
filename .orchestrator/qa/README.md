# M1 QA Documentation

**Milestone:** M1 (Recording & Teleprompter)
**QA Lead:** QA Agent
**Test Period:** 2025-10-28 to 2025-11-03

---

## Directory Structure

```
.orchestrator/qa/
├── README.md                  # This file
├── M1-test-plan.md           # Comprehensive test plan (60 test cases)
├── M1-test-report.md         # Final test report (to be completed 2025-11-03)
├── bug-tracking-guide.md     # Bug tracking process and templates
├── test-execution-log.csv    # Test case execution tracking (Excel/CSV)
├── screenshots/              # Test screenshots
│   ├── B1-permissions-modal.png
│   ├── B2-countdown-3.png
│   ├── B3-teleprompter-overlay.png
│   ├── B4-reviewing-state.png
│   ├── B2-storage-warning.png
│   ├── perf-fps-monitor.png
│   ├── perf-memory-usage.png
│   ├── a11y-voiceover-focus.png
│   ├── a11y-talkback-focus.png
│   ├── a11y-font-scaling-200.png
│   ├── a11y-contrast-check.png
│   └── touch-targets/        # Touch target measurements
│       ├── record-button.png
│       ├── pause-button.png
│       └── wpm-slider.png
└── videos/                   # Demo and audit videos
    ├── M1-demo-video.mp4     # 2-3 min demo for exit-review
    ├── voiceover-audit.mp4   # VoiceOver testing video
    └── talkback-audit.mp4    # TalkBack testing video
```

---

## Quick Links

### Test Execution
- **Test Plan:** [M1-test-plan.md](./M1-test-plan.md) (60 test cases across B1-B4, C2-C3, Perf, A11y, Edge)
- **Execution Log:** [test-execution-log.csv](./test-execution-log.csv) (track progress daily)
- **Test Report:** [M1-test-report.md](./M1-test-report.md) (draft, finalize by Nov 3)

### Bug Tracking
- **Bug Tracking Guide:** [bug-tracking-guide.md](./bug-tracking-guide.md) (templates, priority definitions, lifecycle)
- **GitHub Issues (M1 Bugs):** [Filter by M1 + bug label](https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug)
- **P0 Bugs (Critical):** [Filter](https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1+label%3Abug+label%3AP0+is%3Aopen)

### Reference Docs
- **PRD:** [PRD.md](../../PRD.md) (Sections 10, 14 - Recording, Teleprompter)
- **CLAUDE.md:** [CLAUDE.md](../../CLAUDE.md) (M1 context for Claude Code)
- **M1 Kickoff:** [M1-kickoff-messages.md](../M1-kickoff-messages.md) (QA task list)
- **M1 Summary:** [milestone-summaries/M1.md](../milestone-summaries/M1.md) (exit criteria, risks)

---

## Test Execution Schedule

### Week 1 (Oct 21-27): Permissions & Capture
- **Oct 21-23:** B1 (Permissions) - 7 test cases
  - TC-B1-01 to TC-B1-07
  - Focus: Permissions flow, Settings deep link, error states
- **Oct 24-27:** B2 (Capture) - 8 test cases
  - TC-B2-01 to TC-B2-08
  - Focus: Countdown, 30s/60s/120s clips, video specs, storage warnings

### Week 2 (Oct 28-Nov 2): Teleprompter & State Machine
- **Oct 28-30:** B3 (Teleprompter) - 10 test cases
  - TC-B3-01 to TC-B3-10
  - Focus: WPM slider, font sizes, scroll sync, 60fps performance
- **Oct 31-Nov 1:** B4 (State Machine) - 9 test cases
  - TC-B4-01 to TC-B4-09
  - Focus: State transitions, pause/resume, error recovery
- **Nov 1:** C2, C3 (Storage) - 10 test cases
  - TC-C2-01 to TC-C2-06, TC-C3-01 to TC-C3-04
  - Focus: FileSystem paths, metadata CRUD

### Nov 2-3: Performance & A11y Audit
- **Nov 2 AM:** Performance - 5 test cases
  - TC-PERF-01 to TC-PERF-05
  - Warm/cold start, FPS, memory, crash rate
- **Nov 2 PM:** Accessibility - 6 test cases
  - TC-A11Y-01 to TC-A11Y-06
  - VoiceOver/TalkBack, contrast, touch targets
- **Nov 3 AM:** Edge Cases - 5 test cases
  - TC-EDGE-01 to TC-EDGE-05
  - App backgrounding, phone calls, low battery, offline, rotation
- **Nov 3 PM:** Final report, demo video

---

## Device Matrix

| Device | OS Version | Role | Test Priority |
|--------|-----------|------|---------------|
| iPhone 12 | iOS 16 | Baseline low-end iOS | P0 (all tests) |
| iPhone 14 | iOS 17 | Latest iOS | P1 (regression check) |
| Pixel 5 | Android 12 | Baseline low-end Android | P0 (all tests) |
| Pixel 7 | Android 13 | Latest Android | P1 (regression check) |

**Notes:**
- Physical devices preferred (camera/mic required)
- Simulators/emulators acceptable if physical unavailable (note limitations)
- Test on WiFi primarily, 4G if available, Offline (Airplane mode)

---

## Key Metrics & Targets

### Performance
- **Warm Start:** <2s on iPhone 12, Pixel 5
- **Cold Start:** <4s on iPhone 12, Pixel 5
- **Teleprompter Scroll FPS:** ≥60fps sustained for 60s
- **Memory Usage:** <300MB increase during 120s recording
- **Crash Rate:** <5% across 50 recording sessions

### Accessibility
- **VoiceOver/TalkBack:** All controls labeled with descriptive text
- **Touch Targets:** All interactive elements ≥44×44pt
- **Contrast Ratio:** Teleprompter text ≥4.5:1 (WCAG AA)
- **Font Scaling:** UI adjusts up to 200% without clipping

### Test Coverage
- **Target:** ≥95% test cases executed
- **Pass Rate:** ≥90% test cases passed
- **Blockers:** Zero P0 bugs, ≤2 P1 bugs at exit-review

---

## Daily Test Execution Workflow

### Morning (9:00 AM - 12:00 PM)
1. Review PlanBoard for dev progress updates
2. Check GitHub PRs for newly merged features
3. Execute planned test cases for the day (4-6 test cases)
4. Update test-execution-log.csv with results
5. Create GitHub Issues for bugs found (use template)

### Afternoon (1:00 PM - 4:00 PM)
1. Continue test execution (4-6 more test cases)
2. Verify bug fixes from dev (re-test on same device)
3. Take screenshots for test report
4. Update bug tracker (close verified fixes)
5. Send daily standup update to team (Slack/email)

### End of Day (4:00 PM - 5:00 PM)
1. Review test execution log (calculate pass rate)
2. Identify blockers for next day (missing devices, dependencies)
3. Update M1-test-report.md with progress
4. Prepare test plan for next day
5. Send EOD summary to ORCH/ENG-LEAD (if P0 bugs found)

---

## Weekly Reporting

### Every Monday (Week 2: Oct 28, Nov 4)
Send weekly summary email to team:

**Subject:** M1 QA Weekly Summary - Week of [Date]

**To:** ORCH, ENG-LEAD, FE Dev 1, FE Dev 2, BEI, PD, PM

**Content:**
- **Test Progress:** X% test cases completed (Y out of 60)
- **Pass Rate:** Z% passed, W% failed, V% blocked
- **Bugs Found:** X P0, Y P1, Z P2, W P3
- **Bugs Fixed:** X P0, Y P1 closed this week
- **Blockers:** [List P0/P1 bugs blocking test execution]
- **Top 3 Issues:** [Brief description + GitHub Issue link]
- **Next Week Focus:** [Test cases planned: B3, B4, Perf, A11y]
- **Device Matrix Status:** [iPhone 12 ✓, iPhone 14 ✓, Pixel 5 pending, Pixel 7 ✓]

---

## Exit-Review Checklist (Nov 3)

### Before Exit-Review Meeting
- [ ] All 60 test cases executed (or justified blockers documented)
- [ ] Test execution log complete (all results entered)
- [ ] M1-test-report.md finalized (all sections filled)
- [ ] All P0 bugs fixed and verified
- [ ] All P1 bugs either fixed or deferred with approval
- [ ] Performance metrics documented (warm start, FPS, crash rate)
- [ ] A11y audit complete (VoiceOver/TalkBack videos recorded)
- [ ] Screenshots uploaded to .orchestrator/qa/screenshots/
- [ ] Demo video recorded and uploaded (M1-demo-video.mp4)
- [ ] Bug tracker reviewed (all issues labeled, prioritized, assigned)
- [ ] GitHub Issues filtered and shared (M1 + bug label)

### During Exit-Review Meeting
- [ ] Present test coverage summary (60 test cases, pass/fail rates)
- [ ] Demo M1 recording flow (play demo video)
- [ ] Review bug summary (P0/P1/P2/P3 counts, top issues)
- [ ] Share performance results (warm start, FPS, crash rate)
- [ ] Share A11y audit results (contrast, touch targets, VO/TB)
- [ ] Discuss recommendations (sign-off, conditional approve, reject)
- [ ] Answer questions from team (ENG-LEAD, PM, ORCH)

### After Exit-Review Meeting
- [ ] Update M1-test-report.md with sign-off decision
- [ ] Create follow-up tickets for deferred P2/P3 bugs (M2 backlog)
- [ ] Archive test artifacts (screenshots, videos, logs)
- [ ] Send final test report to team (email + Slack)
- [ ] Update PlanBoard with M1 QA status (complete)

---

## Tools & Resources

### Test Tools
- **Expo DevTools:** Performance monitor, FPS overlay, memory profiler
  - Access: Shake device → "Show Perf Monitor"
  - URL: http://localhost:19002 (scan QR code)
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **ffprobe (video specs):** https://ffmpeg.org/ffprobe.html
  - Install: `brew install ffmpeg` (macOS) or `choco install ffmpeg` (Windows)
  - Usage: `ffprobe -v error -show_format -show_streams video.mp4`
- **Figma Measure Plugin:** Touch target measurement
  - Install: Figma → Plugins → Browse → "Measure"
- **iOS Settings:** Accessibility → VoiceOver, Display & Text Size
- **Android Settings:** Accessibility → TalkBack, Display Size and Text

### Reference Docs
- **PRD:** [PRD.md](../../PRD.md)
- **CLAUDE.md:** [CLAUDE.md](../../CLAUDE.md)
- **M1 Kickoff:** [M1-kickoff-messages.md](../M1-kickoff-messages.md)
- **M1 Summary:** [milestone-summaries/M1.md](../milestone-summaries/M1.md)
- **GitHub Issues:** https://github.com/yourusername/Shorty.ai/issues?q=is%3Aissue+label%3AM1

---

## Contact & Escalation

### QA Lead
- **Name:** QA Agent
- **Email:** qa@shortyai.com
- **Slack:** @qa-agent

### Escalation Path
1. **Bug Triage:** ENG-LEAD (priority validation, dev assignment)
2. **Timeline Risk:** PM (scope/schedule adjustments)
3. **Blockers:** ORCH (cross-team coordination, external dependencies)

### Meeting Schedule
- **Daily Standup:** 9:00 AM (10 min, async Slack update acceptable)
- **Mid-Review:** Oct 27, 2:00 PM (1h, attendees: ORCH, ENG-LEAD, FE, PD, QA)
- **Exit-Review:** Nov 3, 2:00 PM (1.5h, all team + demo)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-06 | 1.0 | Initial M1 test plan, report, bug tracking guide created | QA Agent |
| [TBC] | [TBC] | [Test execution started] | QA Agent |
| [TBC] | [TBC] | [Final test report published] | QA Agent |

---

**Document Status:** Active
**Next Review:** 2025-11-03 (after M1 testing complete)
**Owner:** QA Lead
**Last Updated:** 2025-10-06
