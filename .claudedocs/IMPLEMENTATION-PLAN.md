# Shorty.ai MVP Implementation Plan

**Status:** UI Shell Complete | Core Features Missing
**Goal:** Production-ready MVP with AI scripting + teleprompter recording

---

## Audit Summary

### Existing Implementation
**✅ Screens (UI Shell Only):**
- SplashScreen.tsx - Onboarding splash
- NicheSelectionScreen.tsx - Onboarding niche picker
- ProjectsListScreen.tsx - Projects list with create button
- ProjectDashboardScreen.tsx - Project overview (placeholder actions)
- RecordScreen.tsx - Camera permissions + placeholder recording
- SettingsScreen.tsx - App settings
- FeaturesScreen.tsx (M3) - Feature selection UI
- PreviewScreen.tsx (M3) - Video preview UI
- ScriptStudioScreen.tsx - AI script generation UI (exists but not routed!)

**✅ Components:**
- CameraPreview.tsx - Camera component wrapper
- TeleprompterOverlay.tsx - Teleprompter UI component
- StorageBanner.tsx - Storage warning banner
- PermissionModal/PermissionBanner - Permission handling

**✅ Services:**
- src/features/scripting/service.ts - AI script generation service (OpenAI integration)
- useRecording hook - Recording FSM (state machine)
- storageGuards.ts - Storage checking utilities
- permissions.ts - Camera/mic permission handling

**❌ Missing Critical Flows:**
1. **Create Project Screen** - No UI to create new projects
2. **Script Generator Integration** - ScriptStudioScreen exists but not in navigation
3. **Script → Record Flow** - No connection between script and recording
4. **Recording → Features Flow** - No navigation after recording completes
5. **OpenAI API Key Configuration** - No .env setup or key management
6. **Video Processing Pipeline** - Backend API integration incomplete
7. **Export Flow** - No sharing implementation

**❌ UX Issues:**
- Emojis used instead of proper icons (RootNavigator lines 100, 110)
- ProjectDashboardScreen uses emoji icons (lines 188, 193, 198)
- No Create Project button/screen implemented
- No way to start script generation from dashboard

---

## Implementation Plan

### **Phase 1: Core User Flow (Priority: CRITICAL)**

#### 1.1 Create Project Screen
**File:** `src/screens/CreateProjectScreen.tsx`
**Features:**
- Project name input (required)
- Niche/sub-niche selection (inherit from profile or custom)
- Form validation (name required, 2-100 chars)
- Save to AsyncStorage `projects` array
- Navigate to ProjectDashboard with new projectId

#### 1.2 Integrate Script Studio
**File:** `src/navigation/RootNavigator.tsx`
**Changes:**
- Add `ScriptStudio` route with projectId param
- Update RootStackParamList type
- Add screen to navigator stack

**File:** `src/screens/ProjectDashboardScreen.tsx`
**Changes:**
- Fix `handleGenerateScript()` - navigate to ScriptStudio
- Pass projectId, niche, subNiche as route params

#### 1.3 OpenAI Configuration
**File:** `.env` (create if missing)
```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o
```

**File:** `src/features/scripting/service.ts`
**Verify:**
- Uses `process.env.EXPO_PUBLIC_OPENAI_API_KEY`
- Proper error handling for missing key
- Rate limiting/retry logic

#### 1.4 Script → Teleprompter Flow
**File:** `src/features/scripting/screens/ScriptStudioScreen.tsx`
**Changes:**
- `onSendToTeleprompter()` callback implementation
- Save script to AsyncStorage `scripts` array
- Navigate to RecordScreen with scriptId param

**File:** `src/screens/RecordScreen.tsx`
**Changes:**
- Accept scriptId route param
- Load script text from AsyncStorage
- Pass to TeleprompterOverlay component
- Display script metadata (word count, estimated duration)

#### 1.5 Recording → Save Flow
**File:** `src/screens/RecordScreen.tsx`
**Changes:**
- Save recorded video to FileSystem.documentDirectory/videos/raw/
- Create VideoAsset entry in AsyncStorage `videos` array
- Link videoId to scriptId and projectId
- Navigate to Features screen with videoId

---

### **Phase 2: Icon Replacement (Priority: HIGH)**

#### 2.1 Install Vector Icons
**File:** `package.json`
```bash
npm install @expo/vector-icons
```

#### 2.2 Replace Tab Bar Icons
**File:** `src/navigation/RootNavigator.tsx`
**Replace:**
```tsx
// BEFORE (lines 99-101)
tabBarIcon: ({ color, size }) => (
  <Text style={{ fontSize: size, color }}>📁</Text>
)

// AFTER
import { Ionicons } from '@expo/vector-icons';
tabBarIcon: ({ color, size }) => (
  <Ionicons name="folder-outline" size={size} color={color} />
)
```

**Icon Mappings:**
- 📁 → `folder-outline` (Projects)
- ⚙️ → `settings-outline` (Settings)
- ✨ → `sparkles-outline` (AI Script)
- 🎥 → `videocam-outline` (Record)
- 📝 → `document-text-outline` (Script)

#### 2.3 Replace Dashboard Action Icons
**File:** `src/screens/ProjectDashboardScreen.tsx`
**Replace all emoji Text components with Ionicons:**
- New Project → `add-circle-outline`
- Generate Script → `sparkles-outline`
- Record Video → `videocam-outline`

---

### **Phase 3: Backend Integration (Priority: HIGH)**

#### 3.1 Video Processing Service
**File:** `src/services/videoProcessing.ts` (create)
**Features:**
- `uploadVideo(uri, projectId)` → POST /uploads
- `createProcessingJob(videoId, features)` → POST /jobs
- `pollJobStatus(jobId)` → GET /jobs/:id (2s intervals)
- `downloadProcessedVideo(jobId)` → GET /downloads/:id
- Exponential backoff retry logic
- Progress callbacks for UI updates

**File:** `.env`
```
EXPO_PUBLIC_VIDEO_API_URL=https://api.shortyai.app/v1
```

#### 3.2 Processing Status Screen
**File:** `src/features/m3/screens/ProcessingStatusScreen.tsx`
**Verify/Implement:**
- Real-time progress bar (0-100%)
- Status display: Uploading → Queued → Processing → Complete
- Cancel button (calls POST /jobs/:id/cancel)
- Error handling with retry option
- Navigate to Preview on completion

---

### **Phase 4: Export & Share (Priority: MEDIUM)**

#### 4.1 Export Service
**File:** `src/services/export.ts` (create)
**Features:**
```typescript
async function exportVideo(videoUri: string, projectName: string) {
  // Use Sharing.shareAsync() for native share sheet
  // Fallback to MediaLibrary.saveToLibraryAsync()
  // Update VideoAsset.exportedAt timestamp
}
```

#### 4.2 Preview Screen Integration
**File:** `src/features/m3/screens/PreviewScreen.tsx`
**Add:**
- Export button (calls exportVideo)
- Success toast on export
- Analytics tracking (if telemetry enabled)

---

### **Phase 5: Polish & Testing (Priority: MEDIUM)**

#### 5.1 Error Boundaries
- Wrap navigator in ErrorBoundary
- Graceful degradation for API failures
- Offline mode handling

#### 5.2 Loading States
- Skeleton screens for async data
- Optimistic UI updates (create project, save script)
- Pull-to-refresh on all list screens

#### 5.3 Empty States
- Projects list: "Create your first project"
- Dashboard: "No videos yet. Tap + to record"
- Script studio: "Generate your first script"

#### 5.4 E2E Testing
**File:** `e2e/core-flow.spec.ts` (create)
**Test Cases:**
1. Onboarding → Create Project → Generate Script → Record → Export
2. AI script generation with various prompts
3. Recording with teleprompter scrolling
4. Feature selection and processing
5. Export to share sheet

---

## Implementation Order (3-Day Sprint)

### Day 1: Core Flow (8 hours)
1. ✅ Create CreateProjectScreen (2h)
2. ✅ Integrate ScriptStudio into navigation (1h)
3. ✅ OpenAI configuration + testing (2h)
4. ✅ Script → Record flow (2h)
5. ✅ Recording → Save VideoAsset (1h)

### Day 2: Icons + Backend (8 hours)
1. ✅ Install @expo/vector-icons (0.5h)
2. ✅ Replace all emojis with icons (2h)
3. ✅ Create videoProcessing service (3h)
4. ✅ Implement ProcessingStatusScreen (2h)
5. ✅ Test upload + polling (0.5h)

### Day 3: Export + Polish (8 hours)
1. ✅ Export service implementation (2h)
2. ✅ Preview screen integration (1h)
3. ✅ Error boundaries + loading states (2h)
4. ✅ Empty states for all screens (1h)
5. ✅ E2E test for core flow (2h)

---

## Critical Dependencies

**External APIs Required:**
1. OpenAI API (GPT-4o) - Script generation
2. Video Processing API - Subtitles/editing
   - POST /uploads (multipart/form-data)
   - POST /jobs (JSON with feature flags)
   - GET /jobs/:id (polling every 2s)
   - GET /downloads/:id (download processed video)

**Environment Variables:**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o
EXPO_PUBLIC_VIDEO_API_URL=https://api.shortyai.app/v1
```

**Permissions:**
- Camera (expo-camera)
- Microphone (expo-camera)
- Media Library (expo-media-library) - for export fallback

---

## Risk Mitigation

**Risk 1: OpenAI API Rate Limits**
- Solution: Implement exponential backoff, cache successful generations, show quota warnings

**Risk 2: Large Video Upload Failures**
- Solution: Chunk uploads (if API supports), show upload progress, allow resume on failure

**Risk 3: Processing Timeout (20min max)**
- Solution: Show estimated time, allow backgrounding app, send push notification on completion

**Risk 4: Expo Go Limitations**
- Solution: All features use Expo SDK 54 APIs only, no custom native modules

---

## Success Metrics

**MVP Launch Criteria:**
- ✅ User can create project from dashboard
- ✅ User can generate AI script with OpenAI
- ✅ User can record video with teleprompter overlay
- ✅ Teleprompter scrolls at configurable WPM (80-200)
- ✅ Video saves to local storage with metadata
- ✅ User can select features (subtitles, music, etc.)
- ✅ Processing job completes with real backend API
- ✅ User can preview processed video
- ✅ User can export via native share sheet
- ✅ All emojis replaced with proper icons
- ✅ Zero TypeScript errors
- ✅ E2E test passes for full flow
- ✅ App runs in Expo Go without crashes

**Performance Targets:**
- Cold start < 4s
- Script generation < 10s (depends on OpenAI API)
- Recording start < 2s after permissions granted
- Video processing < 5min for 60s video (depends on backend)
- Export < 3s (local file → share sheet)

---

## Next Steps

1. **Get OpenAI API Key** - User must provide in .env file
2. **Get Video Processing API Access** - Backend endpoint URLs + auth tokens
3. **Start Phase 1** - Implement CreateProjectScreen
4. **Test end-to-end** - Record actual video with teleprompter
5. **Replace emojis** - Install vector icons package
6. **Ship MVP** - Deploy to Expo Go for user testing
