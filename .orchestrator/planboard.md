# Shorty.ai PlanBoard

**Last Updated:** 2025-10-06
**Current Milestone:** M0 (Foundations)

---

## Legend
- 🔵 In Progress
- ⏸️ Blocked
- ✅ Done
- ⏳ Pending

---

## M0: Foundations (Oct 7-20, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch | Notes |
|--------|-------|-----|--------|---------------|--------|-------|
| **A0** | ENG-LEAD | Oct 8 | 🔵 In Progress | Architecture docs, CODEOWNERS, PR template complete | feature/arch-A0-setup-guidelines | Blocks A1 |
| **E1** | PD | Oct 11 | 🔵 In Progress | Design system & 10 M0 screens in Figma, PDF handoff | feature/design-E1-system-library | Parallel to A1 |
| **A1** | FE | Oct 9 | 🔵 In Progress | Expo runs on iOS/Android, nav stacks, AsyncStorage v1 | feature/arch-A1-init-expo | Depends on A0 |
| **A2** | FE Dev 1 | Oct 12 | 🔵 In Progress | Onboarding flow: niche selection → AsyncStorage persistence | feature/app-A2-onboarding-flow | Depends on A1 |
| **A3** | FE Dev 2 | Oct 15 | 🔵 In Progress | Projects CRUD: create, edit, soft delete | feature/app-A3-projects-crud | Depends on A2 |
| **C1** | FE Dev 2 | Oct 20 | 🔵 In Progress | AsyncStorage schema v1, migration framework, unit tests ≥95% | feature/storage-C1-schema-migrations | Depends on A1 |
| **A4** | FE Dev 1 | Oct 18 | 🔵 In Progress | Project dashboard, video grid (empty/populated), deep links | feature/app-A4-dashboard-deeplinks | Depends on A3 |
| **A5** | FE Dev 2 | Oct 19 | ⏳ Pending | Dashboard hub panels (Active Videos, AI Drafts, Quick Actions) with empty/loading/error states | feature/app-A5-dashboard-hub | Depends on A3, C1 |
| **A6** | Designer | Oct 17 | ⏳ Pending | Dashboard & scripting workspace Figma delivery with responsive states | feature/design-A6-dashboard-scripting | Links to A5, I1 |
| **F1** | QA | Oct 20 | ⏳ Pending | M0 test plan executed, device matrix (4 devices), bug report | feature/qa-F1-m0-test-plan | Depends on A1-A5, C1 |
| **PM** | PM | Oct 20 | ⏳ Pending | Risk register updated, mid/exit reviews scheduled, demo script | feature/pm-scope-tracking | Coordinates all |

### M0 Burnup
- **Planned Story Points:** 58h (A0:2h, A1:4h, A2:8h, A3:12h, A4:10h, A5:10h, A6:6h, C1:8h, E1:16h, F1:20h, PM:2h = 108h total team effort, 58h dev)
- **Completed Story Points:** 0h
- **Completion Rate:** 0% (0/11 tickets)

### M0 Exit Criteria
- [ ] Expo project runs on iOS Simulator & Android Emulator
- [ ] Navigation stacks configured (onboarding → main tabs)
- [ ] Project dashboard hub (Active Videos, AI Drafts, Quick Actions) renders empty/loading states
- [ ] AsyncStorage schema v1 initialized
- [ ] API contracts defined (provider-agnostic adapters documented)
- [ ] Dashboard + scripting workspace Figma handoff approved
- [ ] No P0 bugs
- [ ] ≤2 P1 bugs
- [ ] Crash rate <5%

---

## M1: Recording + Teleprompter (Oct 21-Nov 3, 2025)

| Ticket | Owner | Due | Status | Exit Criteria | Branch |
|--------|-------|-----|--------|---------------|--------|
| **B1** | FE Dev 1 | Oct 23 | ⏳ Pending | Camera/mic permissions, error states, Settings deep link | feature/capture-B1-permissions |
| **B2** | FE Dev 1 | Oct 26 | ⏳ Pending | Portrait 1080x1920@30fps, 120s auto-stop, storage checks | feature/capture-B2-video-capture |
| **B3** | FE Dev 1 | Oct 31 | ⏳ Pending | Teleprompter overlay: opacity 0.55, WPM 80-200, font S/M/L | feature/capture-B3-teleprompter |
| **B4** | FE Dev 1 | Nov 3 | ⏳ Pending | State machine: Idle → Recording ↔ Paused → Reviewing | feature/capture-B4-state-machine |
| **B5** | FE Dev 1 | Oct 28 | ⏳ Pending | Teleprompter rehearsal mode, AI script handoff confirmation, multi-take management | feature/capture-B5-teleprompter-rehearsal |
| **I1** | FE Dev 1 | Oct 24 | ⏳ Pending | AI scripting studio UI with presets, tone/length controls, revision history, send-to-teleprompter | feature/app-I1-ai-scripting |
| **I2** | Backend Integrator | Oct 24 | ⏳ Pending | AI scripting API orchestration with moderation fallback and retries | feature/backend-I2-ai-scripting-api |
| **C2** | FE Dev 2 | Oct 28 | ⏳ Pending | FileSystem paths: raw/, processed/, temp/, cleanup logic | feature/storage-C2-filesystem |
| **C3** | FE Dev 2 | Nov 1 | ⏳ Pending | Video metadata CRUD, query utils, unit tests ≥90% | feature/storage-C3-metadata-crud |

### M1 Burnup
- **Planned Story Points:** 116h (B1:6h, B2:16h, B3:20h, B4:12h, B5:10h, I1:18h, I2:14h, C2:10h, C3:10h)
- **Completed Story Points:** 0h
- **Completion Rate:** 0% (0/9 tickets)

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
| **D9** | BEI | Nov 17 | ⏳ Pending | End-to-end subtitles slice (upload → transcript → captions → download) with telemetry and neutral errors | feature/backend-D9-subtitles-slice |

### M2 Burnup
- **Planned Story Points:** 102h (D1:14h, D2:12h, D3:10h, D4:16h, D5:10h, D6:18h, D7:4h, D8:14h, D9:14h)
- **Completed Story Points:** 0h
- **Completion Rate:** 0% (0/9 tickets)

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
| **M0** | Oct 7-20 | 11 | 0 | 🔵 In Progress (Foundations not yet shipped) |
| **M1** | Oct 21-Nov 3 | 9 | 0 | ⏳ Pending |
| **M2** | Nov 4-17 | 9 | 0 | ⏳ Pending |
| **M3** | Nov 18-24 | 1 | 0 | ⏳ Pending |
| **M4** | Nov 25-Dec 1 | 1 | 0 | ⏳ Pending |
| **M5** | Dec 2-15 | 1 | 0 | ⏳ Pending |

**Total Progress:** 0/32 tickets (0%)

---

## Critical Path
```
A0 → A1 → A2 → A3 → A4 → A5 → F1 (M0 exit)
     ↓
    C1 (parallel to A2-A5)
     ↓
B1 → B2 → B3 → B4 → B5 (M1 recording)
     ↓
I1 → I2 (AI scripting handoff)
     ↓
C2 → C3 (M1 storage)
     ↓
D1 → D2 → D3 → D4 → D5 → D6 → D9 (M2 pipeline)
     ↓
[M3 features] → [M4 export] → [M5 beta]
```

---

## Risk Register Summary
See `.orchestrator/risks.md` for details.

**Active Risks:**
- **R-001:** Expo SDK 54 migration issues (Low likelihood, High impact)

---

**Next Actions:**
1. ENG-LEAD: Complete A0 (architecture docs, CODEOWNERS, PR template)
2. PD: Complete E1 (design system, 10 M0 screens in Figma)
3. FE: Complete A1 (Expo init, navigation, AsyncStorage v1)
4. FE Dev 2: Kick off A5 (dashboard hub panels + states)
5. FE Dev 1: Begin I1/B5 (AI scripting studio UI, teleprompter rehearsal)
6. PM: Schedule mid-review (Oct 14) & exit review (Oct 20)

---
### 2025-10-08 Review Notes (Codex)
- [Done] Incorporated into ticket tables and status fields on 2025-10-08; remaining bullets kept for traceability.
- Ticket tables still show every M0 item as pending even though the overall summary claims M0 is complete; update individual statuses and burnup totals to match reality.
- Surface new tickets for the project dashboard hub, AI scripting workspace, sub-niche onboarding refinements, teleprompter control polish, and backend AI pipeline work so they can be tracked explicitly.
- Current milestone header lists M1 as active, but engineering progress indicates several M0/M1 features are unfinished; realign the Current Milestone indicator.
- Add dependency notes for the missing backend pipeline, since frontend previews rely on it; without these blockers tracked the board masks the critical path.
- Refresh hours/story points to reflect added scope (dashboard, AI scripting, pipeline) and reset completion percentages so stakeholders see the true remaining effort.

---
### 2025-10-08 Backlog Additions (Codex)
- [Done] Reflected via A5, A6, I1, I2, B5, D9 tickets and milestone updates above.
**Status Corrections**
- Mark A0–A4, C1, and E1 as “🔵 In Progress” until code and design deliverables ship; do not list M0 as complete while tickets remain open.
- Update burnup totals to reflect 0h completed for the above tickets and recalculate completion percentage accordingly.

**New Tickets**
| Ticket | Owner | Due | Status | Exit Criteria | Branch | Notes |
|--------|-------|-----|--------|---------------|--------|-------|
| **A5** | FE Dev 2 | Oct 19 | ⏳ Pending | Project dashboard hub (Active Videos, AI Drafts, Quick Actions) implemented with empty/loading/error states | feature/app-A5-dashboard-hub | Depends on A3, C1 |
| **A6** | Designer | Oct 17 | ⏳ Pending | Dashboard + scripting workspace Figma delivery, including mobile responsive states | feature/design-A6-dashboard-scripting | Links to A5, I1 |
| **I1** | FE Dev 1 | Oct 24 | ⏳ Pending | AI scripting studio UI with prompt presets, revision history, teleprompter send flow | feature/app-I1-ai-scripting | Depends on D8 |
| **I2** | Backend Integrator | Oct 24 | ⏳ Pending | AI scripting API orchestration with retries and moderation fallback | feature/backend-I2-ai-scripting-api | Depends on vendor credits |
| **B5** | FE Dev 1 | Oct 28 | ⏳ Pending | Teleprompter rehearsal mode and multi-take management | feature/capture-B5-teleprompter-rehearsal | Depends on B3 |
| **D9** | Backend Integrator | Nov 17 | ⏳ Pending | End-to-end subtitles pipeline (upload → transcript → burn-in → download) running in staging | feature/backend-D9-subtitles-slice | Depends on D1-D6 |

**Milestone Alignment**
- Set “Current Milestone” to M0 until A0–A4/C1/E1 reach ✅; include banner noting backend pipeline is a gating dependency for M2–M4.
- Add dependency column entries referencing D9 for M3/M4 tickets so the lack of a real pipeline is visible.
