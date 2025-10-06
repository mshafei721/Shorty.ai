# Risk Register

**Last Updated:** 2025-10-05
**Owner:** PM (Product Manager)

---

## Active Risks

### R-001: Expo SDK 54 Migration Issues
- **Description:** Incompatible modules or build failures during Expo SDK 54 setup
- **Owner:** ENG-LEAD
- **Likelihood:** Low (Expo SDK 54 is stable, documented)
- **Impact:** High (blocks all M0 work if init fails)
- **Mitigation:**
  1. Test on both iOS/Android in A1 immediately
  2. Review Expo SDK 54 migration guide before A1
  3. Have rollback plan to SDK 50 if critical blockers
  4. Allocate 2h buffer in A1 for troubleshooting
- **Trigger:** Build fails on CI after A1 merge OR incompatible modules detected
- **Status:** Open
- **Created:** 2025-10-05

---

### R-002: Team Onboarding Delay
- **Description:** Agents unfamiliar with Expo/React Native slow initial velocity
- **Owner:** PM
- **Likelihood:** Medium (new tech stack for some team members)
- **Impact:** Medium (tickets slip 1-3 days, M0 exit delayed)
- **Mitigation:**
  1. Provide quick-start docs in A0 (ENG-LEAD)
  2. Pair programming for A1-A2 (FE Lead mentors FE Dev 1)
  3. Daily standups to unblock questions
  4. Allocate 20% time buffer in first 2 weeks
- **Trigger:** Tickets slip >2 days past due date OR team reports blockers in standups
- **Status:** Open
- **Created:** 2025-10-05

---

### R-003: Design System Delay Blocks UI Work
- **Description:** E1 (design system) not ready by Oct 11, blocking A2-A4 UI implementation
- **Owner:** PD (Product Designer)
- **Likelihood:** Low (E1 starts immediately, 16h estimate reasonable)
- **Impact:** Medium (A2-A4 implementation paused, M0 exit delayed by 2-3 days)
- **Mitigation:**
  1. Start E1 immediately (parallel to A0-A1)
  2. Provide wireframes/mockups if Figma delayed (low-fidelity acceptable)
  3. Allow FE to proceed with placeholder UI, refine later
  4. Designer review async (via Figma comments) if not available for sync reviews
- **Trigger:** E1 not complete by Oct 11 OR Figma handoff missing by Oct 12
- **Status:** Open
- **Created:** 2025-10-05

---

## Deferred Risks (From plan.md, not active in M0)

### R-004: Cutout.Pro Cost Prohibitive
- **Description:** Background removal cost $28.5k/mo at 1k clips (deferred to Phase 2)
- **Status:** Deferred (not applicable in M0-M1)

### R-005: AssemblyAI SLA Breach
- **Description:** Transcription SLA <99.9% uptime
- **Status:** Deferred (applies in M2 POC)

### R-006: Filler-Word Precision <90%
- **Description:** Filler-word detection accuracy below target
- **Status:** Deferred (applies in M2 POC)

---

## Closed Risks

_None yet (first report)_

---

## Risk Matrix

| ID | Likelihood | Impact | Score | Status |
|----|-----------|--------|-------|--------|
| R-001 | Low (2) | High (4) | 8 | Open |
| R-002 | Medium (3) | Medium (3) | 9 | Open |
| R-003 | Low (2) | Medium (3) | 6 | Open |

**Legend:**
- Likelihood: Low=2, Medium=3, High=4
- Impact: Low=2, Medium=3, High=4, Critical=5
- Score: Likelihood × Impact

---

## Escalation Procedure

1. **Score 1-6 (Low):** Monitor weekly, PM reviews in standups
2. **Score 7-12 (Medium):** Monitor daily, PM + ENG-LEAD review, mitigation active
3. **Score 13-20 (High):** Escalate immediately, daily PM + ENG-LEAD + affected owner sync, mitigation mandatory

**Current Risks Requiring Active Mitigation:**
- R-002 (score 9): PM to provide quick-start docs, pair programming setup

---

**Next Review:** 2025-10-14 (M0 mid-review)
