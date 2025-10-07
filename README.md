# Shorty.ai

Mobile-first short-form video creator for niche-focused creators. Built with Expo SDK 54 and React Native.

## Overview

Shorty.ai enables creators to produce professional short-form videos through a streamlined workflow:
- Script generation (AI or manual)
- Video recording with teleprompter
- Automated editing via external APIs
- Local storage and export

## Tech Stack

- **Framework:** Expo SDK 54 (managed workflow, Expo Go compatible)
- **Language:** TypeScript + React Native
- **State Management:** React Context
- **Storage:** AsyncStorage (metadata) + FileSystem (video files)
- **Testing:** Jest + React Native Testing Library

## Project Structure

```
src/
├── features/
│   └── recording/
│       ├── components/
│       │   ├── CameraPreview.tsx         # Camera preview with recording controls
│       │   └── __tests__/                # Component tests
│       ├── hooks/
│       │   ├── useRecording.ts           # Recording state machine
│       │   ├── useTeleprompter.ts        # Teleprompter scrolling logic
│       │   └── __tests__/                # Hook tests
│       └── services/
│           ├── telemetry.ts              # Recording event tracking
│           └── __tests__/                # Service tests
└── shared/
    └── types/
        └── recording.ts                   # TypeScript interfaces
```

## M1 Milestone: Recording & Teleprompter

### Features Implemented

**Recording (B2)**
- Portrait 9:16 camera preview (1080x1920@30fps)
- Recording controls: Start, Stop, Pause, Resume
- Real-time timer with warning indicator (≤15s remaining)
- Max duration enforcement (120s auto-stop)
- Camera/microphone permission handling
- expo-camera integration with error handling

**Teleprompter (B3)**
- Overlay display with adjustable opacity (55% default)
- Configurable scrolling speed (80-200 WPM, default 140)
- Font size adjustment (S/M/L)
- Sentence highlighting (current 80%, upcoming 50%, past 30%)
- Play/Pause/Restart controls
- Speed slider and font size toggle

**State Management**
- Finite State Machine (FSM) architecture for recording states
- State transitions: Idle → Countdown → Recording ↔ Paused → Reviewing
- Teleprompter states: Hidden → VisiblePaused ↔ Scrolling → Completed
- React hooks encapsulating state logic

**Telemetry (M1)**
- Local event tracking for recording sessions
- 30-day automatic data rotation
- Metrics: recordings started/completed/cancelled, total duration, pause/resume counts
- Privacy-first: All data stored locally in AsyncStorage

### Test Coverage

- **Component Tests:** 29 tests for CameraPreview
- **Hook Tests:** 28 tests for useRecording, 27 tests for useTeleprompter
- **Service Tests:** 10 tests for telemetry
- **Total:** 94 tests, all passing
- **Coverage:** State transitions, edge cases, error handling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (iOS/Android)

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm start

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Type checking
npx tsc --noEmit

# Lint
npx eslint src/
```

### Testing on Device

1. Install Expo Go on your device
2. Scan QR code from `npm start`
3. Grant camera and microphone permissions
4. Navigate to recording screen to test features

## Storage Architecture

### AsyncStorage Keys
- `projects`: Array of Project objects
- `scripts`: Array of Script objects
- `videos`: Array of VideoAsset objects
- `analytics`: Recording telemetry (rotated every 30 days)
- `userProfile`: Onboarding niche selection

### FileSystem Structure
```
FileSystem.documentDirectory/
  videos/
    raw/{projectId}/{timestamp}.mp4
    processed/{videoId}_{timestamp}.mp4
    temp/{videoId}.mp4
```

## Development Principles

### No Placeholders
All deliverables contain functional code with real interfaces. No "lorem ipsum", mock data, or fake endpoints.

### TypeScript Strict Mode
All code uses strict TypeScript with explicit types. No `any` types except in legacy integrations.

### Test-Driven Development
Features implemented with comprehensive test coverage before integration.

### Expo Constraints
- No custom native modules
- No on-device heavy video processing
- All advanced edits via external REST APIs
- Expo Go compatible

## CI/CD

### GitHub Actions Workflow
- TypeScript compilation check
- ESLint validation
- Jest test execution
- Runs on: Pull requests to main, pushes to main

### Quality Gates
- All tests must pass
- No TypeScript errors
- No ESLint errors
- No placeholder content

## Performance Targets

- Warm start: <2s (iPhone 12, Pixel 5)
- Cold start: <4s
- UI interactions: <100ms response
- Screen transitions: <300ms
- Recording start latency: <500ms

## Privacy & Security

- All files stored locally (no cloud backup in MVP)
- No user accounts or personal data transmission
- Explicit camera/microphone consent required
- Telemetry default OFF (toggle in Settings)
- Purge cancelled recordings on user discard

## Roadmap

### Completed
- ✅ M0: Project scaffolding, CI setup, core types
- ✅ M1: Recording state machine, teleprompter, telemetry

### Upcoming
- M2: Script generation (AI + manual)
- M3: Feature selection UI (subtitles, music, effects)
- M4: Processing pipeline integration
- M5: Preview and export

## Documentation

- [PRD.md](PRD.md) - Product requirements
- [CLAUDE.md](CLAUDE.md) - Development guidelines
- [TESTING.md](TESTING.md) - Test documentation
- [docs/M1-STATUS.md](docs/M1-STATUS.md) - Milestone progress

## Contributing

See [CLAUDE.md](CLAUDE.md) for development workflow and coding standards.

## License

Proprietary - All rights reserved
