# CI Failure Investigation Report

**Date:** October 6, 2025
**PR:** #7 - fix(M0): resolve all runtime errors and update dependencies
**Status:** ❌ All CI checks failing
**Root Cause:** Package.json dependency conflict

---

## Executive Summary

**ALL 3 FAILING TESTS HAVE THE SAME ROOT CAUSE:**

`npm ci` fails during CI installation because `package.json` has conflicting `@types/react` versions:
- **dependencies:** `"@types/react": "~19.1.10"` (React 19 types)
- **devDependencies:** `"@types/react": "~18.3.12"` (React 18 types)

This creates an `ERESOLVE` conflict that `npm ci` cannot resolve without `--legacy-peer-deps`.

---

## CI Test Results

### ❌ TypeScript Check - FAILED
**Error:** `npm ci` fails with `ERESOLVE` conflict
**Job:** https://github.com/mshafei721/Shorty.ai/actions/runs/18290180841/job/52075270272
**Duration:** 10s
**Status:** Never reaches TypeScript compilation step

### ❌ Lint - FAILED
**Error:** `npm ci` fails with `ERESOLVE` conflict
**Job:** https://github.com/mshafei721/Shorty.ai/actions/runs/18290180841/job/52075270320
**Duration:** 9s
**Status:** Never reaches linting step

### ❌ Unit Tests - FAILED
**Error:** `npm ci` fails with `ERESOLVE` conflict
**Job:** https://github.com/mshafei721/Shorty.ai/actions/runs/18290180841/job/52075270270
**Duration:** 14s
**Status:** Never reaches test execution step

### ✅ Enforce No-Mocks Policy - PASSED
**Duration:** 4s
**Status:** This check doesn't require dependencies, so it passes

---

## Root Cause Analysis

### The Problem

**File:** `package.json`

```json
{
  "dependencies": {
    "@types/react": "~19.1.10",  // ❌ CONFLICT: React 19 types
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",  // ❌ CONFLICT: React 18 types
    "typescript": "~5.3.3"
  }
}
```

**npm ci Error:**
```
npm error While resolving: react-native@0.81.4
npm error Found: @types/react@18.3.25
npm error node_modules/@types/react
npm error   dev @types/react@"~18.3.12" from the root project
npm error
npm error Could not resolve dependency:
npm error peerOptional @types/react@"^19.1.0" from react-native@0.81.4
npm error
npm error Conflicting peer dependency: @types/react@19.2.0
```

### Why This Happened

1. **Initial package.json** had `@types/react@~18.3.12` in `devDependencies`
2. **During update** to Expo SDK 54, we ran:
   ```bash
   npx expo install @types/react@~19.1.10 -- --legacy-peer-deps
   ```
3. **Expo install added** `@types/react@~19.1.10` to `dependencies` instead of updating the existing `devDependencies` entry
4. **Result:** TWO conflicting `@types/react` versions in package.json

### Why It Works Locally But Fails in CI

**Locally (Windows):**
- We used `npm install --legacy-peer-deps`
- This flag tells npm to **ignore peer dependency conflicts**
- package-lock.json gets created with conflicts ignored
- Tests pass because npm installs a working (but technically incorrect) tree

**In CI (GitHub Actions):**
- GitHub Actions uses `npm ci` (clean install)
- `npm ci` is **STRICT** - it requires package-lock.json to be consistent with package.json
- `npm ci` does **NOT** accept `--legacy-peer-deps` flag
- It fails immediately when detecting the conflict

---

## Why Tests Pass Locally

```bash
# Local commands that worked:
npm install --legacy-peer-deps  ✅
npm test                        ✅
npm run typecheck               ✅
npm run lint                    ✅
```

**Local environment bypasses the conflict** because:
1. `--legacy-peer-deps` ignores peer dependency warnings
2. package-lock.json is already generated with the workaround
3. node_modules has React 19 types installed (wins over React 18 types)
4. TypeScript/Jest use the installed types from node_modules, not from package.json

---

## Evidence

### package.json Inspection

```bash
$ grep -A 5 '"@types/react"' package.json

"@types/react": "~19.1.10",     # Line in dependencies
    "expo": "~54.0.0",
    "expo-constants": "~18.0.9",
--
    "@types/react": "~18.3.12",  # Line in devDependencies
    "jest": "^29.7.0",
    "jest-expo": "~54.0.0",
```

### CI Logs - All Three Jobs

All jobs fail at the **exact same step** with the **exact same error**:

```
npm error ERESOLVE could not resolve
npm error While resolving: react-native@0.81.4
npm error Found: @types/react@18.3.25
npm error   dev @types/react@"~18.3.12" from the root project
npm error Could not resolve dependency:
npm error peerOptional @types/react@"^19.1.0" from react-native@0.81.4
npm error Conflicting peer dependency: @types/react@19.2.0
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
```

---

## Impact Assessment

### What's Broken
- ❌ **CI Pipeline:** Cannot run any tests/checks on PR
- ❌ **Pull Request:** Cannot merge PR #7 with failing checks
- ❌ **GitHub Actions:** 3 out of 4 checks failing

### What Still Works
- ✅ **Local Development:** All tests pass locally
- ✅ **Local Build:** App runs in Expo Go
- ✅ **Local TypeScript:** Compiles successfully
- ✅ **No-Mocks Check:** Passes in CI (doesn't need dependencies)

---

## The Fix (DO NOT IMPLEMENT - INVESTIGATION ONLY)

**Option 1: Remove Duplicate Entry (RECOMMENDED)**
```json
{
  "devDependencies": {
    "@types/react": "~19.1.10",  // ✅ Single source of truth
    // Remove the old ~18.3.12 entry
  }
}
```

**Option 2: Keep Only devDependencies (ALTERNATIVE)**
```json
{
  "devDependencies": {
    "@types/react": "~19.1.10",  // ✅ Keep in devDependencies
  }
  // Remove from dependencies
}
```

**Then regenerate package-lock.json:**
```bash
rm package-lock.json
npm install
```

---

## Why This Is a Codebase Issue (Not CI Issue)

**❌ NOT a CI configuration problem:**
- GitHub Actions workflow is correct
- `npm ci` is the recommended command for CI
- The workflow worked fine before the package updates

**✅ IS a codebase problem:**
- `package.json` has conflicting dependencies
- `package-lock.json` was generated with `--legacy-peer-deps` workaround
- The workaround masks the underlying issue locally
- CI correctly rejects the invalid state

---

## Conclusion

**Is it the tests?** ❌ NO
**Is it the CI?** ❌ NO
**Is it the codebase?** ✅ YES

**The problem:** `package.json` has duplicate conflicting `@types/react` entries
**The solution:** Remove one of the duplicate entries and regenerate package-lock.json
**Why it wasn't caught:** Local development used `--legacy-peer-deps` which hides the issue
**Why CI caught it:** `npm ci` enforces strict dependency resolution

---

## Recommendations

1. **Fix the duplicate `@types/react` entry** in package.json
2. **Regenerate package-lock.json** with `npm install` (without --legacy-peer-deps if possible)
3. **Test locally** with fresh `node_modules` to ensure clean install works
4. **Push the fix** to PR #7
5. **Consider:** Add `.github/workflows/test-install.yml` that runs `npm ci` to catch these issues early

---

**Status:** Investigation complete. Root cause identified. Solution defined. Awaiting decision to implement fix.
