# Bug Report Template

**Use this template when creating bug reports in GitHub Issues for Shorty.ai.**

---

## Bug Title
*Clear, concise title describing the issue (50 chars max)*

Example: "App crashes on project deletion (iOS 17)"

---

## Severity

**Select ONE:**

- [ ] **P0 - Blocker:** App crashes, data loss, critical feature completely broken, blocks release
- [ ] **P1 - Major:** Feature broken or severely impaired, workaround difficult, impacts core functionality
- [ ] **P2 - Minor:** Feature partially broken, workaround exists, cosmetic/UX issue
- [ ] **P3 - Trivial:** Minor cosmetic issue, enhancement request, low impact

---

## Labels

**Required labels to add:**

- Milestone: `M0`, `M1`, `M2`, etc.
- Platform: `iOS`, `Android`, or `both`
- Component: `onboarding`, `projects`, `dashboard`, `storage`, `navigation`, etc.
- Bug type: `bug`, `regression`, `performance`, `a11y` (accessibility)

**Example:** `M0`, `iOS`, `projects`, `bug`

---

## Environment

**Device:**
- Device Model: *(e.g., iPhone 14, Pixel 7)*
- OS Version: *(e.g., iOS 17.0, Android 13)*
- Screen Size: *(e.g., 6.1", 1080x2340)*

**App:**
- App Version: *(e.g., 0.1.0)*
- Build/Commit: *(e.g., commit SHA or branch name)*
- Expo Go Version: *(e.g., 54.0.0)*

**Network:**
- Connection: *(WiFi, 4G, 5G, Offline)*

---

## Steps to Reproduce

*Clear, numbered steps that consistently reproduce the issue. Be specific.*

1. Launch app (fresh install or specify existing data state)
2. Navigate to Projects List
3. Tap + button to create project
4. Enter project name: "Test Project"
5. Tap Save
6. Observe behavior

---

## Expected Behavior

*What should happen according to the spec/design?*

Example: "Project should be created and appear at the top of Projects List. A success toast should appear."

---

## Actual Behavior

*What actually happens? Be specific.*

Example: "App crashes immediately after tapping Save. No project is created. No error message shown."

---

## Screenshots / Videos

*Attach screenshots or screen recordings demonstrating the issue.*

- Before: *(screenshot of state before bug occurs)*
- After: *(screenshot showing the bug)*
- Video: *(screen recording if helpful, max 30s)*

**Upload images here or link to external hosting (e.g., Imgur, Google Drive)**

---

## Logs / Error Messages

*Paste any relevant error messages, console logs, or stack traces.*

```
Example:
Error: Cannot read property 'id' of undefined
  at ProjectsListScreen.tsx:45
  at AsyncStorage.getItem
```

**How to get logs:**
- iOS: Xcode Console or Expo Dev Tools
- Android: `adb logcat` or Expo Dev Tools
- Expo: Check terminal where `expo start` is running

---

## Reproduction Rate

*How often does this bug occur?*

- [ ] **Always (100%):** Happens every time
- [ ] **Often (50-99%):** Happens most times
- [ ] **Sometimes (10-49%):** Happens occasionally
- [ ] **Rare (<10%):** Hard to reproduce

---

## Workaround

*Is there a way to avoid or work around this issue?*

Example: "Use Edit instead of Create, or restart app before creating project."

If no workaround: "None known."

---

## Impact

*Describe the impact on users and development.*

Example: "Blocks M0 release. Users cannot create projects, core feature unusable. Affects all iOS 17 users."

---

## Additional Context

*Any other relevant information: related issues, recent changes, suspected cause, etc.*

- Related to PR #X
- Started happening after commit ABC123
- Only occurs when device has >20 projects
- Suspected cause: race condition in AsyncStorage write

---

## Acceptance Criteria for Fix

*When is this bug considered fixed? Define clear, testable criteria.*

Example:
- [ ] Project creation succeeds without crash
- [ ] Project appears in Projects List
- [ ] Success toast displays
- [ ] No console errors
- [ ] Verified on iPhone 14 (iOS 17) and Pixel 7 (Android 13)
- [ ] Regression tests pass

---

## Example Bug Report

### Bug Title
App crashes when deleting project with special characters in name (iOS 17)

### Severity
- [x] P1 - Major

### Labels
`M0`, `iOS`, `projects`, `bug`

### Environment
**Device:**
- Device Model: iPhone 14
- OS Version: iOS 17.0
- Screen Size: 6.1" (390x844)

**App:**
- App Version: 0.1.0
- Build/Commit: feature/app-A3-projects-crud (commit d823df2)
- Expo Go Version: 54.0.0

**Network:**
- Connection: WiFi

### Steps to Reproduce
1. Launch app and complete onboarding
2. Create project with name: "Test #1 @ Project"
3. Long-press the project
4. Tap Delete
5. Confirm deletion in modal
6. Observe app crashes

### Expected Behavior
Project should be soft-deleted (isDeleted set to true), disappear from list, and haptic feedback should fire. No crash.

### Actual Behavior
App crashes immediately after tapping Confirm in deletion modal. App restarts to splash screen. Project is NOT deleted (still appears after restart).

### Screenshots / Videos
*[Screenshot of crash report attached]*

### Logs / Error Messages
```
Error: Invalid regular expression
  at projectCrud.ts:78
  at AsyncStorage.setItem
```

### Reproduction Rate
- [x] Always (100%)

### Workaround
Avoid special characters in project names. Only alphanumeric and spaces work.

### Impact
Affects users who create projects with special characters. Prevents deletion, causes crashes, poor UX. Blocks M0 sign-off if not fixed (P1 severity).

### Additional Context
- Started after commit d823df2 (A3 CRUD implementation)
- Suspected cause: regex escaping issue in soft delete logic
- Only affects projects with special chars: #, @, $, %, etc.

### Acceptance Criteria for Fix
- [x] Projects with special characters can be deleted without crash
- [x] Soft delete (isDeleted: true) works correctly
- [x] No console errors
- [x] Verified on iPhone 14, iPhone 12, Pixel 7
- [x] Unit test added for special character handling

---

**End of Bug Template**

## Usage Instructions

1. Copy this template when creating a new GitHub Issue
2. Fill in all required sections
3. Attach screenshots/videos if available
4. Add appropriate labels (M0, iOS/Android, component)
5. Assign to appropriate team member or leave unassigned for triage
6. Link to related issues or PRs if applicable

For questions about bug reporting, contact QA Lead.
