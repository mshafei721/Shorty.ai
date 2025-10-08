1. Title and Summary
Shorty.ai MVP PRD — Expo Go short-form video creator for niche-focused solo creators and micro-teams. The MVP enables users to onboard by selecting a niche, create multiple projects, script and record videos with a teleprompter, apply automated edits via external APIs, preview results, and export locally stored clips via native share sheets. Problem: creators in specialized niches need a fast, mobile-first tool to script, record, and polish short videos without desktop editing; Shorty.ai provides a guided pipeline that automates heavy edits while keeping assets local and privacy-friendly.

2. Goals & Non-Goals
Launch an Expo Go–compatible MVP that lets users create and export polished short videos in under 10 minutes end-to-end.
Achieve ≥70% completion rate from recording start to processed preview across test users.
Validate demand across ≥3 initial niches (Healthcare, Finance, Fitness).
Non-goals:

Cloud backup, cross-device sync, or user accounts.
Social feed, in-app comments, or collaboration.
Custom native modules, on-device heavy video processing, manual timeline editing.
Advanced analytics backend or CRM integrations.
Advanced background music customization (user-uploaded tracks, multi-track mixing).
3. Personas & Use Cases
Dr. Riley Chen — Solo Healthcare Educator: Posts physiotherapy tips; needs quick script guidance and auto subtitles, values privacy (patient-friendly). Features: onboarding niche selection, teleprompter, auto subtitles, filler-word removal.
Maya Ortiz — Small Business Finance Marketer: Produces banking micro-campaigns; needs multiple projects per sub-brand, branded backgrounds, reliable export to TikTok/Instagram. Features: project dashboard, background change, intro/outro, share sheet export.
Other supporting use cases: Teachers creating lesson snippets, fitness coaches capturing workouts, real-estate agents showcasing properties.
4. User Stories & Acceptance Criteria
Story: Onboarding — Niche Selection
Given I launch the app for the first time
When I reach onboarding
Then I must select a niche and sub-niche from provided lists before proceeding
Given I select “Healthcare” and “Physiotherapy”
When I confirm
Then the selection saves locally and I see a success toast
Story: Project Creation
Given I am on the Projects List
When I tap “Create Project”
Then I must set Project Name, choose niche/sub-niche, and confirm
Given required fields are filled
When I tap Save
Then a new project appears at top with created timestamp
Story: Project Dashboard Empty State
Given I open a project with no videos
When the dashboard loads
Then I see copy “No videos yet. Tap + to create your first video.” and a centered + button
Story: Project Dashboard Overview
Given I have recorded videos and AI script drafts in a project
When the dashboard loads
Then I see Active Videos with status chips, AI Script Drafts with last edited times, contextual recommendations, and Quick Actions without needing to refresh
Given the dashboard fails to load data
When I tap Retry
Then the panels attempt to reload and show offline messaging if the device is disconnected
Story: AI Script Revisions
Given I generate an AI script
When I request a shorter version
Then the system saves a new revision, keeps the previous version in history, and marks the latest as teleprompter-ready when I send it
Story: Teleprompter Rehearsal & Multi-Take
Given I open the teleprompter
When I select Rehearse
Then the script scrolls without recording and shows estimated duration
Given I record multiple takes
When recording stops
Then I can label, favorite, or discard each take before selecting one to continue
Story: Script Generation
Given I tap + in a project
When I reach Script screen
Then I can choose "Generate with AI" or "Paste script"
Given I tap "Paste script"
When I paste text into the text box
Then I can continue with my pasted script
Given I tap Generate with AI
When I am prompted for script details
Then I must provide a topic (required), a short description (optional), and confirm
Given I submit topic and description
When the AI researches and generates the script
Then AI returns a script ≤ 250 words or shows error if external API fails
Given I paste a script > 500 words
When I attempt to continue
Then I see validation requesting trimming to 500-word max
Story: Recording with Teleprompter
Given I proceed to Record
When I grant camera and microphone permissions
Then the teleprompter overlay appears at 55% opacity with adjustable WPM slider
Given the teleprompter is scrolling
When I tap Pause
Then scrolling stops and resumes on Resume without losing position
Story: Feature Selection
Given I complete a recording
When I reach Feature Selection
Then I can toggle subtitles, background change, background music, intro/outro, filler-word removal individually
Given I enable filler-word removal
When I confirm
Then I see messaging “Automatic filler words trimmed; jump cuts may occur.”
Story: Processing Wait-State
Given I submit selected features
When processing starts
Then I see a status screen with progress (Queued/Processing) and Cancel option until completion
Given I lose network
When the app detects failure to reach API
Then I see “Reconnecting…” banner, retry automatically every 2s, and allow manual retry
Story: Preview
Given processing completes
When I open Preview
Then I can play the processed video with basic controls (play/pause, timeline scrub, restart)
Given processing returns error
When I open Preview
Then I see error message with Retry Processing option
Story: Export
Given I am satisfied with Preview
When I tap Export
Then the native iOS/Android share sheet opens with installed social apps
Given share sheet cannot open
When the system returns an error
Then I see “Sharing unavailable. Video saved locally.” with path reference
5. Functional Requirements
Onboarding: Present niche and sub-niche pickers (dropdown or searchable list) sourced from constants; require selection; persist to AsyncStorage under userProfile along with sub-niche default prompts, recommended template packs, and feature presets that auto-populate new projects; allow revisiting selection from Settings and emit completion analytics event.
Projects: Support unlimited projects until device storage warning; default sort by updatedAt desc; allow edit/delete (soft delete by flag, actual deletion removes local videos).
Project Dashboard: Dedicated hub per project showing Active Videos (raw/processing/processed with status chips and retry/cancel actions), AI Script Drafts (latest five with last-edited timestamp and quick open), contextual recommendations driven by niche/sub-niche (e.g., trending hooks), and Quick Actions (Generate Script, Open Teleprompter, Start Recording, Review Processed Clips) with well-defined empty, loading, and error states and offline caching.
Script Screen: Character count display; two modes: "Paste script" (text box for manual entry) or "Generate with AI" (prompt presets such as Hook/Educate/CTA, tone slider Casual↔Expert, length select 30/60/90s, topic [required], description [optional]); supports revision loops (regenerate section, shorten/lengthen) with version history (max five drafts per project), moderation fallback, and one-tap "Send to Teleprompter" that marks the chosen draft as teleprompter-ready while retaining editable copies.
Recording: Use Expo Camera; enforce portrait 9:16, 1080x1920, max duration 120s (stop automatically); show storage-used indicator; warn if free space < 500 MB before recording.
Teleprompter: Overlay 50–60% opacity default 0.55; adjustable WPM 80–200; font size small/medium/large; highlight current line; includes rehearsal mode (scroll without recording), script import confirmation highlighting AI changes, multi-take management (label, favorite, discard), storage/WPM guardrails before recording, and fallback to static script if overlay fails.
Feature Selection: Toggles for subtitles, background change, background music (preset picker + volume slider), intro/outro templates, filler-word removal, and optional B-roll suggestions; defaults: subtitles on, filler removal on (with confirmation tooltip), music off until configured; background change requires preset or blur selection.
Processing Pipeline: Upload raw MP4 to external storage endpoint; create job with selected features (subtitles, filler-word removal, intelligent jump cuts, dynamic captions with brand colors, optional intro/outro templates, background music layering, future B-roll slots); orchestrator must map each feature to vendor APIs (AssemblyAI transcript + timestamps, Shotstack composition templates, music/B-roll providers) with retries/backoff, emit progress updates (Queued/Uploading/Processing), support cancellation cleanup, enforce 20-minute timeout, and return configuration metadata the frontend uses to display applied edits.
Local Storage: Raw video saved to FileSystem.documentDirectory/videos/raw/<projectId>/<timestamp>.mp4; processed to .../processed/. Metadata stored in AsyncStorage keys projects, videos, scripts, dashboardState (cached panels), userProfile (niche/sub-niche presets), and featurePresets.
Preview: Play via Expo AV; display feature summary; allow re-open Feature Selection to rerun processing.
Export: Use Expo Sharing/Share API; ensure file exists before call; after export, mark video exportedAt.
Error Handling: Permissions denied: show modal with instructions and “Open Settings” deep link; No storage: block new recording until space freed; Network offline during processing: show offline banner, queue retry; Cancelled job: revert to Feature Selection; Failed job: display reason, allow retry or download raw.
Analytics Storage: Track counters locally (AsyncStorage) per project; optional telemetry toggle in Settings (default off).
6. Non-Functional Requirements
Warm start < 2s on tested devices (iPhone 12, Pixel 5); cold start < 4s.
UI interactions respond within 100 ms; screen transitions < 300 ms.
Processing status polling interval fixed at 2000 ms; abort if >20 min.
App must handle offline mode gracefully: allow viewing existing local videos, postpone uploads until online.
Reliability: processing success rate ≥ 90% in testing; retries limited to 3 attempts per job.
Privacy/Security: Store all files locally; do not transmit personal data; require explicit camera/mic consent; purge cancelled raw video if user chooses discard.
Battery/Performance: Recording must maintain device temperature safe; warn users if backgrounding during upload pauses job.
7. Platform & Constraints (Expo Go)
Expo SDK version 50 (managed workflow).
Allowed modules: expo-camera, expo-av, expo-file-system, expo-sharing, expo-sharing/Share, expo-media-library (read/export), expo-permissions, expo-haptics, expo-clipboard, expo-constants, expo-network.
State management: React Context or Redux Toolkit (JS only).
No custom native plugins; no heavy editing on-device; all advanced edits via external APIs.
Networking via fetch/axios allowed; no websockets required.
Background tasks limited; processing status polling must run while app active; handle app background by persisting state and resuming on foreground.
8. Information Architecture & Navigation
Onboarding Stack: Splash → Niche Selection → Sub-niche Confirmation.
Main Tab/Stack:
Projects List (default home).
Project Dashboard (per project).
Create Flow modal stack: Script → Record → Feature Selection → Processing Status → Preview → Export.
Settings (optional single screen): Telemetry toggle, storage info, app version, support link.
Deep link: shortyai://project/{id} opens dashboard.
Back navigation always returns to previous step; processing screen prevents accidental exit with confirm dialog.
9. Data Model
Project: { id: string(uuid), name: string, niche: string, subNiche: string, createdAt: ISO8601, updatedAt: ISO8601, isDeleted: boolean } stored in AsyncStorage projects.
Script: { id: string(uuid), projectId: string, text: string, wordsCount: number, wpmTarget: number, createdAt: ISO8601, source: 'ai'|'manual', tone: 'casual'|'expert', lengthTargetSec: number, revision: number, parentId: string|null, isTeleprompterReady: boolean } stored in AsyncStorage scripts.
VideoAsset: { id: string(uuid), projectId: string, type: 'raw'|'processed', scriptId: string|null, localUri: string, durationSec: number, sizeBytes: number, createdAt: ISO8601, exportedAt: ISO8601|null, status: 'ready'|'processing'|'failed'|'cancelled' } stored in AsyncStorage videos.
FeatureSelections: { videoId: string, subtitles: boolean, backgroundChange: { enabled: boolean, presetId: string|null }, backgroundMusic: { enabled: boolean, trackId: string|null, volume: number }, introOutro: { enabled: boolean, templateId: string|null }, fillerWordRemoval: boolean, broll: { enabled: boolean, libraryId: string|null }, jumpCuts: { enabled: boolean, aggressiveness: 'low'|'medium'|'high' } }.
ProcessingJob: { id: string(uuid), videoId: string, status: 'idle'|'uploading'|'queued'|'processing'|'complete'|'failed'|'cancelled', progress: number(0-100), requestedFeatures: FeatureSelections, appliedFeatures: FeatureSelections|null, configuration: { captionsTheme: string, musicTrackId: string|null, introTemplateId: string|null, outroTemplateId: string|null }|null, startedAt: ISO8601, completedAt: ISO8601|null, error: { code: string, message: string }|null, retries: number }.
File naming: raw raw_<projectId>_<timestamp>.mp4; processed processed_<videoId>_<timestamp>.mp4; temp uploads stored /temp/<videoId>.mp4 and deleted post-success.
All metadata persisted via AsyncStorage; consider migration version appStateVersion for schema updates.
10. Teleprompter Spec
Overlay panel occupying lower 60% of screen; opacity default 0.55 (range 0.5–0.6 via slider).
Font size presets: Small (14pt), Medium (18pt default), Large (22pt); responsive to system font scaling.
Adjustable scroll speed via WPM slider (80–200, default 140). Real-time preview of estimated duration.
Controls: Play/Pause button, Restart, Speed slider, Font size toggle, Lock screen orientation toggle.
Highlight current sentence with subtle color #FFFFFF at 80% brightness; upcoming text 50% brightness; past text 30%.
Start countdown 3-2-1 overlay before recording; teleprompter sync begins at record start.
Timing: auto-scroll based on WPM; allow manual swipe to adjust position (locks after release).
Pause behavior: overlay dims to 40% opacity; resume resets to exact position.
Safety: if script empty, teleprompter hidden and display message “Add script to enable teleprompter.”
Rehearsal Mode: enable scroll preview without recording and surface estimated duration before entering capture state.
Multi-take Management: after each take, prompt to label/favorite/discard; maintain ordered list until user selects final take for processing.
AI Script Import: when a teleprompter-ready draft is received, show diff highlighting changes since last version and request confirmation before replacing live script.
Guardrails: warn when estimated duration exceeds 120s given current WPM and script length, and block recording when available storage <500 MB until cleared.
11. Create Flow Spec
Sequence: Tap + → Script screen (choose "Paste script" or "Generate with AI") → If paste: enter text; if AI: configure preset, tone, length, topic, description → AI generates draft with option to revise/shorten/extend and review version history → Send selected draft to teleprompter → Optional rehearsal mode → Permissions prompts → Record (countdown, teleprompter) with ability to pause/resume and capture multiple takes → Select preferred take → Feature Selection toggles → Confirm → Processing status → Preview → Export.
Validations: require script text ≥ 20 words before record (unless user overrides with confirmation). Warn if script length implies >120s (calc by words/WPM).
Recording Settings: portrait only, 9:16 at 30fps, audio 44.1 kHz mono AAC; allow retake (discard old raw after confirmation). Provide stabilization toggle default on.
Feature Selection UX: toggles with sub-settings (music track picker from curated list, background presets). Display estimated processing time per feature (subtitles +1 min, background change +2 min).
Filler-word removal: API receives transcript; remove common fillers (“um”, “uh”, “like”) while preserving 0.3s handles; show tooltip about potential jump cuts; allow user to view list of removed segments after processing.
Messaging: On submit, show toast “Your video is being polished. This may take up to 3 min.”; display queue status.
12. Processing Spec (External APIs)
Upload Raw Video

POST /uploads
Request headers: Content-Type: multipart/form-data, Authorization: Bearer <token>
Body (multipart):
file: binary (.mp4)
metadata: {
  "videoId": "uuid",
  "projectId": "uuid",
  "durationSec": 95
}
Response 201: { "uploadId": "uuid", "expiresInSec": 3600 }
Errors: 413 file too large (>500MB), 415 unsupported format, 500 server error (retry with backoff).
Create Processing Job

POST /jobs
Request JSON:
{
  "videoId": "uuid",
  "uploadId": "uuid",
  "features": {
    "subtitles": true,
    "backgroundChange": { "enabled": true, "presetId": "city_blur" },
    "backgroundMusic": { "enabled": true, "trackId": "uplift_01", "volume": 0.4 },
    "introOutro": { "enabled": false },
    "fillerWordRemoval": true
  },
  "scriptText": "string",
  "teleprompterWpm": 140
}
Response 202: { "jobId": "uuid", "estimatedSeconds": 180 }
Handle errors: 400 invalid feature combo, 429 rate limit (retry after header), 503 service unavailable (retry after 5s exponential).
Pipeline Steps:
- AssemblyAI transcription (or Deepgram fallback) returns timestamps used for subtitles and filler-word trimming list; orchestrator must produce caption file in brand colors supplied by frontend config.
- Jump-cut generator removes filler segments while keeping ±0.3s padding to soften cuts; generate preview of removed ranges for frontend display.
- Shotstack (or equivalent) composition template combines edited timeline with intro/outro templates, dynamic captions, optional background change, and slots for B-roll overlays.
- Music service selects preset track and applies volume mixing (default 0.4) beneath voice audio; store mixing metadata so frontend preview slider remains in sync.
- Orchestrator persisting configuration: write final feature application summary (captions, cuts, music track ID, templates used) into job payload returned to client.
Poll Job Status

GET /jobs/{jobId}
Response 200:
{
  "jobId": "uuid",
  "status": "processing",
  "progress": 65,
  "downloadUrl": null,
  "error": null
}
Final statuses: complete, failed, cancelled; include downloadUrl on complete.
Client polls every 2000 ms, max 600 attempts (20 min). On failed, surface error.code, error.message.
Download Processed Video

GET /downloads/{jobId}
Requires downloadUrl (signed). Save to local processed path.
Verify checksum header (e.g., X-File-Checksum) for integrity; retry download up to 2 times on failure.
Cancel Job

POST /jobs/{jobId}/cancel
Response 200: { "status": "cancelled" }
Timeouts: network request timeout 30s; if timed out, queue retry with exponential backoff (2s, 4s, 8s) up to 3 attempts.

Provider Agnostic: API schema must allow swapping providers (transcription, segmentation, video rendering). Maintain adapter layer in client to map UI selections to provider parameters.

13. Export & Share
Output format: MP4 H.264, AAC audio, resolution ≥1080x1920, bitrate 8–12 Mbps video, 128 kbps audio.
Use Sharing.shareAsync(processedUri, { dialogTitle: "Share your video" }); allow share targets (TikTok, Instagram, WhatsApp, Files).
After successful share, show toast “Video shared. Saved to Projects > [Project Name].”
Fallback: if share fails or not supported, copy file to media library (with consent) and display path instructions; log failure for analytics.
Keep processed video local regardless of sharing outcome; allow manual export later from Preview.
14. State Machines
Recording State Machine
| State | Event | Next State | Notes |
| Idle | Tap Record | Countdown | Initialize camera |
| Countdown | Countdown complete | Recording | Teleprompter starts |
| Recording | Tap Pause | Paused | Video continues paused |
| Recording | Auto-stop at 120s | Reviewing | Present raw preview |
| Recording | Tap Stop | Reviewing | Save raw |
| Paused | Tap Resume | Recording | Resume teleprompter |
| Paused | Tap Cancel | Idle | Discard raw (prompt) |
| Reviewing | Accept | ReadyForFeatures | Move to Feature Selection |
| Reviewing | Retake | Countdown | Overwrite raw |
| Any | Error | ErrorState | Surface message and retry |

Teleprompter State Machine
| State | Event | Next State | Notes |
| Hidden | Script available | VisiblePaused | Overlay ready |
| VisiblePaused | Tap Start | Scrolling | Begin at top |
| Scrolling | Tap Pause | VisiblePaused | Maintain position |
| Scrolling | Reaches end | Completed | Offer restart |
| Completed | Tap Restart | Scrolling | Reset to top |
| VisiblePaused | Script updated | VisiblePaused | Recalculate scroll |
| Any | Recording stopped | VisiblePaused | Await next record |
| Any | Overlay error | Hidden | Show fallback text |

Processing Job State Machine
| State | Event | Next State | Notes |
| Idle | Submit features | Uploading | Begin upload |
| Uploading | Upload success | Queued | Await processing |
| Uploading | Upload failure | Failed | Offer retry |
| Queued | Job starts | Processing | Show progress |
| Processing | Progress update | Processing | Update %
| Processing | Success | Complete | Download result |
| Processing | Failure | Failed | Show error |
| Queued/Processing | Cancel request | Cancelled | Clean up |
| Any | Timeout 20 min | Failed | Mark with timeout code |

15. Empty States, Errors, and Edge Cases
Project Dashboard Empty: Illustration + “Create your first video by tapping +”.
Permissions Denied: Full-screen modal with icon, copy “Camera and microphone access are required. Enable in Settings.”, buttons Cancel and Open Settings.
Storage Low (<500 MB free): Banner “Storage low. Free up space before recording.” with Manage Storage button.
Offline Banner: At top “You’re offline. We’ll resume uploads once you’re back.”, show spinner during retry.
Processing Failed: Card with error message, Retry processing and Keep raw video.
Processing Cancelled: Toast “Processing cancelled. You can edit feature selections and try again.”
Partial Download: Detect checksum mismatch -> alert “Download incomplete. Retrying…”; after 3 failures, show error with manual retry button.
Export Unavailable: Modal “Sharing unavailable on this device. Video saved locally under Project.”.
16. Analytics & Metrics
KPIs: avg videos created per project, processing success rate, time-to-first-export, opt-in rate per feature, export success rate, cancellation rate.
Instrumentation stored locally in AsyncStorage analytics, rotated after 30 days or manual clear.
Telemetry toggle in Settings (default off). When on, batch send anonymized metrics to endpoint (if provided) without user identifiers.
Track funnel events: script_completed, record_started, record_completed, processing_started, processing_completed, export_initiated, export_success, export_failed.
17. Accessibility & Localization
Support system font scaling up to 200%; ensure teleprompter UI adjusts without clipping.
Maintain color contrast ≥ 4.5:1 for text/background, including overlays.
Provide captions/subtitles toggle in preview even if subtitles disabled during processing (show note).
VoiceOver/ TalkBack labels for all buttons; focus order logical.
Initial locale English (en-US). Structure strings in i18n files to support future locales; avoid hard-coded text.
Teleprompter controls accessible via large tap targets (44x44pt minimum).
18. Dependencies & Risks
External APIs: transcription/AI script generator, video editing/rendering, background segmentation, music catalog. Mitigation: choose providers with REST endpoints and SLA ≥ 99%.
Expo SDK updates: Pin to Expo SDK 50; monitor for compatibility with Camera/AV.
Device storage constraints: Provide storage management guidance; consider compressing processed videos within provider constraints.
API latency risk: Provide progress UI and notifications; set expectations with estimated times.
Network reliability: Implement retry/backoff; allow resume after reconnect.
Legal/licensing: Ensure background music tracks have usage rights.
19. Release Plan
MVP Scope: Features defined in Sections 5–15; iOS and Android builds via Expo; tests on iPhone 12/14, Pixel 5/7.
Manual Test Plan: Smoke tests for onboarding, project CRUD, script generation, recording, teleprompter controls, each feature toggle, processing success/failure, offline mode, export.
Staged Rollout: Internal alpha (TestFlight/Expo internal) → Closed beta (20 creators across niches) → Public release in stores after ≥90% processing success and <5% crash rate.
MVP Done Checklist: All acceptance criteria met, no P0/P1 bugs, processing success ≥90%, export works on iOS/Android, analytics capturing KPIs, documentation for support.
20. Appendices
Glossary
MVP: Minimum viable product.
Processing Job: Server-side operation applying selected features.
Filler-word Removal: Automatic trimming of disfluencies (um, uh).
Teleprompter WPM: Words per minute used to pace scroll.
Assumptions
Users have sufficient device storage for short videos (<500MB each).
External APIs return results within 10 minutes average.
Users operate primarily in portrait mode for vertical platforms.
Open Questions
Which AI provider for script generation meets privacy requirements?
Should intro/outro templates allow custom branding assets in MVP or default library only?
Need offline queue for script generation requests?


Future Roadmap
Cloud backup and cross-device sync.
Templates and brand kits.
Collaboration and multi-user roles.
Analytics backend with trends and insights.
Account system with personalization.
In-app performance tips and auto-thumbnail generation.

---
### 2025-10-08 Review Notes (Codex)
- [Done] Integrated into core PRD sections on 2025-10-08; keep the checklist below for historical traceability.
- Add a dedicated Project Dashboard section detailing required data panels (active videos, AI script drafts, quick actions) and empty/loading/error states so the feature can be scoped and built.
- Extend onboarding requirements to cover sub-niche-specific defaults (script prompts, template suggestions) and ensure persistence flows into new projects.
- Flesh out the AI scripting experience: specify prompt presets, revision loops, tone/length controls, and the handoff into the teleprompter without copy/paste.
- Expand the teleprompter spec to include script import from the AI workspace, rehearsal/re-take loops, and UX for multi-take management before committing a recording.
- Document the end-to-end AI video editing pipeline (auto cuts, B-roll overlays, hook/outro templating) and map each feature to vendor APIs so backend work can start.
- Resolve the scope conflict with  where background music is marked as a non-goal while this PRD treats it as a core toggle.
- Mirror this clarification in  by moving background music out of the non-goals list or flagging it as Phase 1 scope.
- Ensure this scope decision is also reflected in plan.md by moving background music out of the non-goals list or clearly labeling it Phase 1.
- Correction: the previous "Mirror this clarification" bullet should explicitly call out plan.md; both documents must align on background music scope and timing.

---
### 2025-10-08 Scope Update Details (Codex)
**Project Dashboard Hub**
- Dedicated dashboard screen per project showing Active Videos (raw/processing/processed status chips), AI Script Drafts (latest 5 drafts with last-edited timestamp), and Quick Actions (Generate Script, Open Teleprompter, Start Recording, Review Processed Clips).
- Include empty, loading, and error states for each panel with retry actions; surfaced metrics should persist through AsyncStorage to support offline mode.
- Dashboard must display contextual recommendations driven by niche/sub-niche selections (e.g., “Trending hook for Fitness → HIIT”).

**Sub-Niche Onboarding Enhancements**
- Expand onboarding data model to capture sub-niche default prompts, template packs, and recommended feature presets.
- Persist selections into new project creation so first project inherits niche + sub-niche without re-entry; allow editing from Settings.
- Add onboarding success criteria: completion analytics event, ability to revisit and modify selection.

**AI Scripting Studio**
- Provide prompt presets (Hook, Educate, CTA), tone sliders (Casual/Expert), and length selector (30/60/90s) before hitting the vendor API.
- Support revision loops: regenerate sections, request shorter/longer edits, and version history capped at 5 drafts per project.
- One-tap “Send to Teleprompter” flow that stores the chosen script and marks it as “teleprompter-ready” for the recording session.

**Teleprompter Production Flow**
- Integrate rehearsal mode (scroll without recording) and multi-take management (label, favorite, discard takes before feature selection).
- Provide script import confirmation when receiving AI drafts; highlight edits relative to previous revision.
- Add safety checks: warn when WPM mismatch implies >120s recording or when storage <500MB before starting a take.

**AI Video Editing Pipeline**
- Document automated editing capabilities: intelligent jump cuts, dynamic captions (brand colors), B-roll slot suggestions, intro/outro templates, and music bed layering.
- Map each feature to target vendor touchpoints (AssemblyAI transcript, Shotstack templates, future B-roll provider) and outline fallback behavior when APIs fail.
- Define configuration schema returned to the frontend so Feature Selection toggles align with actual backend controls.

**Background Music Scope Alignment**
- Restate that background music is part of the core editing pipeline; if deferred, label explicitly as Phase 1 in both PRD and plan.md and remove it from MVP acceptance criteria.
- Capture acceptance test: user toggles music on, selects preset, adjusts volume, and preview honors the setting.
