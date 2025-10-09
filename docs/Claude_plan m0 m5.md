Balance Hardening Plan: M0-M5 Mock Elimination & Production Readiness
Executive Summary
Current State: The codebase has substantial frontend implementation for M0-M4, but ships with mocks in production via environment-gated factory pattern. The M2 processing pipeline backend does not exist—only MockM2Gateway is functional. Critical features (project dashboard, AI scripting, sub-niche onboarding) are missing. Critical Finding: src/features/m3/gateway/index.ts uses MockM2Gateway by default when EXPO_PUBLIC_M2_BASE_URL is unset. This violates the No-Mocks policy and blocks production readiness. Branch Discrepancy: Current branch is feature/balance-hardening-M0-M4. Will extend to M5 or create new branch per user preference.
Phase 1: Emergency Mock Elimination (P0 - BLOCKING)
1.1 Remove Production Mock Wiring
File: src/features/m3/gateway/index.ts
Action: Change factory to throw error when M2_BASE_URL missing instead of falling back to mock
Rationale: Force explicit configuration; prevent accidental mock usage in builds
1.2 Isolate Mocks for Tests Only
Create: src/features/m3/gateway/__mocks__/ directory
Move: MockM2Gateway.ts → __mocks__/MockM2Gateway.ts
Update: All test imports to use explicit mock path
Add: ESLint rule to block imports from __mocks__/ in non-test files
1.3 Harden CI Mock Detection
Update: .github/workflows/ci.yml enforce-no-mocks-policy job
Add checks for:
Direct MockM2Gateway imports outside __tests__/ or __mocks__/
process.env.* fallbacks to mock values in production code
Grep pattern: new Mock|import.*Mock(?!ito)|from '.*__mocks__' in src/** excluding tests
Add: scan:mocks npm script with exit code enforcement
Phase 2: Backend Processing Pipeline (P0 - CRITICAL)
2.1 Backend Service Scaffold (Epic D)
Deliverable: Node.js/Express service implementing M2Gateway REST contract Endpoints to implement:
GET /projects/:projectId/assets/:assetId/status → job status
GET /projects/:projectId/assets/:assetId/transcript → normalized transcript
GET /projects/:projectId/assets/:assetId/fillers → filler spans
POST /projects/:projectId/draft → request render
GET /drafts/:renderId/status → poll draft status
Provider integrations (per plan.md Epic D tickets):
D1: Upload adapter (resumable multipart to vendor storage)
D2: AssemblyAI transcription + Deepgram fallback
D3: Filler-word detection from transcript
D4: Shotstack composition (cuts + subtitles + intro/outro)
D5: Mux encoding (H.264, 1080x1920)
D6: Job orchestration FSM (upload → transcribe → compose → encode)
Minimal viable slice: Implement subtitles only end-to-end first (D1 → D2 → D4 → D5) to prove architecture.
2.2 Environment Configuration
Add: .env.example with M2_BASE_URL=http://localhost:3000
Document: Backend setup instructions in docs/BACKEND-SETUP.md
CI: Add environment validation step (fail if M2_BASE_URL not set in production builds)
Phase 3: Web Testing Infrastructure (CDP/MCP)
3.1 Package.json Scripts
"scripts": {
  "web:dev": "expo start --web",
  "web:debug": "expo start --web --https",
  "e2e:web": "playwright test",
  "e2e:web:ui": "playwright test --ui",
  "scan:mocks": "grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=__tests__ --exclude-dir=__mocks__ 'MockM2Gateway\\|from.*__mocks__' src/ && exit 1 || exit 0",
  "bundle:analyze": "npx expo export --platform web && npx source-map-explorer web-build/static/js/*.js"
}
3.2 Playwright E2E Tests
Create: e2e/ directory with CDP-enabled tests Test scenarios:
onboarding.spec.ts → niche selection flow
recording.spec.ts → script input + record stub (web constraints)
processing.spec.ts → feature selection + status monitoring
preview-export.spec.ts → playback + share intent
Configuration: playwright.config.ts with trace/video recording, baseURL for Expo web server
3.3 MCP Hooks for DevTools
Document: How to attach Chrome DevTools to Expo web instance
Add: web:debug script launches with --https for secure context (required for camera APIs)
Phase 4: Missing UI Features
4.1 Sub-Niche Onboarding (M0 Gap)
File: src/screens/NicheSelectionScreen.tsx
Add: Second picker for sub-niche after niche selection
Persist: Both to AsyncStorage.userProfile
Test: Verify sub-niche presets populate new project defaults
4.2 Project Dashboard Hub (M0 Gap)
Create: src/screens/ProjectDashboardScreen.tsx Panels:
Active Videos (status chips: raw/processing/processed)
AI Script Drafts (5 most recent)
Quick Actions (Generate Script, Start Recording, Review Clips)
Contextual Recommendations (niche-driven)
4.3 AI Scripting Studio (Missing Workstream I)
Create: src/features/scripting/ module Features:
Prompt presets (Hook/Educate/CTA)
Tone slider (Casual ↔ Expert)
Length selector (30/60/90s)
Revision history (max 5 drafts)
"Send to Teleprompter" action
Backend: Integrate OpenAI GPT-4o via new endpoint POST /scripts/generate
4.4 Storage Warnings (M1 Gap)
Create: src/utils/storageGuards.ts Checks:
Yellow warning at <2GB free
Red blocking banner at <500MB free
Storage info in Settings screen
Integration: Hook into recording flow before capture starts
4.5 Processing Status UI (M3 Gap)
Create: src/features/m3/screens/ProcessingStatusScreen.tsx Display:
Progress bar with % (Queued/Uploading/Processing)
Cancel button
Network reconnection banner
Error states with Retry action
Phase 5: Testing & Observability
5.1 Unit Test Expansion
Target: 85%+ coverage on new/changed code Priority files:
src/features/m3/gateway/M2Gateway.ts (real HTTP client)
Storage guards
AI scripting logic
Sub-niche persistence
5.2 Integration Tests
Scenarios:
End-to-end recording → upload → processing → preview (with sandbox backend)
Offline queue → network recovery → resume upload
Error recovery paths (retry/backoff)
5.3 Telemetry & Structured Logging
Add deterministic events: script_generated, processing_started, processing_complete, export_success
Log format: JSON with correlationId, redacted secrets
Metrics: Stage latencies, retry counts, error codes
5.4 Bundle Analysis CI Job
bundle-analyze:
  runs-on: ubuntu-latest
  steps:
    - run: npm run bundle:analyze
    - name: Check for mocks in bundle
      run: |
        if grep -r "MockM2Gateway" web-build/; then
          echo "❌ Mocks found in production bundle"
          exit 1
        fi
Phase 6: Documentation & Handoff
6.1 Implementation Evidence
Create: docs/BALANCE-HARDENING-M0-M5.md Contents:
List of removed mocks with file paths
Real integrations implemented (backend endpoints)
CI artifacts (test coverage, bundle analysis, Playwright traces)
Run/debug instructions for web e2e + MCP
6.2 Update PRD Implementation Sections
Mark M0-M5 features as "Implemented" with evidence links
Update plan.md status from "In Progress" to "Complete"
Archive outdated planboard.md or sync with reality
Implementation Sequence
Week 1: Foundation (P0)
Phase 1: Mock elimination + CI hardening
Phase 2.1: Backend scaffold (subtitles slice only)
Phase 2.2: Environment configuration
Week 2: Core Features
Phase 2.1 (continued): Complete Epic D tickets (D1-D6)
Phase 4.1: Sub-niche onboarding
Phase 4.4: Storage warnings
Week 3: Advanced Features
Phase 4.2: Project dashboard
Phase 4.3: AI scripting studio
Phase 4.5: Processing status UI
Week 4: Testing & Polish
Phase 3: Web testing infrastructure
Phase 5: Testing expansion + observability
Phase 6: Documentation
Success Criteria (Exit Conditions)
Must-Have (Blocking)
 Zero production imports of MockM2Gateway (verified by CI + bundle analysis)
 Backend service operational with subtitles end-to-end working
 CI passes: typecheck, lint, unit, e2e-web, scan:mocks, bundle-analyze
 Sub-niche onboarding functional
 Storage warnings prevent recording when <500MB free
 Processing status UI shows progress + allows cancel
 Test coverage ≥85% on new code
Nice-to-Have (Non-Blocking)
 Project dashboard with all panels populated
 AI scripting studio with GPT-4o integration
 Full Epic D (all features: filler removal, intro/outro, music)
 Playwright traces/videos attached to PR
Branch Strategy
Option A: Continue on feature/balance-hardening-M0-M4, rename commits to reflect M0-M5 scope
Option B: Create new feature/balance-hardening-M0-M5 branch from current HEAD Recommendation: Option B (clean branch matching prompt requirements)
Risks & Mitigations
Risk	Mitigation
Backend complexity delays Phase 2	Start with subtitles-only slice; defer music/B-roll to Phase 2
AssemblyAI/Shotstack API unavailable	Use fallback providers (Deepgram/Cloudinary) per plan.md
Playwright web tests flaky	Add retry logic; use app signals instead of sleeps
Coverage target missed	Focus on critical paths (gateway, FSMs, storage)
Final Notes
This plan addresses all gaps identified in dev_review.md and ensures zero mocks in production. The phased approach allows incremental verification while maintaining a working main branch. Backend implementation (Phase 2) is the longest pole and should be prioritized.