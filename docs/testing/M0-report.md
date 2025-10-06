# M0 Milestone Test Report

**Project:** Shorty.ai MVP
**Milestone:** M0 - Foundations
**Test Period:** 2025-10-18 to 2025-10-20
**QA Lead:** QA Team
**Status:** READY FOR EXECUTION

---

## Executive Summary

This document defines the comprehensive test plan for M0 Foundations milestone, covering tickets A1-A4 and C1. The M0 milestone establishes the foundation of Shorty.ai's mobile application, including Expo initialization, onboarding flow, project management, dashboard navigation, and storage schema with migrations.

### Scope
- A1: Expo SDK 54 initialization with navigation and AsyncStorage
- A2: Onboarding flow (niche selection)
- A3: Projects CRUD operations
- A4: Project Dashboard with deep links
- C1: AsyncStorage schema versioning and migrations

### Test Environment
- **Device Matrix:** 4 devices (see section below)
- **Network Conditions:** WiFi, Offline
- **Platforms:** iOS and Android
- **Test Method:** Manual testing via Expo Go

---

## Test Scope

### In Scope
- Expo app initialization on iOS and Android
- Navigation between all screens
- AsyncStorage persistence across app restarts
- Onboarding niche/sub-niche selection flow
- Projects CRUD (Create, Read, Update, Delete)
- Project Dashboard empty and populated states
- Deep link navigation (shortyai://project/{id})
- Schema migration v1 → v2
- Accessibility (VoiceOver/TalkBack)
- Error states and edge cases
- Network offline behavior

### Out of Scope (Future Milestones)
- Script generation
- Video recording
- Teleprompter
- Feature selection
- Video processing
- Export functionality
- Camera/microphone permissions

---

## Device Matrix

| Device | OS | Screen Size | Expo Go Version | Status |
|--------|----|-----------|--------------------|--------|
| iPhone 12 | iOS 16.0 | 6.1" (390x844) | Latest | PENDING |
| iPhone 14 | iOS 17.0 | 6.1" (390x844) | Latest | PENDING |
| Pixel 5 | Android 12 | 6.0" (1080x2340) | Latest | PENDING |
| Pixel 7 | Android 13 | 6.3" (1080x2400) | Latest | PENDING |

### Test Coverage Target
- 4 devices × 5 test scenarios = 20 device-scenario combinations
- Each test case executed on at least 2 devices (1 iOS, 1 Android)
- Critical paths tested on all 4 devices

---

## Test Cases

### A1: Expo Initialization (12 Test Cases)

#### TC-A1-01: Expo App Launches on iOS
**Priority:** P0 (Blocker)
**Preconditions:** Expo Go installed, QR code scanned
**Steps:**
1. Scan QR code with Expo Go on iPhone 14
2. Observe app launch

**Expected:**
- App loads within 4s (cold start)
- No crash or error messages
- Splash screen appears
- Navigation initializes

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

#### TC-A1-02: Expo App Launches on Android
**Priority:** P0 (Blocker)
**Preconditions:** Expo Go installed
**Steps:**
1. Open app via Expo Go on Pixel 7
2. Observe app launch

**Expected:**
- App loads within 4s (cold start)
- No crash or error messages
- Splash screen appears
- Navigation initializes

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

#### TC-A1-03: TypeScript Compilation
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Run `npm run typecheck` or `tsc --noEmit`
2. Review output

**Expected:**
- 0 TypeScript errors
- 0 TypeScript warnings
- Build completes successfully

**Device Coverage:** N/A (build-time)
**Status:** PENDING

---

#### TC-A1-04: ESLint Passes
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Run `npm run lint`
2. Review output

**Expected:**
- 0 ESLint errors
- 0 ESLint warnings
- All code follows style guide

**Device Coverage:** N/A (build-time)
**Status:** PENDING

---

#### TC-A1-05: Navigation Stack Renders
**Priority:** P0 (Blocker)
**Preconditions:** App launched
**Steps:**
1. Launch app
2. Verify Onboarding Stack visible (Splash screen)
3. Complete onboarding
4. Verify Main Stack visible (Projects List)

**Expected:**
- Onboarding Stack renders without errors
- Main Stack renders without errors
- Navigation transitions smooth (<300ms)
- No console errors

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A1-06: AsyncStorage Persistence - Write
**Priority:** P0 (Blocker)
**Preconditions:** App launched, fresh install
**Steps:**
1. Launch app
2. Complete onboarding (select Healthcare → Physiotherapy)
3. Verify data written to AsyncStorage

**Expected:**
- `userProfile` key exists in AsyncStorage
- Contains `{ niche: 'Healthcare', subNiche: 'Physiotherapy', completedAt: '<timestamp>' }`
- No errors in console

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A1-07: AsyncStorage Persistence - Read After Restart
**Priority:** P0 (Blocker)
**Preconditions:** TC-A1-06 completed
**Steps:**
1. Force quit app (swipe up on iOS, force stop on Android)
2. Relaunch app
3. Observe behavior

**Expected:**
- App skips onboarding
- Navigates directly to Projects List
- `userProfile` data intact
- No data loss

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A1-08: Warm Start Performance
**Priority:** P2 (Minor)
**Preconditions:** App launched once, backgrounded
**Steps:**
1. Launch app
2. Background app (home button)
3. Reopen app within 30 seconds
4. Measure time to interactive

**Expected:**
- App resumes within 2s
- No reload of data
- State preserved

**Device Coverage:** iPhone 12, Pixel 5
**Status:** PENDING

---

#### TC-A1-09: Cold Start Performance
**Priority:** P2 (Minor)
**Preconditions:** App never launched or force quit
**Steps:**
1. Force quit app
2. Wait 1 minute
3. Launch app
4. Measure time to splash screen disappearance

**Expected:**
- App loads within 4s
- Splash screen visible during load
- Smooth transition to first screen

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A1-10: Unit Tests Pass
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Run `npm test`
2. Review output

**Expected:**
- All unit tests pass
- Coverage ≥80% for utility functions
- No test failures

**Device Coverage:** N/A (build-time)
**Status:** PENDING

---

#### TC-A1-11: AsyncStorage Schema Initialization
**Priority:** P0 (Blocker)
**Preconditions:** Fresh install
**Steps:**
1. Install app
2. Launch for first time
3. Check AsyncStorage keys

**Expected:**
- `appStateVersion: 1` exists
- `projects: []` exists
- `scripts: []` exists
- `videos: []` exists
- `analytics: {}` exists
- `userProfile: null` exists

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A1-12: React Navigation Deep Link Configuration
**Priority:** P1 (Major)
**Preconditions:** App configured
**Steps:**
1. Review app.json
2. Verify linking configuration

**Expected:**
- Deep link scheme `shortyai://` configured
- Prefixes include `shortyai://`
- Navigation linking configured for project routes

**Device Coverage:** N/A (config review)
**Status:** PENDING

---

### A2: Onboarding Flow (14 Test Cases)

#### TC-A2-01: First Launch Shows Onboarding
**Priority:** P0 (Blocker)
**Preconditions:** Fresh install
**Steps:**
1. Install and launch app
2. Observe first screen

**Expected:**
- Splash screen appears briefly
- Niche Selection screen displays
- No Projects List shown
- No skip option available

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A2-02: Niche Selection Screen Renders
**Priority:** P0 (Blocker)
**Preconditions:** Onboarding started
**Steps:**
1. Launch app (first time)
2. Observe Niche Selection screen

**Expected:**
- Title: "Choose Your Content Focus" or similar
- 9 niches visible: Healthcare, Finance, Fitness, Education, Real Estate, Technology, Food & Beverage, Travel, Fashion
- Each niche tappable
- No niche pre-selected

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A2-03: Select Healthcare Niche
**Priority:** P0 (Blocker)
**Preconditions:** Niche Selection screen displayed
**Steps:**
1. Tap "Healthcare" niche
2. Observe behavior

**Expected:**
- Healthcare highlighted/selected
- Continue button enabled
- Sub-niche screen appears or inline selection shown
- Visual feedback on tap

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A2-04: Sub-Niche Selection - Healthcare
**Priority:** P0 (Blocker)
**Preconditions:** Healthcare niche selected
**Steps:**
1. Select Healthcare niche
2. View sub-niches
3. Observe options

**Expected:**
- At least 3 sub-niches displayed (e.g., Physiotherapy, Cardiology, Dermatology)
- Each sub-niche tappable
- No sub-niche pre-selected

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A2-05: Confirm Physiotherapy Sub-Niche
**Priority:** P0 (Blocker)
**Preconditions:** Healthcare → Physiotherapy selected
**Steps:**
1. Select Healthcare
2. Select Physiotherapy
3. Tap Confirm/Continue button
4. Observe result

**Expected:**
- Toast message appears: "Welcome to Shorty.ai!" or similar
- Navigate to Projects List screen
- userProfile saved to AsyncStorage
- Toast auto-dismisses after 3s

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A2-06: AsyncStorage Saves Onboarding Data
**Priority:** P0 (Blocker)
**Preconditions:** TC-A2-05 completed
**Steps:**
1. Complete onboarding (Healthcare → Physiotherapy)
2. Use dev tools or AsyncStorage viewer to inspect data

**Expected:**
- Key `userProfile` exists
- Value: `{ niche: 'Healthcare', subNiche: 'Physiotherapy', completedAt: '<ISO8601>' }`
- `completedAt` is valid timestamp

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A2-07: Onboarding Skipped After Completion
**Priority:** P0 (Blocker)
**Preconditions:** Onboarding completed once
**Steps:**
1. Complete onboarding
2. Force quit app
3. Relaunch app
4. Observe behavior

**Expected:**
- App skips onboarding screens
- Directly shows Projects List
- No Splash → Niche Selection flow
- userProfile data persisted

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A2-08: Back Navigation in Onboarding
**Priority:** P1 (Major)
**Preconditions:** Sub-niche selection screen
**Steps:**
1. Select Healthcare niche
2. Navigate to sub-niche screen
3. Press back button (Android) or swipe back (iOS)
4. Observe behavior

**Expected:**
- Returns to Niche Selection screen
- Healthcare selection cleared or remains selected
- Abandonment modal may appear
- Can re-select or change niche

**Device Coverage:** iPhone 12, Pixel 7
**Status:** PENDING

---

#### TC-A2-09: Abandonment Modal (if applicable)
**Priority:** P2 (Minor)
**Preconditions:** Onboarding in progress
**Steps:**
1. Start onboarding
2. Attempt to exit app or navigate back
3. Observe modal

**Expected:**
- Modal appears: "Exit onboarding?" or similar
- Options: Cancel, Exit
- Cancel returns to onboarding
- Exit may reset progress (spec dependent)

**Device Coverage:** iPhone 14, Pixel 5
**Status:** PENDING

---

#### TC-A2-10: VoiceOver - Niche Selection
**Priority:** P1 (Major)
**Preconditions:** iOS device, VoiceOver enabled
**Steps:**
1. Enable VoiceOver in Settings
2. Launch app (first time)
3. Navigate Niche Selection screen with VoiceOver

**Expected:**
- Screen announces: "Niche selection screen. Choose your content focus." or similar
- Each niche button has label: "Healthcare", "Finance", etc.
- Continue button announces state: "Continue button, disabled" or "enabled"
- Focus order logical (top to bottom)

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

#### TC-A2-11: TalkBack - Sub-Niche Selection
**Priority:** P1 (Major)
**Preconditions:** Android device, TalkBack enabled
**Steps:**
1. Enable TalkBack in Settings
2. Launch app (first time)
3. Select niche and navigate to sub-niche screen

**Expected:**
- Each sub-niche button has label
- Confirm button announces state
- Gestures work (swipe navigation)
- Focus visible and clear

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

#### TC-A2-12: Toast Auto-Dismiss
**Priority:** P2 (Minor)
**Preconditions:** Onboarding completed
**Steps:**
1. Complete onboarding
2. Observe toast: "Welcome to Shorty.ai!"
3. Wait 3 seconds without interaction

**Expected:**
- Toast appears at bottom or top
- Message visible and readable
- Auto-dismisses after 3s
- Navigation proceeds to Projects List

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A2-13: Select Different Niches (Finance)
**Priority:** P2 (Minor)
**Preconditions:** Fresh install
**Steps:**
1. Launch app
2. Select "Finance" niche
3. Select a finance sub-niche (e.g., "Banking")
4. Confirm

**Expected:**
- userProfile saves: `{ niche: 'Finance', subNiche: 'Banking', ... }`
- Navigate to Projects List
- Toast appears
- No errors

**Device Coverage:** iPhone 12, Pixel 5
**Status:** PENDING

---

#### TC-A2-14: Rapid Tapping (Race Condition)
**Priority:** P3 (Trivial)
**Preconditions:** Sub-niche selection screen
**Steps:**
1. Select niche and sub-niche
2. Rapidly tap Confirm button 5+ times
3. Observe behavior

**Expected:**
- Button disables after first tap
- Single navigation occurs (no double-navigation)
- Single AsyncStorage write
- No crash or error

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

### A3: Projects CRUD (16 Test Cases)

#### TC-A3-01: Projects List Empty State
**Priority:** P0 (Blocker)
**Preconditions:** Onboarding completed, no projects created
**Steps:**
1. Complete onboarding
2. Arrive at Projects List screen

**Expected:**
- Empty state message: "No projects yet. Tap + to create." or similar
- + button visible and centered
- No project cards shown
- No errors

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A3-02: Create First Project
**Priority:** P0 (Blocker)
**Preconditions:** Projects List empty
**Steps:**
1. Tap + button
2. Enter project name: "Patient Tips"
3. Niche/sub-niche pre-filled (from userProfile)
4. Tap Save/Confirm

**Expected:**
- Project created successfully
- Project appears at top of Projects List
- Project card shows: name, niche, sub-niche, timestamp
- AsyncStorage updated with project object

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A3-03: AsyncStorage Project Data Structure
**Priority:** P0 (Blocker)
**Preconditions:** 1 project created
**Steps:**
1. Create project: "Patient Tips"
2. Inspect AsyncStorage `projects` key

**Expected:**
- `projects` is array with 1 item
- Item structure: `{ id: <uuid>, name: 'Patient Tips', niche: 'Healthcare', subNiche: 'Physiotherapy', createdAt: <ISO8601>, updatedAt: <ISO8601>, isDeleted: false }`
- `id` is valid UUID
- Timestamps valid ISO8601

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-04: Create 5 Projects
**Priority:** P0 (Blocker)
**Preconditions:** Projects List accessible
**Steps:**
1. Create Project 1: "Stretching Tips"
2. Create Project 2: "Pain Management"
3. Create Project 3: "Posture Fixes"
4. Create Project 4: "Recovery Exercises"
5. Create Project 5: "Injury Prevention"
6. Observe list

**Expected:**
- All 5 projects visible in list
- Sorted by `updatedAt` DESC (most recent first)
- Each project card distinct
- No duplicates
- AsyncStorage contains 5 project objects

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-05: Edit Project Name
**Priority:** P0 (Blocker)
**Preconditions:** 5 projects exist
**Steps:**
1. Long-press or tap menu on Project 2 ("Pain Management")
2. Select Edit
3. Change name to "Pain Relief Methods"
4. Save

**Expected:**
- Project name updated in list
- Project moves to top (updatedAt changed)
- `updatedAt` timestamp reflects edit time
- AsyncStorage updated
- No data loss

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A3-06: Edit Project Niche/Sub-Niche
**Priority:** P1 (Major)
**Preconditions:** 1+ projects exist
**Steps:**
1. Edit a project
2. Change niche from Healthcare to Fitness
3. Change sub-niche accordingly
4. Save

**Expected:**
- Niche and sub-niche updated
- Project card reflects changes
- AsyncStorage updated
- Project moves to top (updatedAt)

**Device Coverage:** iPhone 12, Pixel 5
**Status:** PENDING

---

#### TC-A3-07: Delete Project (Soft Delete)
**Priority:** P0 (Blocker)
**Preconditions:** 5 projects exist
**Steps:**
1. Long-press Project 3
2. Select Delete
3. Confirm deletion in modal: "Delete 'Posture Fixes'? This cannot be undone."
4. Observe result

**Expected:**
- Project 3 disappears from list
- 4 projects remain visible
- AsyncStorage: `projects[2].isDeleted = true`
- Haptic feedback (light impact)
- No crash

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A3-08: Delete Confirmation Modal
**Priority:** P1 (Major)
**Preconditions:** Project exists
**Steps:**
1. Long-press project
2. Select Delete
3. Observe modal
4. Tap Cancel

**Expected:**
- Modal appears: "Delete '[Project Name]'? This cannot be undone."
- Options: Cancel, Delete
- Cancel closes modal, no deletion
- Project remains in list

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-09: Haptic Feedback on Create
**Priority:** P2 (Minor)
**Preconditions:** Device supports haptics
**Steps:**
1. Create new project
2. Tap Save
3. Feel device response

**Expected:**
- Light haptic feedback on successful creation
- Feedback perceptible but not jarring

**Device Coverage:** iPhone 12, iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-10: Haptic Feedback on Delete
**Priority:** P2 (Minor)
**Preconditions:** Project exists
**Steps:**
1. Delete project
2. Confirm deletion
3. Feel device response

**Expected:**
- Light haptic feedback on deletion
- Feedback perceptible

**Device Coverage:** iPhone 12, iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-11: Project Name Validation - Too Short
**Priority:** P1 (Major)
**Preconditions:** Create/Edit Project form
**Steps:**
1. Open Create Project form
2. Enter name: "AB" (2 chars)
3. Attempt to save

**Expected:**
- Validation error: "Project name must be 3-50 characters"
- Save button disabled or error shown
- No project created

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-12: Project Name Validation - Too Long
**Priority:** P1 (Major)
**Preconditions:** Create/Edit Project form
**Steps:**
1. Open Create Project form
2. Enter name: 51+ characters
3. Attempt to save

**Expected:**
- Validation error: "Project name must be 3-50 characters"
- Input truncated or error shown
- No project created until corrected

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-13: Project Name Validation - Empty
**Priority:** P0 (Blocker)
**Preconditions:** Create Project form
**Steps:**
1. Open Create Project form
2. Leave name field empty
3. Attempt to save

**Expected:**
- Validation error: "Project name is required"
- Save button disabled
- No project created

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A3-14: Projects Sorted by updatedAt DESC
**Priority:** P1 (Major)
**Preconditions:** 5 projects exist
**Steps:**
1. Create Project A at 10:00
2. Create Project B at 10:01
3. Edit Project A at 10:02
4. Observe list order

**Expected:**
- Order: Project A (10:02), Project B (10:01), others by creation time
- Most recently updated at top
- Timestamps accurate

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A3-15: Long-Press Context Menu (iOS)
**Priority:** P1 (Major)
**Preconditions:** 1+ projects exist, iOS device
**Steps:**
1. Long-press on project card
2. Observe context menu

**Expected:**
- Menu appears with options: Edit, Delete
- Menu is native iOS context menu
- Haptic feedback on long-press
- Menu dismisses on tap outside

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

#### TC-A3-16: Long-Press Context Menu (Android)
**Priority:** P1 (Major)
**Preconditions:** 1+ projects exist, Android device
**Steps:**
1. Long-press on project card
2. Observe context menu or modal

**Expected:**
- Menu/modal appears with options: Edit, Delete
- Menu is native Android or custom modal
- Dismisses on tap outside or cancel

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

### A4: Project Dashboard & Deep Links (12 Test Cases)

#### TC-A4-01: Navigate to Project Dashboard
**Priority:** P0 (Blocker)
**Preconditions:** 1+ projects exist
**Steps:**
1. From Projects List, tap on a project
2. Observe navigation

**Expected:**
- Navigate to Project Dashboard screen
- Screen shows project name in header
- Dashboard loads without errors
- Back button returns to Projects List

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A4-02: Dashboard Empty State (No Videos)
**Priority:** P0 (Blocker)
**Preconditions:** Project exists with no videos
**Steps:**
1. Tap on project with no videos
2. Observe Dashboard

**Expected:**
- Empty state message: "No videos yet. Tap + to create." or similar
- + button visible and centered
- No video thumbnails shown
- No errors

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A4-03: Dashboard with 3 Videos (Stub Data)
**Priority:** P0 (Blocker)
**Preconditions:** Project with 3 video metadata entries in AsyncStorage
**Steps:**
1. Manually add 3 video objects to AsyncStorage `videos` key
2. Navigate to project dashboard
3. Observe video grid

**Expected:**
- 3 video thumbnails displayed in grid
- Grid: 2 columns on mobile
- Duration badges visible (e.g., "01:30")
- Thumbnails tappable (even if stub)

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A4-04: Video Thumbnail Placeholder
**Priority:** P1 (Major)
**Preconditions:** Video metadata exists but no actual video file
**Steps:**
1. Create video metadata with `type: 'processed'`
2. Set `localUri` to non-existent file
3. View dashboard

**Expected:**
- Placeholder icon/image shown (e.g., play icon)
- Duration badge still visible
- No crash or broken image

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A4-05: Raw Videos Hidden
**Priority:** P1 (Major)
**Preconditions:** Video with `type: 'raw'` and `status: 'ready'`
**Steps:**
1. Add raw video metadata to AsyncStorage
2. Add processed video metadata
3. View dashboard

**Expected:**
- Only processed videos shown
- Raw videos hidden (unless status is 'failed')
- Grid shows processed videos only

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A4-06: Failed Processing Shows Raw Video
**Priority:** P2 (Minor)
**Preconditions:** Video with `type: 'raw'`, `status: 'failed'`
**Steps:**
1. Create raw video with failed status
2. View dashboard

**Expected:**
- Raw video shown with "Failed" badge
- User can tap to retry or view
- Clear visual distinction from processed videos

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A4-07: Deep Link - Valid Project ID (iOS)
**Priority:** P0 (Blocker)
**Preconditions:** App installed, project exists with known UUID
**Steps:**
1. Open Safari on iOS
2. Navigate to URL: `shortyai://project/550e8400-e29b-41d4-a716-446655440000` (use actual project UUID)
3. Observe app behavior

**Expected:**
- App opens (or switches if already open)
- Navigates to Project Dashboard for that projectId
- Dashboard loads correctly
- No errors

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

#### TC-A4-08: Deep Link - Valid Project ID (Android)
**Priority:** P0 (Blocker)
**Preconditions:** App installed, project exists
**Steps:**
1. Use adb command: `adb shell am start -a android.intent.action.VIEW -d "shortyai://project/550e8400-e29b-41d4-a716-446655440000"`
2. Observe app behavior

**Expected:**
- App opens (or switches)
- Navigates to Project Dashboard for projectId
- Dashboard loads correctly
- No errors

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

#### TC-A4-09: Deep Link - Invalid Project ID
**Priority:** P1 (Major)
**Preconditions:** App installed
**Steps:**
1. Open deep link with invalid/non-existent UUID: `shortyai://project/invalid-uuid-12345`
2. Observe behavior

**Expected:**
- Error banner appears: "Project not found"
- Redirect to Projects List after 3s
- No crash
- Graceful error handling

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-A4-10: Deep Link - Malformed URL
**Priority:** P2 (Minor)
**Preconditions:** App installed
**Steps:**
1. Open malformed deep link: `shortyai://project/`
2. Observe behavior

**Expected:**
- Error banner: "Invalid link"
- Redirect to home screen (Projects List)
- No crash

**Device Coverage:** iPhone 12, Pixel 5
**Status:** PENDING

---

#### TC-A4-11: Video Grid Layout - Mobile (2 Columns)
**Priority:** P1 (Major)
**Preconditions:** Dashboard with 6+ videos
**Steps:**
1. View dashboard on mobile device (screen width <768px)
2. Observe grid layout

**Expected:**
- Grid displays 2 columns
- Videos evenly spaced
- Responsive sizing
- No overflow or cutoff

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-A4-12: Duration Badge Overlay
**Priority:** P2 (Minor)
**Preconditions:** Video with duration metadata
**Steps:**
1. Add video with `durationSec: 95` (1m 35s)
2. View dashboard

**Expected:**
- Duration badge shows "01:35"
- Badge positioned bottom-right
- Background: 60% opacity black
- Text: white, readable

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

### C1: AsyncStorage Schema & Migrations (10 Test Cases)

#### TC-C1-01: Schema Version Check on First Launch
**Priority:** P0 (Blocker)
**Preconditions:** Fresh install
**Steps:**
1. Install app
2. Launch for first time
3. Check `appStateVersion` in AsyncStorage

**Expected:**
- `appStateVersion: 1` set
- No migration runs (already at v1)
- All schema keys initialized

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-02: Migration Framework Exists
**Priority:** P0 (Blocker)
**Preconditions:** Code review
**Steps:**
1. Review `src/storage/migrations.ts`
2. Verify functions exist: `checkSchemaVersion()`, `runMigrations()`, `rollbackMigration()`

**Expected:**
- All 3 functions implemented
- TypeScript types defined
- Unit tests exist

**Device Coverage:** N/A (code review)
**Status:** PENDING

---

#### TC-C1-03: Simulate v1 → v2 Migration
**Priority:** P0 (Blocker)
**Preconditions:** Development environment
**Steps:**
1. Set `appStateVersion: 1` manually
2. Create projects without `isDeleted` field
3. Run migration (simulate app upgrade to v2)
4. Verify result

**Expected:**
- Migration adds `isDeleted: false` to all projects
- `appStateVersion` updated to 2
- No data loss
- Backup created

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-04: Backup Created Before Migration
**Priority:** P0 (Blocker)
**Preconditions:** Migration triggered
**Steps:**
1. Trigger migration from v1 → v2
2. Check AsyncStorage for backup key
3. Verify backup contents

**Expected:**
- Key `backup_v1` exists
- Contains snapshot of all data before migration
- Data is valid JSON
- Includes all AsyncStorage keys

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-05: Migration Success - Data Integrity
**Priority:** P0 (Blocker)
**Preconditions:** v1 data exists
**Steps:**
1. Create 5 projects in v1 schema
2. Run migration to v2
3. Verify all projects intact

**Expected:**
- All 5 projects exist after migration
- New field `isDeleted: false` added
- Existing fields unchanged (name, niche, timestamps)
- No data corruption

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-C1-06: Migration Rollback on Failure
**Priority:** P0 (Blocker)
**Preconditions:** Development environment
**Steps:**
1. Set up migration that throws error (mock failure)
2. Run migration
3. Verify rollback

**Expected:**
- Migration fails gracefully
- Data restored from `backup_v1`
- `appStateVersion` remains 1
- Error modal shown: "Update failed. App restored to previous version. Contact support."

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-07: Rollback Atomic Operation
**Priority:** P1 (Major)
**Preconditions:** Migration failed
**Steps:**
1. Trigger failed migration
2. Verify rollback is all-or-nothing
3. Check data consistency

**Expected:**
- All keys restored or none
- No partial rollback
- Data matches backup exactly
- No mixed state

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-08: Multiple Migrations (v1 → v2 → v3)
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Start with v1
2. Migrate to v2
3. Migrate to v3 (mock v3 schema)
4. Verify sequential migration

**Expected:**
- Migrations run in sequence: v1→v2, v2→v3
- No skipped versions
- Each migration creates backup
- Final `appStateVersion: 3`

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-09: Old Backup Cleanup
**Priority:** P2 (Minor)
**Preconditions:** Multiple migrations completed
**Steps:**
1. Complete migration v1 → v2
2. Complete migration v2 → v3
3. Check AsyncStorage for backups

**Expected:**
- Only `backup_v2` exists (most recent)
- `backup_v1` deleted
- Max 1 previous backup retained

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-C1-10: Unit Tests for Migrations
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Run `npm test src/storage/__tests__/migrations.test.ts`
2. Review coverage report

**Expected:**
- All migration tests pass
- Coverage ≥95% for migration logic
- Tests cover: success, failure, rollback, multiple migrations

**Device Coverage:** N/A (unit tests)
**Status:** PENDING

---

## Network Condition Testing

### WiFi Connectivity

#### TC-NET-01: App Functions Normally on WiFi
**Priority:** P1 (Major)
**Preconditions:** Device connected to WiFi
**Steps:**
1. Connect device to WiFi
2. Launch app
3. Navigate through all M0 screens
4. Create/edit/delete projects

**Expected:**
- All features work normally
- No network-related errors (M0 has no network calls)
- AsyncStorage operations successful

**Device Coverage:** All 4 devices
**Status:** PENDING

---

### Offline Mode

#### TC-NET-02: App Functions Fully Offline
**Priority:** P0 (Blocker)
**Preconditions:** Device in Airplane mode
**Steps:**
1. Enable Airplane mode
2. Launch app
3. Complete onboarding
4. Create 3 projects
5. Navigate to dashboard

**Expected:**
- All features work (M0 has no network dependency)
- AsyncStorage operations successful
- No errors or warnings
- No "offline" banner needed (future feature)

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-NET-03: Offline → Online Transition
**Priority:** P2 (Minor)
**Preconditions:** App running offline
**Steps:**
1. Launch app in Airplane mode
2. Create 2 projects
3. Disable Airplane mode (connect to WiFi)
4. Continue using app

**Expected:**
- App continues functioning normally
- No data loss
- No errors on network state change
- Projects created offline persist

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

## Edge Cases & Error Handling

### Storage

#### TC-EDGE-01: Low Storage Warning Simulation
**Priority:** P2 (Minor)
**Preconditions:** Simulated low storage (<500MB free)
**Steps:**
1. Simulate low storage condition (fill device or mock FileSystem API)
2. Launch app
3. Attempt to create project

**Expected:**
- Warning banner: "Storage low. Free up space before recording." or similar
- Project creation may still work (only metadata)
- Warning dismissible
- No crash

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-EDGE-02: AsyncStorage Quota Exceeded (Unlikely)
**Priority:** P3 (Trivial)
**Preconditions:** Massive data in AsyncStorage
**Steps:**
1. Create 1000+ projects (scripted)
2. Observe behavior

**Expected:**
- App handles quota gracefully
- Error message if quota exceeded
- No crash
- Older backups may be purged

**Device Coverage:** iPhone 14
**Status:** PENDING

---

### Data Corruption

#### TC-EDGE-03: Corrupted AsyncStorage Data
**Priority:** P1 (Major)
**Preconditions:** Development environment
**Steps:**
1. Manually corrupt `projects` key in AsyncStorage (invalid JSON)
2. Launch app
3. Observe error handling

**Expected:**
- App detects corrupted data
- Error modal: "Data corrupted. Resetting to defaults."
- Initialize fresh schema
- No crash

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-EDGE-04: Missing appStateVersion
**Priority:** P1 (Major)
**Preconditions:** AsyncStorage manipulated
**Steps:**
1. Delete `appStateVersion` key
2. Launch app
3. Observe behavior

**Expected:**
- App initializes `appStateVersion: 1`
- No migration attempted
- App functions normally
- No data loss

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

### Rapid Actions

#### TC-EDGE-05: Rapid Project Creation
**Priority:** P2 (Minor)
**Preconditions:** Projects List screen
**Steps:**
1. Tap + button
2. Quickly create 10 projects in succession (tap Save rapidly)
3. Observe list

**Expected:**
- All 10 projects created
- No duplicates
- UUIDs unique
- Timestamps sequential

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-EDGE-06: Rapid Navigation (Back/Forward)
**Priority:** P3 (Trivial)
**Preconditions:** Multiple screens available
**Steps:**
1. Navigate: Projects List → Dashboard → Back → Dashboard → Back (rapidly)
2. Observe behavior

**Expected:**
- No crash
- Navigation stack handles correctly
- No memory leaks (within test duration)
- No duplicate screens

**Device Coverage:** iPhone 12, Pixel 5
**Status:** PENDING

---

## Accessibility Testing

### VoiceOver (iOS)

#### TC-A11Y-01: VoiceOver - Projects List
**Priority:** P1 (Major)
**Preconditions:** iOS device, VoiceOver enabled, 3+ projects
**Steps:**
1. Enable VoiceOver
2. Navigate to Projects List
3. Swipe through projects

**Expected:**
- Each project card announces: "[Project Name], [Niche], [Sub-Niche], button"
- + button announces: "Create project, button"
- Focus order: top to bottom
- Double-tap to activate

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

#### TC-A11Y-02: VoiceOver - Project Dashboard
**Priority:** P1 (Major)
**Preconditions:** iOS, VoiceOver enabled, dashboard with videos
**Steps:**
1. Navigate to dashboard with VoiceOver
2. Swipe through video thumbnails

**Expected:**
- Each thumbnail announces: "Video, duration [X minutes Y seconds], button"
- + button announces: "Create video, button"
- Back button announces correctly

**Device Coverage:** iPhone 12, iPhone 14
**Status:** PENDING

---

### TalkBack (Android)

#### TC-A11Y-03: TalkBack - Onboarding Flow
**Priority:** P1 (Major)
**Preconditions:** Android, TalkBack enabled
**Steps:**
1. Enable TalkBack
2. Complete onboarding with TalkBack gestures
3. Select niche and sub-niche

**Expected:**
- All buttons labeled
- Niche/sub-niche announce on focus
- Confirm button announces state (enabled/disabled)
- Swipe gestures work

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

#### TC-A11Y-04: TalkBack - Project Form
**Priority:** P1 (Major)
**Preconditions:** Android, TalkBack enabled
**Steps:**
1. Open Create Project form with TalkBack
2. Navigate through fields

**Expected:**
- Name field announces: "Project name, edit text"
- Niche/sub-niche pickers announce selection
- Save button announces state
- Error messages announced

**Device Coverage:** Pixel 5, Pixel 7
**Status:** PENDING

---

### Font Scaling

#### TC-A11Y-05: Large Text Support (200% Scaling)
**Priority:** P1 (Major)
**Preconditions:** Device font size set to maximum
**Steps:**
1. Set device font size to 200% (largest)
2. Navigate through all M0 screens
3. Observe text rendering

**Expected:**
- All text scales appropriately
- No text cutoff or overflow
- Buttons remain tappable
- Layouts adapt (multiline if needed)

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

### Color Contrast

#### TC-A11Y-06: Color Contrast Ratios (WCAG AA)
**Priority:** P1 (Major)
**Preconditions:** Design review
**Steps:**
1. Review all screens with contrast checker tool
2. Measure text/background contrast

**Expected:**
- All text ≥4.5:1 contrast ratio
- Large text (≥18pt) ≥3:1
- Interactive elements clearly distinguishable
- Meets WCAG AA standard

**Device Coverage:** N/A (design review + manual check)
**Status:** PENDING

---

### Tap Targets

#### TC-A11Y-07: Minimum Tap Target Size (44x44pt)
**Priority:** P1 (Major)
**Preconditions:** All screens
**Steps:**
1. Review all interactive elements
2. Measure tap target sizes
3. Test tapping small targets

**Expected:**
- All buttons ≥44x44pt
- Links and icons ≥44x44pt
- Easy to tap without errors
- No accidental taps on adjacent elements

**Device Coverage:** All 4 devices
**Status:** PENDING

---

## Performance Testing

### Load Time

#### TC-PERF-01: Cold Start Time (All Devices)
**Priority:** P1 (Major)
**Preconditions:** App force quit
**Steps:**
1. Force quit app
2. Launch app
3. Measure time from tap to splash screen disappearance

**Expected:**
- iPhone 12: <4s
- iPhone 14: <4s
- Pixel 5: <4s
- Pixel 7: <4s

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-PERF-02: Warm Start Time (All Devices)
**Priority:** P2 (Minor)
**Preconditions:** App backgrounded
**Steps:**
1. Background app
2. Wait 10 seconds
3. Reopen app
4. Measure time to interactive

**Expected:**
- iPhone 12: <2s
- iPhone 14: <2s
- Pixel 5: <2s
- Pixel 7: <2s

**Device Coverage:** All 4 devices
**Status:** PENDING

---

### UI Responsiveness

#### TC-PERF-03: Button Tap Response Time
**Priority:** P1 (Major)
**Preconditions:** Any screen with buttons
**Steps:**
1. Tap various buttons throughout app
2. Observe response time

**Expected:**
- Visual feedback (highlight) within 100ms
- Action initiated within 100ms
- No perceivable lag

**Device Coverage:** All 4 devices
**Status:** PENDING

---

#### TC-PERF-04: Screen Transition Time
**Priority:** P1 (Major)
**Preconditions:** Multiple screens
**Steps:**
1. Navigate: Projects List → Dashboard
2. Navigate: Dashboard → Back
3. Measure transition duration

**Expected:**
- Transitions complete within 300ms
- Smooth animation (60fps if applicable)
- No stutter or jank

**Device Coverage:** All 4 devices
**Status:** PENDING

---

### Memory

#### TC-PERF-05: Memory Usage - Baseline
**Priority:** P2 (Minor)
**Preconditions:** App freshly launched
**Steps:**
1. Launch app
2. Navigate to Projects List
3. Check memory usage (dev tools or Xcode/Android Studio)

**Expected:**
- Memory usage reasonable (<100MB for basic screens)
- No memory warnings
- Stable over time (no gradual increase)

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

#### TC-PERF-06: Memory Usage - 50 Projects
**Priority:** P3 (Trivial)
**Preconditions:** 50 projects created
**Steps:**
1. Create 50 projects (scripted)
2. Navigate to Projects List
3. Scroll through all projects
4. Check memory usage

**Expected:**
- Memory usage scales linearly
- No excessive memory consumption
- Scroll remains smooth

**Device Coverage:** iPhone 14, Pixel 7
**Status:** PENDING

---

## Bug Template Validation

### Test Bug Template

#### TC-BUG-01: Bug Template Structure
**Priority:** P1 (Major)
**Preconditions:** Bug template created
**Steps:**
1. Review `/docs/testing/bug-template.md`
2. Verify required fields exist

**Expected:**
- Severity levels: P0, P1, P2, P3 defined
- Required fields: Device, OS, Steps to Reproduce, Expected vs Actual
- Labels: M0, iOS/Android

**Device Coverage:** N/A (document review)
**Status:** PENDING

---

## Test Execution Summary

### Summary Table (To Be Filled During Execution)

| Test Area | Total Cases | Pass | Fail | Blocked | Coverage % |
|-----------|-------------|------|------|---------|------------|
| A1: Expo Init | 12 | - | - | - | -% |
| A2: Onboarding | 14 | - | - | - | -% |
| A3: Projects CRUD | 16 | - | - | - | -% |
| A4: Dashboard & Deep Links | 12 | - | - | - | -% |
| C1: Schema & Migrations | 10 | - | - | - | -% |
| Network Conditions | 3 | - | - | - | -% |
| Edge Cases | 6 | - | - | - | -% |
| Accessibility | 7 | - | - | - | -% |
| Performance | 6 | - | - | - | -% |
| **TOTAL** | **86** | **-** | **-** | **-** | **-%** |

---

## Device-Scenario Matrix

| Scenario | iPhone 12 (iOS 16) | iPhone 14 (iOS 17) | Pixel 5 (Android 12) | Pixel 7 (Android 13) |
|----------|--------------------|--------------------|----------------------|----------------------|
| App Launch & Init | PENDING | PENDING | PENDING | PENDING |
| Onboarding Flow | PENDING | PENDING | PENDING | PENDING |
| Projects CRUD | PENDING | PENDING | PENDING | PENDING |
| Dashboard & Deep Links | PENDING | PENDING | PENDING | PENDING |
| Schema Migrations | PENDING | PENDING | PENDING | PENDING |

---

## Known Issues / Bugs

*To be populated during test execution. Link to GitHub Issues with M0 label.*

### Example Entry:
- **Issue #X:** Project name validation allows special characters
  **Severity:** P2 (Minor)
  **Device:** All
  **Status:** Open
  **Link:** https://github.com/org/repo/issues/X

---

## Pass Criteria (M0 Exit Gate)

### Criteria for M0 Sign-Off

✅ **PASS if:**
- 0 P0 bugs (blockers)
- ≤2 P1 bugs (major)
- ≤5 P2 bugs (minor)
- Crash rate <5% (based on manual test sessions)
- All critical paths tested on all 4 devices
- AsyncStorage persistence verified
- Navigation flows complete end-to-end
- Accessibility baseline met (VoiceOver/TalkBack labels, tap targets)

❌ **FAIL (No-Go for M1) if:**
- Any P0 bugs exist
- >2 P1 bugs exist
- Crash rate ≥5%
- Critical path failures (onboarding, project creation, navigation)
- Data loss issues

---

## Recommendations for M1

*To be completed after test execution.*

### Areas for Improvement
- [ ] Optimize AsyncStorage read/write performance if >50 projects cause lag
- [ ] Enhance error messages for clearer user guidance
- [ ] Add loading indicators for AsyncStorage operations if delays occur
- [ ] Improve VoiceOver labels based on user feedback

### New Test Areas for M1
- [ ] Camera permissions and recording flow
- [ ] Teleprompter overlay and controls
- [ ] Script generation (AI and manual)
- [ ] Feature selection toggles
- [ ] Video processing mock/stub
- [ ] Export via share sheet

### Technical Debt
- [ ] Document AsyncStorage schema evolution plan for v3, v4
- [ ] Automate migration testing with fixtures
- [ ] Add integration tests for navigation flows
- [ ] Performance baseline metrics for future comparison

---

## Test Execution Log

### Test Session 1: 2025-10-18
**Tester:** [Name]
**Device:** iPhone 14 (iOS 17)
**Duration:** [X hours]
**Cases Executed:** [X]
**Passed:** [X]
**Failed:** [X]
**Blocked:** [X]
**Notes:** [Any observations, blockers, or issues]

### Test Session 2: 2025-10-18
**Tester:** [Name]
**Device:** Pixel 7 (Android 13)
**Duration:** [X hours]
**Cases Executed:** [X]
**Passed:** [X]
**Failed:** [X]
**Blocked:** [X]
**Notes:** [Any observations]

---

## Sign-Off

**QA Lead Approval:** _____________________ Date: __________

**ENG-LEAD Approval:** _____________________ Date: __________

**PM Approval:** _____________________ Date: __________

---

**End of M0 Test Report**
