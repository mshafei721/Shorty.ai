# A4 Project Dashboard & Deep Links - Test Guide

## Overview
This guide provides step-by-step instructions for testing the Project Dashboard enhancements and deep linking functionality implemented in ticket A4.

## Prerequisites
- Expo Go installed on test device (iOS/Android)
- Development server running: `npm start`
- Access to device shell (for deep link testing)

## Test 1: Empty State Display

### Steps:
1. Open app in Expo Go
2. Navigate to Projects List
3. Create a new project (if none exist)
4. Tap on the project card

### Expected Results:
- ✓ ProjectDashboard screen loads
- ✓ Project name and niche displayed in header
- ✓ Empty state message: "No videos yet. Tap + to create."
- ✓ "+ Create New Video" button visible at bottom

## Test 2: Video Grid Display (2 Columns Mobile)

### Setup:
Add test videos to AsyncStorage via React Native Debugger or create helper function:

```javascript
import { setStorageItem } from './src/storage';

const testVideos = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    projectId: 'YOUR_PROJECT_ID',
    type: 'processed',
    scriptId: null,
    localUri: 'file:///test1.mp4',
    durationSec: 45,
    sizeBytes: 1024000,
    createdAt: new Date().toISOString(),
    exportedAt: null,
    status: 'ready',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    projectId: 'YOUR_PROJECT_ID',
    type: 'processed',
    scriptId: null,
    localUri: 'file:///test2.mp4',
    durationSec: 78,
    sizeBytes: 2048000,
    createdAt: new Date().toISOString(),
    exportedAt: null,
    status: 'ready',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    projectId: 'YOUR_PROJECT_ID',
    type: 'processed',
    scriptId: null,
    localUri: 'file:///test3.mp4',
    durationSec: 120,
    sizeBytes: 3072000,
    createdAt: new Date().toISOString(),
    exportedAt: null,
    status: 'ready',
  },
];

// In a useEffect or button handler:
const existingVideos = await getStorageItem('videos') || [];
await setStorageItem('videos', [...existingVideos, ...testVideos]);
```

### Steps:
1. Navigate to project with test videos
2. Observe video grid layout

### Expected Results:
- ✓ Videos displayed in 2-column grid on mobile
- ✓ Each video card shows:
  - Play icon (▶) in center
  - Duration badge in bottom-right corner
  - Duration format: "M:SS" (e.g., "0:45", "1:18", "2:00")
  - Badge background: rgba(0, 0, 0, 0.6) [60% opacity]

## Test 3: Tablet/Wide Screen (3 Columns)

### Steps:
1. Test on tablet OR
2. Use browser DevTools to resize to 768px+ width

### Expected Results:
- ✓ Grid switches to 3 columns at 768px viewport width
- ✓ Video cards maintain aspect ratio (9:16)
- ✓ Proper spacing maintained

## Test 4: Failed Video Display

### Setup:
Add a failed raw video to test data:

```javascript
const failedVideo = {
  id: '550e8400-e29b-41d4-a716-446655440004',
  projectId: 'YOUR_PROJECT_ID',
  type: 'raw',
  scriptId: null,
  localUri: 'file:///failed.mp4',
  durationSec: 30,
  sizeBytes: 512000,
  createdAt: new Date().toISOString(),
  exportedAt: null,
  status: 'failed',
};
```

### Steps:
1. Add failed video to AsyncStorage
2. Navigate to project

### Expected Results:
- ✓ Failed raw video appears in grid
- ✓ "FAILED" badge displayed in top-left corner
- ✓ Badge: red background (#FF3B30), white text
- ✓ Duration badge still visible in bottom-right

## Test 5: Pull-to-Refresh

### Steps:
1. Navigate to project with videos
2. Pull down on the video list
3. Release

### Expected Results:
- ✓ Refresh spinner appears
- ✓ Data reloads (currently no visual change, stub for future)
- ✓ Spinner disappears after load completes

## Test 6: Invalid Project ID Error

### Setup:
Manually navigate to invalid projectId using deep link OR modify navigation:

```javascript
navigation.navigate('ProjectDashboard', {
  projectId: 'INVALID_ID_12345'
});
```

### Steps:
1. Navigate to ProjectDashboard with invalid/non-existent projectId
2. Wait 3 seconds

### Expected Results:
- ✓ Red error banner appears immediately
- ✓ Banner text: "Project not found"
- ✓ Subtext: "Redirecting to Projects List..."
- ✓ After 3 seconds, auto-redirect to Projects List
- ✓ No crash or blank screen

## Test 7: Deep Linking - Custom URL Scheme

### iOS (Simulator):
```bash
xcrun simctl openurl booted "shortyai://project/YOUR_PROJECT_ID"
```

### Android (Emulator):
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "shortyai://project/YOUR_PROJECT_ID" \
  host.exp.exponent
```

### Expected Results:
- ✓ App opens/comes to foreground
- ✓ Navigates to ProjectDashboard screen
- ✓ Correct project loaded based on projectId in URL
- ✓ Invalid projectId shows error banner

## Test 8: Deep Linking - Universal/App Links

### Note:
Universal/App Links require domain verification files deployed. For testing in development:

### iOS (Simulator):
```bash
xcrun simctl openurl booted "https://shortyai.app/project/YOUR_PROJECT_ID"
```

### Android (Emulator):
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://shortyai.app/project/YOUR_PROJECT_ID" \
  host.exp.exponent
```

### Expected Results:
- ✓ App opens (if installed)
- ✓ Navigates to ProjectDashboard
- ✓ Correct project loaded

### Production Domain Setup (Future):
- iOS: `.well-known/apple-app-site-association` on shortyai.app
- Android: `.well-known/assetlinks.json` on shortyai.app

## Test 9: Deep Linking - React Navigation (Development)

### Steps:
1. Start Expo dev server: `npm start`
2. Open URL in browser:
   ```
   exp://localhost:8081?url=shortyai://project/YOUR_PROJECT_ID
   ```
3. Scan QR code in Expo Go

### Expected Results:
- ✓ App opens with deep link params
- ✓ ProjectDashboard loads with correct projectId

## Test 10: Navigation Consistency

### Steps:
1. Navigate: Projects List → Project Dashboard → Back button
2. Navigate: Projects List → Project 1 → Projects List → Project 2
3. Use deep link to open Project 1, then navigate normally

### Expected Results:
- ✓ Back button returns to Projects List
- ✓ Switching between projects updates state correctly
- ✓ Deep link integration doesn't break normal navigation
- ✓ No state leakage between projects

## Known Limitations (MVP)
- Video thumbnails: Placeholder play icon (real thumbnails in future ticket)
- Pull-to-refresh: Stub implementation (data refresh in future ticket)
- Universal/App Links: Require production domain setup
- Create button: Stub (will navigate to Create Flow in future ticket)

## Troubleshooting

### Deep Links Not Working
1. Verify URL scheme in app.json: `"scheme": "shortyai"`
2. Rebuild app after app.json changes
3. Check device logs for navigation errors
4. Test with simple scheme first: `shortyai://`

### Grid Layout Issues
1. Check device width with: `Dimensions.get('window').width`
2. Verify FlatList numColumns prop
3. Test screen rotation (should maintain responsive columns)

### AsyncStorage Not Persisting
1. Clear app data and reinstall
2. Verify storage initialization ran
3. Check for errors in console during storage operations

## Automation Notes (Future)
- Detox tests for navigation flows
- Jest snapshots for component rendering
- Deep link integration tests with mocked Linking API
- Visual regression tests for grid layouts

## Sign-off Checklist
- [ ] Empty state displays correctly
- [ ] Video grid: 2 columns mobile, 3 columns tablet
- [ ] Duration badges: bottom-right, 60% opacity
- [ ] Failed videos show FAILED badge
- [ ] Pull-to-refresh works
- [ ] Invalid projectId shows error banner + redirects
- [ ] Deep links work: `shortyai://project/:id`
- [ ] Navigation back button works
- [ ] No console errors or warnings
- [ ] Performance acceptable (< 300ms screen transitions)
