# Shorty.ai - Quick Start Guide

**Status:** ✅ M0 Complete | Ready for Development

---

## What You Have (M0 Foundations)

✅ **Working Expo SDK 54 app** with TypeScript
✅ **23 passing tests** (4 test suites)
✅ **Navigation system** (Onboarding → Main stacks)
✅ **AsyncStorage schema** v1 with type-safe helpers
✅ **Architecture docs** (adapter interfaces, circuit breakers)
✅ **Orchestrator system** (planning, tracking, memory)
✅ **CI/CD workflows** (ready for GitHub Actions)

---

## Run the App (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Open in Expo Go
- **iOS/Android Phone:** Scan QR code with Expo Go app
- **iOS Simulator:** Press `i`
- **Android Emulator:** Press `a`

### 4. What You'll See
1. **Splash Screen** (2 second delay)
2. **Niche Selection Screen** (stub)
3. **Projects List** (empty state)
4. **Settings Screen** (tap gear icon)

---

## Verify Everything Works

### ✅ TypeScript Compiles
```bash
npx tsc --noEmit
# Expected: (no output = success)
```

### ✅ Tests Pass
```bash
npm test
# Expected: Test Suites: 4 passed, Tests: 23 passed
```

### ✅ Lint Clean
```bash
npm run lint
# Expected: (no errors)
```

---

## Project Structure

```
shorty-ai/
├── src/
│   ├── navigation/        # RootNavigator, stacks, types
│   │   └── RootNavigator.tsx
│   ├── screens/           # 5 stub screens
│   │   ├── SplashScreen.tsx
│   │   ├── NicheSelectionScreen.tsx
│   │   ├── ProjectsListScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── storage/           # AsyncStorage schema & helpers
│       └── schema.ts
├── __tests__/             # 23 tests across 4 suites
├── docs/
│   └── architecture/
│       └── adapters.md    # API adapter interfaces
├── .orchestrator/         # Planning & tracking
│   ├── memory.jsonl
│   ├── planboard.md       # 26 tickets (M0-M5)
│   └── risks.md
├── App.tsx                # Root component
├── package.json           # Expo SDK 54, React Navigation v6
└── M0-STATUS.md           # Detailed status report
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `App.tsx` | Root component with initialization |
| `src/navigation/RootNavigator.tsx` | Navigation logic (onboarding vs main) |
| `src/storage/schema.ts` | AsyncStorage schema v1 |
| `docs/architecture/adapters.md` | API adapter interfaces (1,155 lines) |
| `.orchestrator/planboard.md` | 26 tickets across M0-M5 milestones |
| `M0-STATUS.md` | M0 deliverables & testing guide |

---

## Next: M1 (Recording & Teleprompter)

**Weeks 3-4 (Oct 21-Nov 3):**

### Planned Features
1. **Camera Permissions:** Request camera/mic with error handling
2. **Video Recording:** Portrait 1080x1920@30fps, ≤120s auto-stop
3. **Teleprompter Overlay:** Opacity 0.55, WPM 80-200, font S/M/L
4. **Storage Checks:** Warn at <500MB free
5. **Projects CRUD:** Implement create/edit/delete (stubs exist)

### Tickets Ready
- **B1:** Camera Permissions & Error States
- **B2:** Portrait Video Capture
- **B3:** Teleprompter Overlay
- **B4:** Recording State Machine
- **A2:** Enhance Onboarding (niche selection UI)
- **A3:** Projects CRUD Implementation

See `.orchestrator/planboard.md` for full M1 breakdown.

---

## Development Commands

### Essential
```bash
npm start                 # Start Expo dev server
npm test                  # Run all tests
npm run lint              # ESLint
npx tsc --noEmit          # TypeScript check
```

### Platform-Specific
```bash
npm run ios               # iOS simulator
npm run android           # Android emulator
npm run web               # Web browser (limited support)
```

### Testing
```bash
npm test -- --coverage    # With coverage report
npm test -- --watch       # Watch mode
npm test App.test         # Single file
```

---

## Troubleshooting

### Tests Fail
```bash
# Clear cache
npm test -- --clearCache
npm test
```

### TypeScript Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Expo Won't Start
```bash
# Clear Expo cache
npx expo start --clear
```

### Port Already in Use
```bash
# Kill process on port 8081
npx kill-port 8081
npm start
```

---

## Documentation

- **M0 Status:** [M0-STATUS.md](M0-STATUS.md)
- **Architecture:** [docs/architecture/adapters.md](docs/architecture/adapters.md)
- **Planning:** [.orchestrator/planboard.md](.orchestrator/planboard.md)
- **PRD:** [PRD.md](PRD.md)
- **Plan:** [plan.md](plan.md)

---

## Git Status

**Branch:** `main`
**Last Commit:** `5d09af4` - M0 complete
**Status:** ✅ Clean working tree

```bash
git log --oneline -5
# 5d09af4 docs(M0): add milestone status summary
# d335a06 feat(M0): complete foundations milestone [M0-COMPLETE]
# 3529eb4 Merge pull request #3
# 831a6da docs(A0): architecture adapters & circuit breakers
# 00dde55 feat(M0): orchestrator initialization
```

---

## Questions?

- Check [M0-STATUS.md](M0-STATUS.md) for detailed status
- See [.orchestrator/planboard.md](.orchestrator/planboard.md) for roadmap
- Review [CLAUDE.md](CLAUDE.md) for project guidelines

**Ready to start M1!** 🚀
