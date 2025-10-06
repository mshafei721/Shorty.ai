# M0 Kickoff Messages (2025-10-05)

---

## Message to: ENG-LEAD (Engineering Lead)
**From:** ORCH
**Purpose:** M0 Architecture Review & Guidelines Setup

### Context
M0 Foundations milestone starts Oct 7. Provider-agnostic architecture required per plan.md §5.4. Review guidelines & sprint planning needed before A1 kickoff.

### Task List
1. Review provider-agnostic adapter interfaces (Upload, Transcription, Composition, Encoding)
2. Define circuit breaker thresholds (5 failures → switchover)
3. Create CODEOWNERS file (require ENG-LEAD + QA approvals)
4. Set up PR template with sections: Summary | Scope | Screenshots | Tests | Risks | Rollback
5. Document retry/backoff pattern (2s/4s/8s, max 3 attempts)

### Acceptance Criteria
**Given:** Team ready to start M0
**When:** ENG-LEAD completes architecture docs
**Then:**
- Adapter interfaces documented in `/docs/architecture/adapters.md`
- Circuit breaker config in `/src/config/circuit-breakers.ts`
- CODEOWNERS file at `/.github/CODEOWNERS`
- PR template at `/.github/PULL_REQUEST_TEMPLATE.md`

### Constraints
- Expo Go managed workflow only
- All adapters must support provider switchover with <5min cutover
- Budget: $359/mo limit, <$0.50/clip target

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/arch-A0-setup-guidelines
- **Commits:** Conventional + [A0]
- **PR Template:** Required fields mandatory
- **Checks:** typecheck, lint (setup in A1)
- **Approvals:** ENG-LEAD + QA (self-approve first PR)

### Due:** 2025-10-08 (Day 2 of M0)

### Artifacts Requested
- PR URL with architecture docs
- CODEOWNERS file
- PR template

### Dependencies
None (blocks A1-A4)

### Checkpoints
- **Mid-Review:** 2025-10-07 (review adapter interfaces)
- **Exit Review:** 2025-10-08 (approve guidelines before A1 merge)

---

## Message to: FE (Frontend Lead)
**From:** ORCH
**Purpose:** A1 - Initialize Expo Project

### Context
M0 entry point. Expo SDK 54 per CLAUDE.md. Set up TypeScript, navigation, AsyncStorage schema v1. Must run on iOS Simulator & Android Emulator.

### Task List
1. Run `npx create-expo-app@latest shorty-ai --template expo-template-blank-typescript`
2. Install React Navigation v6: `@react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs`
3. Install AsyncStorage: `@react-native-async-storage/async-storage`
4. Set up navigation stacks: Onboarding (Splash → Niche → Confirmation) & Main (Projects List → Dashboard)
5. Initialize AsyncStorage schema v1: `{ appStateVersion: 1, projects: [], scripts: [], videos: [], analytics: {}, userProfile: null }`
6. Configure TypeScript strict mode, ESLint, Jest
7. Verify app runs on iOS & Android (screenshot evidence required)

### Acceptance Criteria
**Given:** Expo CLI installed
**When:** `npx expo start`
**Then:**
- App loads on iOS Simulator (iPhone 14, iOS 17)
- App loads on Android Emulator (Pixel 7, Android 13)
- Navigation stacks render stub screens
- AsyncStorage persists dummy data across app restart
- TypeScript compiles with 0 errors
- ESLint passes with 0 warnings
- Unit tests pass (≥1 test for AsyncStorage schema helper)

### Constraints
- Expo SDK 54 (managed workflow)
- TypeScript strict mode enabled
- No custom native modules
- Must support offline (AsyncStorage only, no network calls in M0)

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/arch-A1-init-expo
- **Commits:** `feat(A1): init expo project with nav & storage [A1]`
- **PR Template:** Include iOS/Android screenshots
- **Checks:** typecheck, lint, unit (≥80% coverage on utils)
- **Approvals:** ENG-LEAD + QA

### Due:** 2025-10-09 (Day 3 of M0)

### Artifacts Requested
- PR URL
- Screenshots: iOS Simulator & Android Emulator showing navigation
- Test report: `npm test --coverage` output

### Dependencies
A0 (architecture guidelines) must be merged first

### Checkpoints
- **Mid-Review:** 2025-10-08 (verify Expo runs locally)
- **Exit Review:** 2025-10-09 (PR merged, CI green)

---

## Message to: FE (Frontend Dev 1 - Onboarding)
**From:** ORCH
**Purpose:** A2 - Onboarding Flow (Niche Selection)

### Context
First-time user experience. Niche/sub-niche selection with AsyncStorage persistence. Must support 3 niches (Healthcare, Finance, Fitness) with 3 sub-niches each.

### Task List
1. Create Onboarding stack screens: Splash → NicheSelection → SubNicheConfirmation
2. Build niche dropdown/searchable list (9 niches per plan.md: Healthcare, Finance, Fitness, Education, Real Estate, Technology, Food & Beverage, Travel, Fashion)
3. Build sub-niche picker (Healthcare → [Physiotherapy, Cardiology, Dermatology])
4. Implement AsyncStorage persistence: save to `userProfile: { niche, subNiche, completedAt }`
5. Show success toast: "Welcome to Shorty.ai!"
6. Navigate to Projects List on confirm
7. Handle back navigation: confirm abandonment modal
8. VoiceOver labels for all buttons/dropdowns

### Acceptance Criteria
**Given:** User launches app (no userProfile in AsyncStorage)
**When:** User selects Healthcare → Physiotherapy → Confirm
**Then:**
- `AsyncStorage.getItem('userProfile')` returns `{ niche: 'Healthcare', subNiche: 'Physiotherapy', completedAt: '2025-10-10T...' }`
- Navigate to Projects List screen
- Toast shown: "Welcome to Shorty.ai!"
- VoiceOver announces: "Niche selection screen. Choose your content focus."

**Given:** User has completed onboarding (userProfile exists)
**When:** App launches
**Then:** Skip onboarding, go directly to Projects List

### Constraints
- Niche list hardcoded (no API call in MVP)
- Sub-niches: 3 per niche minimum
- Toast duration: 3s, auto-dismiss
- VoiceOver: All interactive elements labeled

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/app-A2-onboarding-flow
- **Commits:** `feat(A2): onboarding niche selection [A2]`
- **PR Template:** Include VoiceOver test notes
- **Checks:** typecheck, lint, unit (test AsyncStorage save/load), a11y lint
- **Approvals:** ENG-LEAD + QA

### Due:** 2025-10-12 (Day 6 of M0)

### Artifacts Requested
- PR URL
- Screenshots: Niche selection, sub-niche picker, toast
- VoiceOver demo video (30s)

### Dependencies
A1 (Expo project init)

### Checkpoints
- **Mid-Review:** 2025-10-10 (UI mockup ready)
- **Exit Review:** 2025-10-12 (PR merged, a11y passing)

---

## Message to: FE (Frontend Dev 2 - Projects)
**From:** ORCH
**Purpose:** A3 - Projects List & CRUD

### Context
Core navigation hub. Display projects grid/list with create, edit, delete (soft delete). Must support unlimited projects.

### Task List
1. Create Projects List screen with empty state: "No projects yet. Tap + to create."
2. Build Create Project form: Name (required, 3-50 chars), Niche/Sub-niche (pre-filled from userProfile, editable), Confirm button
3. Implement AsyncStorage CRUD:
   - Create: `projects.push({ id: uuid(), name, niche, subNiche, createdAt, updatedAt, isDeleted: false })`
   - Read: `projects.filter(p => !p.isDeleted).sort((a,b) => b.updatedAt - a.updatedAt)`
   - Update: Edit name/niche, update `updatedAt`
   - Delete: Set `isDeleted: true` (soft delete)
4. Display projects sorted by `updatedAt DESC`
5. Long-press context menu: Edit | Delete
6. Confirm delete modal: "Delete '[Project Name]'? This cannot be undone."
7. Haptic feedback on create/delete

### Acceptance Criteria
**Given:** User on Projects List (no projects)
**When:** User taps + → Enters "Patient Tips" → Confirms
**Then:**
- Project appears at top of list
- `AsyncStorage.getItem('projects')` includes new project with `id`, `createdAt`, `isDeleted: false`

**Given:** User has 5 projects
**When:** User edits Project 2 (change name to "Updated")
**Then:**
- Project 2 moves to top (sorted by `updatedAt DESC`)
- `updatedAt` timestamp reflects change

**Given:** User long-presses Project 3 → Delete → Confirms
**When:** Deletion completes
**Then:**
- Project 3 disappears from list
- `projects[2].isDeleted === true` in AsyncStorage
- Haptic feedback fires (light impact)

### Constraints
- Project name: 3-50 chars, required
- Niche/sub-niche: Optional override of userProfile defaults
- Soft delete only (data retained for recovery)
- Sort: `updatedAt DESC` always

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/app-A3-projects-crud
- **Commits:** `feat(A3): projects list & crud [A3]`
- **PR Template:** Include create/edit/delete test cases
- **Checks:** typecheck, lint, unit (CRUD utils ≥90% coverage)
- **Approvals:** ENG-LEAD + QA

### Due:** 2025-10-15 (Day 9 of M0)

### Artifacts Requested
- PR URL
- Screenshots: Empty state, project list (5 items), edit form, delete modal
- Test report: Unit coverage for CRUD helpers

### Dependencies
A2 (onboarding for userProfile defaults)

### Checkpoints
- **Mid-Review:** 2025-10-13 (CRUD logic unit-tested)
- **Exit Review:** 2025-10-15 (PR merged, coverage ≥90%)

---

## Message to: FE (Frontend Dev 1 - Dashboard)
**From:** ORCH
**Purpose:** A4 - Project Dashboard & Deep Links

### Context
Per-project view. Display video thumbnails grid. Support deep link: `shortyai://project/{id}`.

### Task List
1. Create Project Dashboard screen (navigation param: `projectId`)
2. Display empty state if no videos: "No videos yet. Tap + to create."
3. Query videos from AsyncStorage: `videos.filter(v => v.projectId === projectId && v.type === 'processed')`
4. Show video grid with thumbnails (use first frame or placeholder icon)
5. Badge: Duration overlay (e.g., "01:30")
6. Hide raw videos unless processing failed
7. Configure deep linking: `shortyai://project/{id}`
8. Handle invalid projectId: Show error banner "Project not found" → redirect to Projects List
9. Pull-to-refresh (stub for future)

### Acceptance Criteria
**Given:** User taps Project 1 (no videos)
**When:** Project Dashboard loads
**Then:**
- Show empty state: "No videos yet. Tap + to create."
- + button centered on screen

**Given:** Project 2 has 3 processed videos
**When:** Dashboard loads
**Then:**
- Grid shows 3 thumbnails with duration badges
- Raw videos hidden (unless processing failed → show with "Failed" badge)

**Given:** User opens `shortyai://project/550e8400-e29b-41d4-a716-446655440000`
**When:** Deep link resolves
**Then:**
- Navigate to Project Dashboard for that projectId
- If projectId invalid → Show banner → Redirect to Projects List after 3s

### Constraints
- Thumbnails: Use Expo AV `VideoThumbnailsAsync` (first frame at 0.5s)
- Deep link: iOS Universal Links + Android App Links (configure in app.json)
- Grid: 2 columns on mobile, 3 on tablet
- Duration badge: Bottom-right overlay, 60% opacity black background

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/app-A4-dashboard-deeplinks
- **Commits:** `feat(A4): project dashboard & deep links [A4]`
- **PR Template:** Include deep link test instructions (iOS/Android)
- **Checks:** typecheck, lint, unit (test projectId validation)
- **Approvals:** ENG-LEAD + QA

### Due:** 2025-10-18 (Day 12 of M0)

### Artifacts Requested
- PR URL
- Screenshots: Empty state, video grid (3 items)
- Deep link test: Video showing `adb shell am start -a android.intent.action.VIEW -d "shortyai://project/550e8400"` on Android

### Dependencies
A3 (projects exist to navigate from)

### Checkpoints
- **Mid-Review:** 2025-10-16 (UI layout approved)
- **Exit Review:** 2025-10-18 (Deep links working on iOS/Android)

---

## Message to: FE (Frontend Dev 2 - Storage)
**From:** ORCH
**Purpose:** C1 - AsyncStorage Schema & Migrations

### Context
Define data schemas with versioning for future migrations. Support schema upgrades without data loss.

### Task List
1. Define AsyncStorage schema v1:
   ```ts
   {
     appStateVersion: 1,
     projects: Array<Project>,
     scripts: Array<Script>,
     videos: Array<VideoAsset>,
     analytics: Record<string, number>,
     userProfile: UserProfile | null
   }
   ```
2. Create migration framework:
   - `checkSchemaVersion()`: Read `appStateVersion`
   - `runMigrations()`: Apply migrations 1→2, 2→3, etc.
   - `rollbackMigration()`: Restore from backup on failure
3. Implement backup before migration: Save snapshot to `AsyncStorage.backup_v{N}`
4. Example migration (stub): v1 → v2 adds `isDeleted` to projects
5. Unit tests: Test migration success, rollback on failure, schema validation
6. Document migration guide in `/docs/storage/migrations.md`

### Acceptance Criteria
**Given:** App v1 with schema v1
**When:** User upgrades to app v2 (schema v2)
**Then:**
- `runMigrations()` detects `appStateVersion: 1`
- Backup created: `AsyncStorage.getItem('backup_v1')` contains snapshot
- Migration applied: Projects gain `isDeleted: false` field
- `appStateVersion` updated to 2
- No data loss

**Given:** Migration fails (throw error)
**When:** `runMigrations()` catches error
**Then:**
- Rollback triggered: Restore from `backup_v1`
- `appStateVersion` remains 1
- Show modal: "Update failed. App restored to previous version. Contact support."
- Log error to Sentry

### Constraints
- Backup: JSON serialize all keys, store as single string
- Rollback: Atomic operation (all-or-nothing)
- Max backup retention: 1 previous version (delete older backups)
- Schema version: Increment by 1 (no skipping)

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/storage-C1-schema-migrations
- **Commits:** `feat(C1): async storage schema & migrations [C1]`
- **PR Template:** Include migration test cases
- **Checks:** typecheck, lint, unit (migration logic ≥95% coverage)
- **Approvals:** ENG-LEAD + QA

### Due:** 2025-10-20 (Day 14 of M0 - exit)

### Artifacts Requested
- PR URL
- Test report: Coverage ≥95% for migration logic
- Migration guide doc

### Dependencies
A1 (AsyncStorage initialized)

### Checkpoints
- **Mid-Review:** 2025-10-17 (migration framework unit-tested)
- **Exit Review:** 2025-10-20 (docs complete, PR merged)

---

## Message to: PD (Product Designer)
**From:** ORCH
**Purpose:** M0 Design System & Figma Handoff

### Context
M0 requires design system foundation & Figma files for A2-A4 screens. WCAG AA compliance, 44×44pt tap targets, VoiceOver labels.

### Task List
1. Create design system in Figma:
   - Colors: Primary, Secondary, Error, Success, Neutral (5 shades each)
   - Typography: Headings (H1-H4), Body, Caption (scale 16pt base)
   - Components: Button (Primary/Secondary/Tertiary), TextInput, Modal, Banner, Toast, EmptyState
   - Icons: + (Create), Edit, Delete, Play, Pause, Settings
2. Design 10 screens for M0:
   - Onboarding: Splash, Niche Selection, Sub-niche Confirmation
   - Projects: List (empty), List (populated), Create Form, Edit Form
   - Dashboard: Empty, Populated (3 videos)
   - Error: Permissions Denied modal
3. Annotate for handoff:
   - Tap target sizes (≥44×44pt)
   - VoiceOver labels (accessibility annotations)
   - Color contrast ratios (≥4.5:1)
   - Font scaling notes (up to 200%)
4. Deliver Figma link + PDF export

### Acceptance Criteria
**Given:** Designer completes Figma files
**When:** FE team reviews
**Then:**
- All components have variants (default, hover, pressed, disabled)
- Screens include responsive layouts (mobile 375px, tablet 768px)
- Annotations visible: Tap targets (red boxes), VoiceOver labels (blue text)
- Contrast ratios checked (WCAG tool integrated in Figma)
- PDF export includes all artboards with annotations

### Constraints
- Platform: React Native (use RN primitives: View, Text, TouchableOpacity)
- Expo Go compatible (no custom fonts unless bundled)
- Design for iOS & Android (note platform differences: navigation bar height, status bar)
- VoiceOver/TalkBack: Label every interactive element

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/design-E1-system-library
- **Commits:** `feat(E1): design system & M0 screens [E1]`
- **PR Template:** Link to Figma file (public share link)
- **Checks:** Design review by ENG-LEAD + FE Lead (not CI)
- **Approvals:** ENG-LEAD + PM

### Due:** 2025-10-11 (Day 5 of M0 - before A2/A3 UI work starts)

### Artifacts Requested
- Figma link (public share with comment access)
- PDF export (annotated)

### Dependencies
None (parallel to A1)

### Checkpoints
- **Mid-Review:** 2025-10-09 (design system components ready)
- **Exit Review:** 2025-10-11 (screens approved, handoff complete)

---

## Message to: QA (QA Lead)
**From:** ORCH
**Purpose:** M0 Test Plan & Manual Walkthrough

### Context
Define test cases for A1-A4, C1. Device matrix: iPhone 12 (iOS 16), iPhone 14 (iOS 17), Pixel 5 (Android 12), Pixel 7 (Android 13).

### Task List
1. Write manual test plan for M0:
   - A1: Expo runs on iOS/Android, navigation works, AsyncStorage persists
   - A2: Onboarding flow (select niche → confirm → Projects List)
   - A3: Projects CRUD (create 5, edit 2, delete 1)
   - A4: Dashboard (empty state, 3 videos, deep link)
   - C1: Migration (simulate v1 → v2 upgrade)
2. Test on device matrix (4 devices)
3. Test network conditions: WiFi, Offline (AsyncStorage only in M0)
4. Test edge cases: Low storage warning (simulate <500MB free)
5. Test accessibility: VoiceOver (iOS), TalkBack (Android)
6. Document bugs in GitHub Issues: Severity (P0-P4), device info, screenshots

### Acceptance Criteria
**Given:** QA executes M0 test plan
**When:** Testing complete
**Then:**
- Test report published: `/docs/testing/M0-report.md`
- All test cases have status: Pass/Fail/Blocked
- Bugs logged (GitHub Issues) with labels: `M0`, `P0`-`P4`, `iOS`/`Android`
- Device matrix table included (4 devices × 5 test scenarios = 20 results)

**Pass Criteria (M0 Exit):**
- 0 P0 bugs (blockers)
- ≤2 P1 bugs (major)
- ≤5 P2 bugs (minor)
- Crash rate <5% (manual session tracking)

### Constraints
- Device access: Use Expo Go on physical devices (not simulators/emulators for final sign-off)
- Test duration: ~2 days (after all PRs merged)
- VoiceOver/TalkBack: Test all screens in A2-A4

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/qa-F1-m0-test-plan
- **Commits:** `test(F1): M0 test plan & manual execution [F1]`
- **PR Template:** Link to test report Markdown file
- **Checks:** Manual review only (no CI for test docs)
- **Approvals:** ENG-LEAD + PM

### Due:** 2025-10-20 (Day 14 of M0 - exit)

### Artifacts Requested
- Test report: `/docs/testing/M0-report.md`
- Bug list: Screenshot from GitHub Issues filtered by `M0` label
- Device matrix table

### Dependencies
A1-A4, C1 (all PRs merged)

### Checkpoints
- **Mid-Review:** 2025-10-18 (test plan drafted, reviewed by ENG-LEAD)
- **Exit Review:** 2025-10-20 (testing complete, report submitted)

---

## Message to: PM (Product Manager)
**From:** ORCH
**Purpose:** M0 Scope & Priorities (RICE)

### Context
M0 is entry gate. Validate RICE prioritization: Reach (all users), Impact (foundation), Confidence (high), Effort (42h total).

### Task List
1. Review M0 scope: Tickets A1-A4, C1 (no external APIs yet)
2. Validate priorities: A0 (guidelines) → A1 (init) → A2/A3/C1 (parallel) → A4 (dashboard)
3. Monitor risks:
   - **R-001:** Expo SDK 54 migration issues (Likelihood: Low, Impact: High, Mitigation: Test on both platforms early)
4. Track budget: $0 in M0 (no API costs)
5. Schedule mid/exit reviews:
   - **Mid-Review:** 2025-10-14 (check progress, unblock)
   - **Exit Review:** 2025-10-20 (go/no-go for M1)
6. Prepare demo script: "Navigate: Onboarding → Projects → Script → Record (stub)"

### Acceptance Criteria
**Given:** M0 tickets in progress
**When:** PM reviews PlanBoard
**Then:**
- All tickets have status: pending/in-progress/review/done
- No blockers unresolved >24h
- Risk register updated (add R-001 if Expo issues arise)
- Mid/exit review calendar events sent

**Given:** M0 exit review on 2025-10-20
**When:** PM runs demo script
**Then:**
- All screens load without crashes
- Navigation flows complete
- AsyncStorage persists data across restarts
- **Go:** If 0 P0 bugs, proceed to M1
- **No-Go:** If P0 bugs exist, delay M1 start

### Constraints
- Budget: $0 in M0 (no vendor APIs)
- Timeline: 2 weeks (Oct 7-20)
- Team: 6 people (ENG-LEAD, FE Lead, FE Dev 1, FE Dev 2, Designer, QA)

### Branch Plan
- **Milestone Branch:** milestone/M0-foundations
- **Feature Branch:** feature/pm-scope-tracking
- **Commits:** `chore(PM): M0 scope & risk tracking [PM]`
- **PR Template:** Link to PlanBoard, risk register
- **Checks:** N/A (PM tracking, no code)
- **Approvals:** ENG-LEAD (review only)

### Due:** 2025-10-20 (Day 14 of M0 - exit)

### Artifacts Requested
- Updated PlanBoard (in `.orchestrator/planboard.md`)
- Risk register (in `.orchestrator/risks.md`)
- Demo script (in `.orchestrator/M0-demo-script.md`)

### Dependencies
None (PM coordinates all)

### Checkpoints
- **Mid-Review:** 2025-10-14 (progress check, unblock team)
- **Exit Review:** 2025-10-20 (go/no-go decision)

---

**End of M0 Kickoff Messages**
