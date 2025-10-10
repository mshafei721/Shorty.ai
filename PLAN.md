# UI/UX Refresh Implementation Plan

**Branch:** `feature/uiux-refresh-2025-10-10`
**Start Date:** 2025-10-10
**Target Completion:** 2025-10-24 (2 weeks)
**Platform:** Dual (React Native mobile + React Web selective)

---

## Executive Summary

Implement a Gen-Z-friendly, accessible, mobile-first design system for Shorty.ai with:
- ✅ **No gradients** (solid colors, subtle shadows only)
- ✅ **WCAG AA minimum** (AAA for critical CTAs)
- ✅ **Design tokens** (JSON + TypeScript + CSS)
- ✅ **Dual platform support** (RN mobile primary, selective React Bits web)
- ✅ **Component library** (reusable primitives)
- ✅ **Accessibility baked in** (contrast, touch targets, motion sensitivity)

---

## Scope

### In-Scope ✅

1. Design token system (colors, typography, spacing, motion)
2. Base component library (buttons, inputs, cards, modals)
3. Flow-specific components (6 core user journeys)
4. React Bits selective integration (web build only, gradients removed)
5. Documentation (DESIGN_SYSTEM.md, COMPONENT_MAPPING.md, Storybook/tests)
6. Accessibility validation (contrast, touch targets, focus states)

### Out-of-Scope ❌

1. Backend API changes
2. State management refactoring (keep existing Context/XState)
3. Video processing pipeline modifications
4. Analytics/telemetry schema changes
5. Comprehensive E2E test suite (spot-check only)
6. Dark mode full implementation (tokens prepared, UI deferred to Phase 2)

---

## Milestones

| # | Milestone | Duration | Deliverables | Blocker Risk |
|---|-----------|----------|--------------|--------------|
| **M1** | Design Tokens + Base Primitives | 2 days | `tokens.json/ts/css`, Button/Input/Card | Low |
| **M2** | Core Component Library | 3 days | 12 shared components (see below) | Low |
| **M3** | Flow 1+2 (Onboarding + Script) | 2 days | Niche selection, AI script studio | Medium (API dep) |
| **M4** | Flow 3 (Recording) | 2 days | Camera preview, teleprompter overlay | Medium (permissions) |
| **M5** | Flow 4+5 (Features + Processing) | 2 days | Feature toggles, progress tracking | Low |
| **M6** | Flow 6 (Preview + Export) | 1 day | Video player, share sheet | Low |
| **M7** | React Bits Integration (Web) | 2 days | Gradient removal, theming 6 components | Medium (CSS overrides) |
| **M8** | Documentation + Testing | 2 days | Storybook, accessibility audit, PR prep | Low |

**Total:** 14 days (2 weeks with buffer)

---

## Detailed Task Breakdown

### M1: Design Tokens + Base Primitives (Days 1-2)

**Objective:** Establish design language foundation.

#### Tasks

- [x] **T1.1** Create `src/design-system/tokens.json` (color scales, typography, spacing, motion)
- [x] **T1.2** Create `src/design-system/tokens.ts` (TypeScript types + exports)
- [x] **T1.3** Create `src/design-system/tokens.css` (CSS variables for web)
- [x] **T1.4** Write `DESIGN_SYSTEM.md` (usage guide, examples, accessibility rules)
- [ ] **T1.5** Create `src/components/design-system/Button.tsx` (Primary/Secondary/Ghost/Destructive variants)
- [ ] **T1.6** Create `src/components/design-system/Input.tsx` (Text/Number/TextArea with validation states)
- [ ] **T1.7** Create `src/components/design-system/Card.tsx` (Default/Interactive variants)
- [ ] **T1.8** Write unit tests for Button/Input/Card (Jest + RTL)

**Acceptance Criteria:**
- All tokens validate against WCAG AA contrast requirements
- Button meets 44×44px minimum touch target
- Focus states visible on all interactive elements
- TypeScript types enforce token usage (no hardcoded colors)

**Dependencies:** None

**Risk:** Low

---

### M2: Core Component Library (Days 3-5)

**Objective:** Build reusable primitives for all flows.

#### Tasks

- [ ] **T2.1** `Badge.tsx` (Semantic colors, size variants: small/medium)
- [ ] **T2.2** `Modal.tsx` (Overlay backdrop, bottom sheet variant for mobile)
- [ ] **T2.3** `Toast.tsx` (Success/Error/Info/Warning with auto-dismiss)
- [ ] **T2.4** `ProgressBar.tsx` (Determinate/Indeterminate modes)
- [ ] **T2.5** `Stepper.tsx` (Step indicator for onboarding, mobile-optimized)
- [ ] **T2.6** `Switch.tsx` (Toggle with RN `Switch` theming)
- [ ] **T2.7** `Slider.tsx` (Volume/Speed controls, accessible value announce)
- [ ] **T2.8** `Avatar.tsx` (Circular, fallback to initials, size variants)
- [ ] **T2.9** `Spinner.tsx` (Loading indicator, respects `prefers-reduced-motion`)
- [ ] **T2.10** `EmptyState.tsx` (Illustration + message + CTA)
- [ ] **T2.11** `ErrorBoundary.tsx` enhancement (Design system styled)
- [ ] **T2.12** Write component tests + Storybook stories (web build)

**Acceptance Criteria:**
- All components use design tokens exclusively
- No hardcoded colors, spacing, or font sizes
- Accessibility props (`accessibilityLabel`, `accessibilityRole`) present
- Storybook renders all states (default, hover, pressed, disabled, error)

**Dependencies:** M1 complete

**Risk:** Low

---

### M3: Flow 1+2 — Onboarding + Script Studio (Days 6-7)

**Objective:** Niche selection → AI script generation/manual paste.

#### Tasks

- [ ] **T3.1** Restyle `NicheSelectionScreen.tsx` with `Card` + `Button` components
- [ ] **T3.2** Create `NicheCard.tsx` (Pressable card with selected state, 44×44px min)
- [ ] **T3.3** Create `SubNicheSheet.tsx` (Bottom sheet modal with preset list)
- [ ] **T3.4** Create `StepIndicator.tsx` (Horizontal stepper, 3 steps)
- [ ] **T3.5** Restyle `ScriptStudioWrapper.tsx` with tab navigation
- [ ] **T3.6** Create `AIPromptForm.tsx` (Topic input + description textarea + generate button)
- [ ] **T3.7** Create `WordCounter.tsx` (Live word count with min/max validation)
- [ ] **T3.8** Create `EstimateBadge.tsx` (Duration estimate based on WPM)
- [ ] **T3.9** Integrate React Bits `AnimatedList` for script history (web build)
- [ ] **T3.10** Test on iPhone SE (small) and Pixel 8 Pro (large)

**Acceptance Criteria:**
- Niche cards have ≥44×44px touch targets with 8px spacing
- Word counter announces validation state to screen reader
- Onboarding flow completes in <30s (user testing)
- Script generation loading state shows spinner + estimated wait time

**Dependencies:** M2 complete, AI script API available (blocker if unavailable)

**Risk:** Medium (API dependency)

---

### M4: Flow 3 — Recording + Teleprompter (Days 8-9)

**Objective:** Camera preview → teleprompter overlay → recording controls.

#### Tasks

- [ ] **T4.1** Restyle `RecordScreen.tsx` with full-screen camera preview
- [ ] **T4.2** Enhance `CameraPreview.tsx` with design system overlays
- [ ] **T4.3** Restyle `TeleprompterOverlay.tsx` with new typography scale
- [ ] **T4.4** Create `RecordButton.tsx` (72px circular, semantic.error color, haptic feedback)
- [ ] **T4.5** Create `TimerDisplay.tsx` (Monospace font, large size, live region)
- [ ] **T4.6** Create `ControlBar.tsx` (Bottom-aligned, thumb-reachable zone)
- [ ] **T4.7** Create `TeleprompterControls.tsx` (WPM slider, font size toggle, play/pause)
- [ ] **T4.8** Implement countdown overlay (3-2-1 animation, `motion.normal`)
- [ ] **T4.9** Test camera permissions flow (banner + modal)
- [ ] **T4.10** Validate teleprompter readability (contrast ≥7:1 on overlay)

**Acceptance Criteria:**
- Record button accessible at bottom 20% of screen (thumb zone)
- Teleprompter text meets AAA contrast (7:1) on 55% opacity overlay
- State changes announced (recording started, paused, stopped)
- Auto-stop at 120s with warning at 110s

**Dependencies:** M2 complete, camera permissions granted (blocker in tests)

**Risk:** Medium (permissions, device-specific camera APIs)

---

### M5: Flow 4+5 — Feature Selection + Processing (Days 10-11)

**Objective:** Feature toggles → upload → processing status → retry/cancel.

#### Tasks

- [ ] **T5.1** Restyle `FeaturesScreen.tsx` with toggle cards
- [ ] **T5.2** Create `FeatureToggleCard.tsx` (Card + Switch, accessible role="switch")
- [ ] **T5.3** Create `PresetCarousel.tsx` (Horizontal scroll, snap points, page indicators)
- [ ] **T5.4** Create `VolumeSlider.tsx` (Slider with volume icon, 0-100 range)
- [ ] **T5.5** Integrate React Bits `Carousel` (web build, gradient removal)
- [ ] **T5.6** Restyle `ProcessingStatusScreen.tsx` with progress UI
- [ ] **T5.7** Create `StatusMachineBadge.tsx` (Semantic colors for idle/uploading/processing/complete/failed/cancelled)
- [ ] **T5.8** Enhance `ProgressBar.tsx` with percentage text overlay
- [ ] **T5.9** Integrate React Bits `Counter` + `CountUp` (web build, progress % and elapsed time)
- [ ] **T5.10** Create `RetryButton.tsx` + `CancelButton.tsx` with confirmation dialogs

**Acceptance Criteria:**
- Feature toggles clearly indicate on/off state (color + icon)
- Preset carousel announces "Page X of Y" to screen reader
- Progress bar live region updates every 5% increment
- Retry button only enabled after failure (not during processing)

**Dependencies:** M2 complete, M2Gateway API available

**Risk:** Low

---

### M6: Flow 6 — Preview + Export (Day 12)

**Objective:** Video playback → export → share sheet.

#### Tasks

- [ ] **T6.1** Restyle `PreviewScreen.tsx` with full-screen video player
- [ ] **T6.2** Create `VideoPlayer.tsx` (Custom controls overlay, play/pause/seek)
- [ ] **T6.3** Create `ExportButton.tsx` (Large size 56px, primary.600, AAA contrast)
- [ ] **T6.4** Enhance `ExportPanel.tsx` with export options (quality, format)
- [ ] **T6.5** Create `ExportStatusToast.tsx` (Success message, 3s auto-dismiss)
- [ ] **T6.6** Test native share sheet (iOS + Android)
- [ ] **T6.7** Fallback to media library save if share unavailable
- [ ] **T6.8** Test landscape orientation (preview screen only)

**Acceptance Criteria:**
- Video player controls accessible via keyboard (web) and touch (mobile)
- Export button meets AAA contrast (7:1)
- Share sheet presents platform-native UI (iOS share, Android intent)
- Success toast announces completion to screen reader

**Dependencies:** M2 complete, processed video available

**Risk:** Low

---

### M7: React Bits Integration (Web Build) (Days 13-14)

**Objective:** Selective integration of 6 React Bits components with gradient removal.

#### Tasks

- [ ] **T7.1** Set up React Bits in `package.json` (install via jsrepo or copy components)
- [ ] **T7.2** Create `src/components/react-bits-themed/` directory
- [ ] **T7.3** **Stepper:** Remove gradients, apply `primary.600` solid, map states to tokens
- [ ] **T7.4** **AnimatedList:** Replace animation durations with `motion.normal` (300ms)
- [ ] **T7.5** **Carousel:** Remove gradient indicators, use `primary.600` active dot, `neutral.200` inactive
- [ ] **T7.6** **ElasticSlider:** Map thumb to `accent.500`, track to `neutral.200`
- [ ] **T7.7** **Counter + CountUp:** No changes (already gradient-free)
- [ ] **T7.8** Write CSS overrides in `src/components/react-bits-themed/overrides.css`
- [ ] **T7.9** Test web build (`npm run web:dev`) with themed components
- [ ] **T7.10** Validate no gradients present (inspect CSS, search for `linear-gradient`)

**Acceptance Criteria:**
- Zero gradients in final web build (CI check: `grep -r "linear-gradient" src/`)
- All React Bits components use design tokens via CSS variables
- Web build passes Lighthouse accessibility audit (score ≥90)
- Components render correctly in Chrome, Safari, Firefox

**Dependencies:** M1-M6 complete

**Risk:** Medium (CSS specificity conflicts, React Bits internal styles)

---

### M8: Documentation + Testing (Days 15-16)

**Objective:** Final QA, accessibility audit, documentation, PR preparation.

#### Tasks

- [ ] **T8.1** Run TypeScript type check (`npm run typecheck`)
- [ ] **T8.2** Run ESLint + Prettier (`npm run lint`)
- [ ] **T8.3** Run unit tests with coverage (`npm run test:coverage` ≥80%)
- [ ] **T8.4** Run placeholder detection scan (`npm run scan:mocks`)
- [ ] **T8.5** Manual accessibility audit (contrast, touch targets, focus states)
  - [ ] Use WebAIM Contrast Checker on all text
  - [ ] Measure touch targets with iOS Accessibility Inspector
  - [ ] Tab through all interactive elements (focus visible)
  - [ ] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] **T8.6** Test `prefers-reduced-motion` (disable animations)
- [ ] **T8.7** Write Storybook stories for all components (web build)
- [ ] **T8.8** Update `DESIGN_SYSTEM.md` with final token values
- [ ] **T8.9** Update `COMPONENT_MAPPING.md` with actual component paths
- [ ] **T8.10** Write `MIGRATION_GUIDE.md` for gradient removal steps
- [ ] **T8.11** Take screenshots for PR (before/after comparisons)
- [ ] **T8.12** Write PR description with test plan and accessibility notes

**Acceptance Criteria:**
- All CI checks pass (types, lint, tests, mocks scan)
- Accessibility audit shows zero critical issues
- Storybook renders 100% of component states
- PR includes screenshots for all 6 flows

**Dependencies:** M1-M7 complete

**Risk:** Low

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI script API unavailable | Medium | High | Use mock data, mark T3.6 as blocked, defer integration |
| Camera permissions denied (test devices) | Medium | Medium | Test on personal devices, document permission flow |
| React Bits CSS conflicts | Medium | Medium | Use CSS Modules with high specificity, test in isolation |
| Design tokens change mid-implementation | Low | High | Lock tokens after M1 review, defer changes to Phase 2 |
| Accessibility violations found late | Low | High | Run contrast checks daily, use axe DevTools from M2 |
| Scope creep (dark mode, animations) | Medium | Medium | Defer to Phase 2, maintain focus on core flows |

---

## Quality Gates (Must Pass Before PR)

### Code Quality
- [ ] TypeScript strict mode enabled, zero errors
- [ ] ESLint zero warnings (exceptions documented)
- [ ] Test coverage ≥80% for component library
- [ ] No placeholder text (lorem ipsum, TODO, FIXME)
- [ ] No console.log statements in production code

### Accessibility
- [ ] All text meets WCAG AA contrast (4.5:1 normal, 3.0:1 large)
- [ ] Critical CTAs (Record, Export) meet AAA (7.0:1)
- [ ] All interactive elements ≥44×44px touch target
- [ ] Focus states visible on all focusable elements
- [ ] Screen reader announces state changes (loading, success, error)
- [ ] Motion respects `prefers-reduced-motion` (zero animation duration)

### Design System
- [ ] Zero gradients in final build (grep scan passes)
- [ ] All colors sourced from `tokens.*` (no hardcoded hex values)
- [ ] Typography uses token scales (no hardcoded font sizes)
- [ ] Spacing uses token scale (no magic numbers)

### Platform Compatibility
- [ ] Tested on iOS (iPhone SE, iPhone 15 Pro Max)
- [ ] Tested on Android (Pixel 4a, Pixel 8 Pro)
- [ ] Web build tested in Chrome, Safari, Firefox
- [ ] Landscape orientation functional for preview screens

---

## Success Metrics

### Quantitative
- Accessibility score: Lighthouse ≥90/100
- Test coverage: ≥80% for component library
- Build time: No increase >10% vs. baseline
- Bundle size: No increase >15% vs. baseline
- Type safety: 100% (zero `any` types)

### Qualitative
- User feedback: "Cool, intuitive, simple" (usability testing)
- Developer feedback: Easy to use tokens, clear documentation
- Design review: Meets Gen-Z aesthetic, high clarity

---

## Rollout Plan

### Phase 1: Merge to Main (Week 3)
1. PR approved by 2+ reviewers
2. All CI checks pass
3. Accessibility audit complete (zero critical issues)
4. Merge to `main` with squash commit
5. Tag release `v0.3.0` with changelog

### Phase 2: Dark Mode (Week 4-5)
- Implement dark mode toggle in Settings
- Test all components in dark mode
- Update Storybook with dark mode stories

### Phase 3: Animation Polish (Week 6)
- Add micro-interactions (button press, card tap)
- Implement page transitions
- Add haptic feedback patterns

### Phase 4: Web Dashboard (Week 7-8)
- Build web-only admin dashboard
- Integrate React Bits heavily (web build)
- Advanced analytics visualizations

---

## Commit Strategy

### Commit 1: Design Tokens (M1)
```bash
git add src/design-system/tokens.* DESIGN_SYSTEM.md
git commit -m "feat(design-system): add design tokens (colors, typography, spacing, motion)

- Define color scales (primary, accent, neutral, semantic)
- Define typography scale (display→tiny, weights, line heights)
- Define spacing scale (s0-s12, 4px base unit)
- Define motion tokens (duration, easing)
- Add DESIGN_SYSTEM.md with usage guide
- Add tokens.json, tokens.ts, tokens.css for dual platform support
- Ensure WCAG AA contrast compliance

Refs: #UX-001
"
```

### Commit 2: Base Components (M2)
```bash
git add src/components/design-system/
git commit -m "feat(components): add base component library (Button, Input, Card, Modal, Badge)

- Implement Button with 4 variants (Primary, Secondary, Ghost, Destructive)
- Implement Input with validation states (default, focus, error, disabled)
- Implement Card with interactive variant (pressable)
- Implement Modal with bottom sheet variant (mobile)
- Implement Badge with semantic colors
- Add unit tests (Jest + RTL) with 80%+ coverage
- Add Storybook stories for all states

Refs: #UX-002
"
```

### Commit 3: Flow Components (M3-M6)
```bash
git add src/screens/ src/features/*/screens/ src/features/*/components/
git commit -m "feat(flows): restyle 6 core user flows with design system

Flows updated:
1. Onboarding (niche selection + sub-niche)
2. Script Studio (AI generation + manual paste)
3. Recording (camera preview + teleprompter)
4. Feature Selection (toggles + presets)
5. Processing (status machine + progress tracking)
6. Preview + Export (video player + share sheet)

Changes:
- Apply design tokens to all screens
- Replace hardcoded colors with token references
- Ensure 44×44px touch targets
- Add focus states and accessibility labels
- Test on iPhone SE + Pixel 8 Pro

Refs: #UX-003
"
```

### Commit 4: React Bits Integration (M7)
```bash
git add src/components/react-bits-themed/ src/components/react-bits-themed/overrides.css
git commit -m "feat(web): integrate React Bits components with gradient removal

Components themed:
- Stepper (onboarding)
- AnimatedList (script history)
- Carousel (preset selection)
- ElasticSlider (volume control)
- Counter + CountUp (processing progress)

Changes:
- Remove all gradients, replace with solid colors
- Map React Bits props to design tokens via CSS variables
- Test web build (Chrome, Safari, Firefox)
- Verify zero gradients in final bundle (CI check passes)

Refs: #UX-004
"
```

### Commit 5: Documentation + Tests (M8)
```bash
git add DESIGN_SYSTEM.md COMPONENT_MAPPING.md PLAN.md MIGRATION_GUIDE.md __tests__/ *.stories.tsx
git commit -m "docs(design-system): add comprehensive documentation and accessibility audit

Documentation:
- DESIGN_SYSTEM.md (usage guide, token reference, accessibility rules)
- COMPONENT_MAPPING.md (flow-specific component breakdown)
- PLAN.md (implementation roadmap)
- MIGRATION_GUIDE.md (gradient removal steps)

Testing:
- Accessibility audit complete (zero critical issues)
- Lighthouse score: 92/100 (accessibility)
- Test coverage: 82% (component library)
- Storybook stories for all components

Refs: #UX-005
"
```

---

## PR Template

```markdown
## Summary
Implement Gen-Z-friendly, accessible, mobile-first design system for Shorty.ai with dual platform support (React Native mobile + React Web selective).

## Changes
- ✅ Design tokens (colors, typography, spacing, motion)
- ✅ Base component library (12 primitives)
- ✅ 6 core user flows restyled
- ✅ React Bits selective integration (web build, gradients removed)
- ✅ Accessibility audit (WCAG AA compliance)
- ✅ Comprehensive documentation (DESIGN_SYSTEM.md, COMPONENT_MAPPING.md)

## Screenshots
### Before
- [Onboarding] (screenshot)
- [Recording] (screenshot)
- [Export] (screenshot)

### After
- [Onboarding] (screenshot)
- [Recording] (screenshot)
- [Export] (screenshot)

## Test Plan
- [x] TypeScript type check passes
- [x] ESLint zero warnings
- [x] Unit tests ≥80% coverage
- [x] Placeholder detection scan passes
- [x] Manual accessibility audit (contrast, touch targets, focus states)
- [x] Tested on iOS (iPhone SE, iPhone 15 Pro Max)
- [x] Tested on Android (Pixel 4a, Pixel 8 Pro)
- [x] Web build tested (Chrome, Safari, Firefox)
- [x] `prefers-reduced-motion` respected
- [x] Zero gradients in final build

## Accessibility Notes
- All text meets WCAG AA contrast (4.5:1)
- Critical CTAs (Record, Export) meet AAA (7.0:1)
- All touch targets ≥44×44px
- Focus states visible with 2px primary.600 ring
- Screen reader tested with VoiceOver (iOS) and TalkBack (Android)

## Breaking Changes
None — design tokens are additive, existing components backward compatible.

## Next Steps (Phase 2)
- Dark mode toggle
- Animation polish
- Web dashboard (React Bits heavy)

## Refs
Closes #UX-001, #UX-002, #UX-003, #UX-004, #UX-005
```

---

## Contact & Support

**Design System Owner:** [Your Name]
**Questions:** Post in #design-system Slack channel
**Bug Reports:** https://github.com/yourorg/shorty.ai/issues (label: `design-system`)

---

**Status:** ✅ Plan approved, ready to execute
**Last Updated:** 2025-10-10
**Next Review:** 2025-10-17 (mid-sprint checkpoint)
