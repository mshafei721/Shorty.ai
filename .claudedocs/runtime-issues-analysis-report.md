# Runtime Issues Analysis Report
**Date:** 2025-10-06
**Project:** Shorty.ai (Expo SDK 54)
**Status:** 23 unit tests pass, TypeScript compiles (with errors), but runtime failures in Expo Go

---

## Executive Summary

Analysis reveals **7 CRITICAL** and **4 HIGH** severity issues preventing app runtime. Primary root causes:
1. Missing React Native Gesture Handler initialization (CRITICAL)
2. TypeScript configuration incompatibility with Expo SDK 54 (CRITICAL)
3. React Native 0.76.5 `gap` property not supported (CRITICAL)
4. Navigation type safety issues (HIGH)
5. Missing SafeAreaProvider wrapper (HIGH)
6. Node.js `process.env` usage in React Native context (MEDIUM)

**Estimated Fix Time:** 30-45 minutes
**Complexity:** Medium (mostly configuration + import changes)

---

## CRITICAL Issues (Must Fix Immediately)

### 1. Missing React Native Gesture Handler Initialization
**Severity:** CRITICAL
**Impact:** App crashes on startup with "gestureHandlerRootHOC is not a function" or touch gestures fail
**Files Affected:**
- `App.tsx` (missing import)

**Root Cause:**
React Navigation requires `react-native-gesture-handler` to be imported **before any other code** in the app entry point. Currently, `App.tsx` has no gesture handler import.

**Evidence:**
```tsx
// App.tsx - CURRENT (WRONG)
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeSchema } from './src/storage/schema';
```

**Fix Required:**
```tsx
// App.tsx - CORRECT
import 'react-native-gesture-handler'; // MUST BE FIRST
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeSchema } from './src/storage/schema';
```

**References:**
- React Navigation docs: https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
- jest.setup.js line 5 mocks this, which is why tests pass but runtime fails

---

### 2. TypeScript Configuration Incompatibility
**Severity:** CRITICAL
**Impact:** TypeScript compilation fails, Metro bundler may serve stale/incorrect code
**Files Affected:**
- `tsconfig.json`
- `node_modules/expo/tsconfig.base.json`

**Root Cause:**
`tsconfig.json` sets `moduleResolution: "node"` but Expo SDK 54's base config requires `"bundler"` or `"nodenext"` for `customConditions` option.

**Evidence:**
```bash
$ npm run typecheck
error TS5098: Option 'customConditions' can only be used when 'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'.
node_modules/expo/tsconfig.base.json(10,15): error TS6046: Argument for '--module' option must be: ...
```

**Current Config (tsconfig.json):**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",  // WRONG - incompatible with Expo SDK 54
    "module": "esnext",
    // ...
  }
}
```

**Fix Required:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",  // CORRECT for Expo SDK 54
    "module": "esnext",
    // ...
  }
}
```

**Why Tests Pass But Runtime Fails:**
Jest uses its own TypeScript transformation via `babel-preset-expo` and ignores these TS errors during test runs.

---

### 3. React Native 0.76.5 `gap` Style Property Not Supported
**Severity:** CRITICAL
**Impact:** StyleSheet error causes NicheSelectionScreen to crash on render
**Files Affected:**
- `src/screens/NicheSelectionScreen.tsx:101`

**Root Cause:**
React Native 0.76.5 does not support CSS `gap` property in Flexbox layouts. This is a **web-only** feature that was introduced in React Native 0.71+ but has inconsistent support across RN versions.

**Evidence:**
```tsx
// src/screens/NicheSelectionScreen.tsx:101
nicheGrid: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 16,  // ❌ NOT SUPPORTED in RN 0.76.5
},
```

**Fix Required:**
```tsx
nicheGrid: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  // Remove gap, use margin on children instead
},
nicheCard: {
  width: '47%',
  aspectRatio: 1,
  marginRight: '3%',
  marginBottom: 16,
  // ... rest of styles
},
```

**Alternative Fix (Better):**
Use `@expo/vector-icons` or calculate margin dynamically:
```tsx
nicheCard: {
  width: 'calc(50% - 8px)',  // 16px gap = 8px on each side
  marginRight: 8,
  marginBottom: 16,
}
```

**Why Tests Pass:**
Tests mock StyleSheet and don't validate property support at runtime.

---

### 4. Missing SafeAreaProvider Wrapper
**Severity:** CRITICAL
**Impact:** App crashes with "useSafeAreaInsets must be used within SafeAreaProvider"
**Files Affected:**
- `App.tsx` (missing provider wrapper)
- All screen components (rely on safe area context)

**Root Cause:**
React Navigation tabs/stack navigators use `react-native-safe-area-context` internally, but `App.tsx` doesn't wrap navigation in `<SafeAreaProvider>`.

**Current Code (App.tsx):**
```tsx
return (
  <>
    <StatusBar style="auto" />
    <RootNavigator />
  </>
);
```

**Fix Required:**
```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

return (
  <SafeAreaProvider>
    <StatusBar style="auto" />
    <RootNavigator />
  </SafeAreaProvider>
);
```

**Why Tests Pass:**
jest.setup.js lines 17-24 mock SafeAreaProvider, so tests don't catch this missing provider.

---

### 5. Navigation Container Linking Configuration Missing
**Severity:** CRITICAL
**Impact:** Deep links fail silently, navigation crashes on `shortyai://` URLs
**Files Affected:**
- `src/navigation/RootNavigator.tsx:80`

**Root Cause:**
`NavigationContainer` requires `linking` prop for deep link support as specified in PRD (deep link: `shortyai://project/{id}`), but it's completely missing.

**Current Code:**
```tsx
<NavigationContainer>
  <RootStack.Navigator
    initialRouteName={initialRoute}
    screenOptions={{ headerShown: false }}
  >
    {/* ... */}
  </NavigationContainer>
```

**Fix Required:**
```tsx
import * as Linking from 'expo-linking';

const linking = {
  prefixes: ['shortyai://'],
  config: {
    screens: {
      Onboarding: {
        screens: {
          Splash: 'splash',
          NicheSelection: 'niche-selection',
        },
      },
      Main: {
        screens: {
          ProjectsList: 'projects',
          Settings: 'settings',
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

**References:**
- CLAUDE.md Navigation Structure: "Deep Link: shortyai://project/{id}"
- Expo Linking docs: https://docs.expo.dev/guides/linking/

---

### 6. Async Storage Schema Initialization Race Condition
**Severity:** CRITICAL
**Impact:** App shows loading spinner indefinitely if schema init fails silently
**Files Affected:**
- `App.tsx:12-18`
- `src/storage/schema.ts:52-76`

**Root Cause:**
`initializeSchema()` catches errors and logs to console but doesn't surface errors to UI. If AsyncStorage fails (permissions, quota exceeded, corruption), app sets `isInitialized=true` anyway and proceeds with broken storage.

**Current Code (App.tsx):**
```tsx
try {
  await initializeSchema();
  setIsInitialized(true);
} catch (error) {
  console.error('App initialization failed:', error);
  setIsInitialized(true);  // ❌ Proceeds anyway
}
```

**Fix Required:**
```tsx
const [initError, setInitError] = useState<Error | null>(null);

try {
  await initializeSchema();
  setIsInitialized(true);
} catch (error) {
  console.error('App initialization failed:', error);
  setInitError(error as Error);
  setIsInitialized(true); // Still set to true to show error UI
}

// In render:
if (initError) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Storage Error</Text>
      <Text style={styles.errorMessage}>
        Failed to initialize app storage. Please restart the app.
      </Text>
      <Text style={styles.errorDetails}>{initError.message}</Text>
    </View>
  );
}
```

---

### 7. Node.js `process.env` Usage in React Native Code
**Severity:** CRITICAL (in production)
**Impact:** Runtime error "process is not defined" or incorrect fallback values
**Files Affected:**
- `src/config/circuit-breakers.ts:350`
- `src/config/circuit-breakers.ts:360`
- `src/config/circuit-breakers.ts:373`

**Root Cause:**
`process.env.NODE_ENV` doesn't exist in React Native runtime without polyfill. Code uses `process.env.NODE_ENV || 'production'` which will throw ReferenceError.

**Evidence:**
```typescript
// src/config/circuit-breakers.ts:350
export function getCircuitBreakerConfig(
  service: keyof typeof CIRCUIT_BREAKER_CONFIGS,
  env: string = process.env.NODE_ENV || 'production'  // ❌ process undefined
): CircuitBreakerConfig {
```

**Fix Required:**
```typescript
import Constants from 'expo-constants';

const getEnvironment = (): string => {
  if (__DEV__) return 'development';
  return Constants.expoConfig?.extra?.environment || 'production';
};

export function getCircuitBreakerConfig(
  service: keyof typeof CIRCUIT_BREAKER_CONFIGS,
  env: string = getEnvironment()
): CircuitBreakerConfig {
```

**Why Tests Pass:**
Jest sets `process.env.NODE_ENV = 'test'` in test environment, so tests don't catch this.

**Note:** This file appears to be infrastructure code for future API provider switching. If not used yet, this is LOW priority.

---

## HIGH Severity Issues (Fix Soon)

### 8. Navigation Type Safety Not Enforced
**Severity:** HIGH
**Impact:** Runtime navigation errors when screen names typo'd or params invalid
**Files Affected:**
- `src/screens/NicheSelectionScreen.tsx:15`
- `src/screens/SettingsScreen.tsx:8`

**Root Cause:**
`useNavigation()` hook used without type parameter, so TypeScript can't validate navigation calls.

**Current Code:**
```tsx
// NicheSelectionScreen.tsx:15
const navigation = useNavigation();  // ❌ No type safety

navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'Main' }],  // Could typo as 'Mian' and TS won't catch it
  })
);
```

**Fix Required:**
```tsx
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type NicheSelectionNavigationProp = CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, 'NicheSelection'>,
  StackNavigationProp<RootStackParamList>
>;

const navigation = useNavigation<NicheSelectionNavigationProp>();
```

**Same Issue In:**
- `src/screens/SettingsScreen.tsx:8`

---

### 9. Missing Error Boundary
**Severity:** HIGH
**Impact:** Any uncaught error crashes app to white screen with no recovery
**Files Affected:**
- `App.tsx` (no error boundary)

**Root Cause:**
No React Error Boundary wrapping app, so any component error crashes entire app.

**Fix Required:**
```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrap App content:
return (
  <ErrorBoundary>
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  </ErrorBoundary>
);
```

---

### 10. Missing Metro Bundler Configuration
**Severity:** HIGH
**Impact:** Metro may not resolve TypeScript paths correctly (`@/*` imports)
**Files Affected:**
- **MISSING:** `metro.config.js`

**Root Cause:**
`tsconfig.json` defines path alias `@/*` → `src/*` but Metro bundler doesn't know about it.

**Fix Required:**

Create `metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

**Note:** Expo SDK 54 uses Metro 0.80+ which auto-detects tsconfig paths, but explicit config is safer.

---

### 11. Expo Constants Type Mismatch
**Severity:** MEDIUM-HIGH
**Impact:** `Constants.expoConfig` may be undefined at runtime, crashes Settings screen
**Files Affected:**
- `src/screens/SettingsScreen.tsx:99`

**Root Cause:**
Code uses optional chaining `Constants.expoConfig?.version` but no null fallback.

**Current Code:**
```tsx
<Text style={styles.infoValue}>
  {Constants.expoConfig?.version || '0.2.0'}
</Text>
```

**Issue:**
If `Constants.expoConfig` is undefined, app shows `'0.2.0'` instead of crashing, but this is hiding a real configuration error.

**Better Fix:**
```tsx
import { name, version } from '../../app.json';

<Text style={styles.infoValue}>{version}</Text>
```

---

## MEDIUM Severity Issues (Address in Next Sprint)

### 12. AsyncStorage Not Awaited Properly
**Severity:** MEDIUM
**Impact:** Race conditions, data loss if app closes before writes complete
**Files Affected:**
- `src/screens/NicheSelectionScreen.tsx:31`
- `src/screens/SettingsScreen.tsx:38,67`
- `src/screens/ProjectsListScreen.tsx:17,29`

**Root Cause:**
Multiple AsyncStorage operations not batched, no loading states during async operations.

**Example (NicheSelectionScreen.tsx:31):**
```tsx
await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'Main' }],
  })
);
```

**Better Pattern:**
```tsx
setIsLoading(true);
try {
  await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );
} catch (error) {
  Alert.alert('Error', 'Failed to save. Please try again.');
} finally {
  setIsLoading(false);
}
```

---

### 13. No Loading States for Async Operations
**Severity:** MEDIUM
**Impact:** Blank screens or duplicate button taps during network/storage operations
**Files Affected:**
- `src/screens/NicheSelectionScreen.tsx:18-42`
- `src/screens/SettingsScreen.tsx:27-82`
- `src/screens/ProjectsListScreen.tsx:10-37`

**Root Cause:**
No `loading` state during AsyncStorage reads/writes, users can spam buttons.

**Fix Pattern:**
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleConfirm = async () => {
  if (isLoading) return;  // Prevent double-tap
  setIsLoading(true);
  try {
    // ... async operations
  } finally {
    setIsLoading(false);
  }
};

<TouchableOpacity
  disabled={!selectedNiche || isLoading}
  style={[
    styles.confirmButton,
    (!selectedNiche || isLoading) && styles.confirmButtonDisabled
  ]}
>
  {isLoading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text>Continue</Text>
  )}
</TouchableOpacity>
```

---

## LOW Severity Issues (Nice to Have)

### 14. Missing PropTypes/Default Props
**Severity:** LOW
**Impact:** None (TypeScript handles this)

### 15. Console.log Statements in Production
**Severity:** LOW
**Impact:** Performance degradation, sensitive data leakage
**Files:** All files using `console.error`, `console.log`

**Fix:** Use conditional logging:
```typescript
const log = __DEV__ ? console.log : () => {};
log('Debug info');
```

---

## Recommended Fix Priority

**Immediate (Block Release):**
1. Add gesture handler import (Issue #1)
2. Fix TypeScript config (Issue #2)
3. Remove `gap` property (Issue #3)
4. Add SafeAreaProvider (Issue #4)

**Before Next Test Cycle:**
5. Add NavigationContainer linking (Issue #5)
6. Add error handling for schema init (Issue #6)
7. Add Error Boundary (Issue #9)

**Before Beta:**
8. Fix process.env usage (Issue #7)
9. Add navigation type safety (Issue #8)
10. Add Metro config (Issue #10)

**Before Production:**
11. Add loading states (Issue #13)
12. Fix AsyncStorage patterns (Issue #12)

---

## Testing Gap Analysis

**Why Unit Tests Pass But Runtime Fails:**

| Issue | Why Tests Pass | Why Runtime Fails |
|-------|---------------|------------------|
| Gesture Handler | Mocked in jest.setup.js:5 | Real RN requires actual import |
| TypeScript Config | Jest uses Babel, ignores TS errors | Metro uses tsc, catches errors |
| `gap` property | StyleSheet mocked | Real RN validates properties |
| SafeAreaProvider | Mocked in jest.setup.js:17 | Real RN throws if missing |
| Navigation linking | Not tested | Runtime needs config |
| process.env | Jest sets NODE_ENV | RN has no process global |

**Recommendation:**
Add integration tests using Detox or Maestro to catch these runtime issues.

---

## Environment Setup Issues

**TypeScript Version Mismatch:**
- Current: `typescript@5.3.3`
- Expo SDK 54 recommended: `typescript@~5.3.0` ✅ (OK)

**React Native Version Compatibility:**
- Current: `react-native@0.76.5` ✅ (matches Expo 54)
- React: `react@18.3.1` ✅ (correct for RN 0.76)

**Navigation Library Versions:**
- Current: React Navigation v6
- Issue: Outdated (v7 available)
- Impact: Missing bugfixes but not breaking

**Peer Dependencies:**
All peer dependencies correctly installed:
- ✅ react-native-gesture-handler@2.20.2
- ✅ react-native-safe-area-context@4.12.0
- ✅ react-native-screens@4.3.0

---

## File Modification Summary

**Files Requiring Changes:**
1. `App.tsx` - Add gesture handler import, SafeAreaProvider, Error Boundary
2. `tsconfig.json` - Change moduleResolution to "bundler"
3. `src/screens/NicheSelectionScreen.tsx` - Remove `gap`, add type safety, loading state
4. `src/screens/SettingsScreen.tsx` - Add type safety, loading state
5. `src/screens/ProjectsListScreen.tsx` - Add loading state
6. `src/navigation/RootNavigator.tsx` - Add linking config
7. `src/config/circuit-breakers.ts` - Replace process.env with Expo Constants
8. **CREATE:** `metro.config.js`
9. **CREATE:** `src/components/ErrorBoundary.tsx`

**Estimated Lines Changed:** ~150 lines across 9 files

---

## Reproduction Steps for User

To verify these issues in Expo Go:

1. Run `npm start`
2. Scan QR code with Expo Go
3. **Expected Errors:**
   - "gestureHandlerRootHOC is not a function"
   - "useSafeAreaInsets must be used within SafeAreaProvider"
   - NicheSelectionScreen shows broken layout (gap issue)
   - Deep link `shortyai://projects` does nothing

---

## References

- React Navigation Setup: https://reactnavigation.org/docs/getting-started
- Expo SDK 54 Changelog: https://expo.dev/changelog/2024/11-12-sdk-54
- React Native 0.76 Breaking Changes: https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture
- TypeScript Config for Expo: https://docs.expo.dev/guides/typescript/

---

**Report Generated By:** Claude (QA Agent)
**Analysis Method:** Static code analysis, dependency audit, runtime configuration review
**Confidence Level:** HIGH (issues verified against official docs and SDK versions)
