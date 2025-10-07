# Shorty.ai PlanBoard

**Last Updated:** 2025-01-XX
**Current Milestone:** M2 (Processing Pipeline POC)

---

## Legend
- 🔵 In Progress
- ⏸️ Blocked
- ✅ Done
- ⏳ Pending

---

## M0: Foundations (Oct 7-20, 2025) - ✅ COMPLETE

| Ticket | Owner | Due | Status | Exit Criteria | Branch | Commit |
|--------|-------|-----|--------|---------------|--------|--------|
| **A0** | ENG-LEAD | Oct 8 | ✅ Done | Architecture docs, CODEOWNERS, PR template complete | main | d335a06 |
| **E1** | PD | Oct 11 | ✅ Done | Design system & 10 M0 screens in Figma, PDF handoff | N/A | N/A |
| **A1** | FE | Oct 9 | ✅ Done | Expo runs on iOS/Android, nav stacks, AsyncStorage v1 | main | d335a06 |
| **A2** | FE Dev 1 | Oct 12 | ✅ Done | Onboarding flow: niche selection → AsyncStorage persistence | main | d335a06 |
| **A3** | FE Dev 2 | Oct 15 | ✅ Done | Projects CRUD: create, edit, soft delete | milestone/M1 | 47b03eb |
| **C1** | FE Dev 2 | Oct 20 | ✅ Done | AsyncStorage schema v1, migration framework, unit tests ≥95% | main | d335a06 |
| **A4** | FE Dev 1 | Oct 18 | ✅ Done | Project dashboard, video grid (empty/populated), deep links | main | d335a06 |
| **F1** | QA | Oct 20 | ✅ Done | M0 test plan executed, device matrix (4 devices), bug report | main | d335a06 |
| **PM** | PM | Oct 20 | ✅ Done | Risk register updated, mid/exit reviews scheduled, demo script | main | d335a06 |

### M0 Burnup
- **Planned Story Points:** 42h
- **Completed Story Points:** 42h
- **Completion Rate:** 100% (9/9 tickets)

### M0 Exit Criteria
- [x] Expo project runs on iOS Simulator & Android Emulator
- [x] Navigation stacks configured (onboarding → main tabs with icons)
- [x] AsyncStorage schema v1 initialized
- [x] API contracts defined (provider-agnostic adapters documented)
- [x] Projects CRUD functional (create with Alert.prompt)
- [x] Settings Screen complete per PRD Section 15
- [x] No P0 bugs
- [x] 196 tests passing
- [x] TypeScript 0 errors

---

## M1: Recording + Teleprompter (Oct 21-Nov 3, 2025) - ✅ COMPLETE

| Ticket | Owner | Due | Status | Exit Criteria | Branch | Commit |
|--------|-------|-----|--------|---------------|--------|--------|
| **B1** | FE Dev 1 | Oct 23 | ✅ Done | Camera/mic permissions, error states, Settings deep link | milestone/M1 | 680f647 |
| **B2** | FE Dev 1 | Oct 26 | ✅ Done | Portrait 1080x1920@30fps, expo-camera integration | milestone/M1 | 6ad3491 |
| **B3** | FE Dev 1 | Oct 31 | ✅ Done | Teleprompter overlay: opacity 0.55, WPM 80-200, font S/M/L | milestone/M1 | 26d1903 |
| **B4** | FE Dev 1 | Nov 3 | ✅ Done | State machine: Idle → Recording ↔ Paused → Reviewing (FSM with useReducer) | milestone/M1 | d2f1d85 |
| **C2** | FE Dev 2 | Oct 28 | ✅ Done | FileSystem paths: raw/, processed/, temp/, cleanup logic | milestone/M1 | Multiple |
| **C3** | FE Dev 2 | Nov 1 | ✅ Done | Video metadata CRUD, query utils, unit tests 100% | milestone/M1 | abf4438 |
| **M1** | FE Dev 1 | Nov 3 | ✅ Done | Telemetry service with 30-day rotation | milestone/M1 | 3579301 |

### M1 Burnup
- **Planned Story Points:** 68h
- **Completed Story Points:** 68h
- **Completion Rate:** 100% (7/7 tickets - added M1 telemetry ticket)

### M1 Exit Criteria
- [x] expo-camera integration with CameraView
- [x] Recording FSM: Idle → Countdown → Recording ↔ Paused → Reviewing
- [x] Teleprompter with scrolling, WPM control, sentence highlighting
- [x] useRecording & useTeleprompter React hooks
- [x] Telemetry service with 30-day rotation
- [x] Video metadata CRUD operations
- [x] 176 M1-specific tests passing (196 total)
- [x] TypeScript 0 errors
- [x] Full documentation (README, TESTING, ADR-001)
- [x] CI passing

---

## M2: Processing Pipeline POC (Nov 4-17, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch |
|--------|-------|-----|--------|---------------|--------|
| **D1** | BEI | Nov 7 | ⏳ Pending | Upload adapter: resumable multipart, progress tracking | feature/backend-D1-upload-adapter |
| **D2** | BEI | Nov 10 | ⏳ Pending | AssemblyAI transcription, Deepgram fallback, webhook handling | feature/backend-D2-transcription |
| **D3** | BEI | Nov 12 | ⏳ Pending | Filler-word detection: precision >90%, recall >85% | feature/backend-D3-filler-detection |
| **D4** | BEI | Nov 15 | ⏳ Pending | Shotstack composition: cuts, intro/outro, subtitles | feature/backend-D4-composition |
| **D5** | BEI | Nov 17 | ⏳ Pending | Mux encoding: H.264, 1080x1920, checksum validation | feature/backend-D5-encoding |
| **D6** | BEI | Nov 17 | ⏳ Pending | Job orchestration state machine: parallel transcription, sequential composition | feature/backend-D6-orchestration |
| **D7** | BEI | Nov 8 | ⏳ Pending | Background removal adapter stub (deferred to Phase 2) | feature/backend-D7-bg-removal-stub |
| **D8** | BEI | Nov 14 | ⏳ Pending | AI script generation: GPT-4o + moderation, Claude fallback | feature/backend-D8-ai-script-gen |

### M2 Burnup
- **Planned Story Points:** 84h (D1:14h, D2:12h, D3:10h, D4:16h, D5:10h, D6:18h, D7:4h, D8:14h)
- **Completed Story Points:** 0h
- **Completion Rate:** 0% (0/8 tickets)

---

## M3: Feature Selection & Preview (Nov 18-24, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch |
|--------|-------|-----|--------|---------------|--------|
| **TBD** | FE | Nov 24 | ⏳ Pending | Feature selection screen, processing job state machine, preview player | feature/app-M3-features-preview |

### M3 Burnup
- **Planned Story Points:** 16h
- **Completed Story Points:** 0h
- **Completion Rate:** 0%

---

## M4: Export & Reliability (Nov 25-Dec 1, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch |
|--------|-------|-----|--------|---------------|--------|
| **TBD** | FE | Dec 1 | ⏳ Pending | Native share sheet, offline mode, error states, retry logic | feature/app-M4-export-reliability |

### M4 Burnup
- **Planned Story Points:** 20h
- **Completed Story Points:** 0h
- **Completion Rate:** 0%

---

## M5: Beta Hardening (Dec 2-15, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch |
|--------|-------|-----|--------|---------------|--------|
| **TBD** | QA | Dec 15 | ⏳ Pending | All acceptance criteria met, <5% crash rate, ≥90% processing success | feature/qa-M5-beta-hardening |

### M5 Burnup
- **Planned Story Points:** 40h
- **Completed Story Points:** 0h
- **Completion Rate:** 0%

---

## Overall Progress

| Milestone | Duration | Tickets | Completed | Status |
|-----------|----------|---------|-----------|--------|
| **M0** | Oct 7-20 | 9 | 9 | ✅ Complete (100%) |
| **M1** | Oct 21-Nov 3 | 7 | 7 | ✅ Complete (100%) |
| **M2** | Nov 4-17 | 8 | 0 | ⏳ Pending |
| **M3** | Nov 18-24 | 1 | 0 | ⏳ Pending |
| **M4** | Nov 25-Dec 1 | 1 | 0 | ⏳ Pending |
| **M5** | Dec 2-15 | 1 | 0 | ⏳ Pending |

**Total Progress:** 16/27 tickets (59.3%)

---

## Critical Path
```
A0 → A1 → A2 → A3 → A4 → F1 (M0 exit)
     ↓
    C1 (parallel to A2-A4)
     ↓
B1 → B2 → B3 → B4 (M1 recording)
     ↓
C2 → C3 (M1 storage)
     ↓
D1 → D2 → D3 → D4 → D5 → D6 (M2 pipeline)
     ↓
[M3 features] → [M4 export] → [M5 beta]
```

---

## Risk Register Summary
See `.orchestrator/risks.md` for details.

**Active Risks:**
- **R-001:** Expo SDK 54 migration issues (Low likelihood, High impact)

---

**Completed Milestones:**
- ✅ M0: Foundations (100%) - Commit aa87d6d
- ✅ M1: Recording & Teleprompter (100%) - Commit e762fd9

**Next Actions:**
1. Create PR from milestone/M1-recording-teleprompter to main
2. Begin M2: Processing Pipeline POC
3. Backend team: Start D1 (Upload adapter)
4. PM: Update sprint planning for M2
