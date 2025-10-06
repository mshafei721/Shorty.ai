# Runtime Fixes Checklist
**Quick Reference Guide for Fixing Shorty.ai Runtime Errors**

## Critical Fixes (Must Do Immediately)

### ✅ Fix #1: Add Gesture Handler Import
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\App.tsx`

**Change Line 1 from:**
```tsx
import React, { useEffect, useState } from 'react';
```

**To:**
```tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
```

**Reason:** React Navigation requires this as first import.

---

### ✅ Fix #2: Add SafeAreaProvider Wrapper
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\App.tsx`

**Add import at top:**
```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
```

**Change return statement from:**
```tsx
return (
  <>
    <StatusBar style="auto" />
    <RootNavigator />
  </>
);
```

**To:**
```tsx
return (
  <SafeAreaProvider>
    <StatusBar style="auto" />
    <RootNavigator />
  </SafeAreaProvider>
);
```

---

### ✅ Fix #3: Fix TypeScript Config
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\tsconfig.json`

**Change line 13 from:**
```json
"moduleResolution": "node",
```

**To:**
```json
"moduleResolution": "bundler",
```

**Then run:**
```bash
npm run typecheck
```

Should now show 0 errors.

---

### ✅ Fix #4: Remove `gap` Property
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\src\screens\NicheSelectionScreen.tsx`

**Change styles (line 97-102) from:**
```tsx
nicheGrid: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 16,  // ❌ REMOVE THIS
},
```

**To:**
```tsx
nicheGrid: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},
```

**And change nicheCard (line 103-112) from:**
```tsx
nicheCard: {
  width: '47%',
  aspectRatio: 1,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#E0E0E0',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FAFAFA',
},
```

**To:**
```tsx
nicheCard: {
  width: '48%',
  aspectRatio: 1,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#E0E0E0',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FAFAFA',
  marginBottom: 16,
},
```

---

### ✅ Fix #5: Add Navigation Linking Config
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\src\navigation\RootNavigator.tsx`

**Add import at top:**
```tsx
import * as Linking from 'expo-linking';
```

**Add before RootNavigator function (after line 28):**
```tsx
const linking = {
  prefixes: [Linking.createURL('/'), 'shortyai://'],
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
```

**Change line 80 from:**
```tsx
<NavigationContainer>
```

**To:**
```tsx
<NavigationContainer linking={linking}>
```

---

### ✅ Fix #6: Fix Schema Init Error Handling
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\App.tsx`

**Change state (line 8) from:**
```tsx
const [isInitialized, setIsInitialized] = useState(false);
```

**To:**
```tsx
const [isInitialized, setIsInitialized] = useState(false);
const [initError, setInitError] = useState<Error | null>(null);
```

**Change useEffect (lines 12-18) from:**
```tsx
try {
  await initializeSchema();
  setIsInitialized(true);
} catch (error) {
  console.error('App initialization failed:', error);
  setIsInitialized(true);
}
```

**To:**
```tsx
try {
  await initializeSchema();
  setIsInitialized(true);
} catch (error) {
  console.error('App initialization failed:', error);
  setInitError(error as Error);
  setIsInitialized(true);
}
```

**Add error UI before loading check (after line 23):**
```tsx
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

**Add to styles (after line 47):**
```tsx
errorContainer: {
  flex: 1,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
},
errorTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FF3B30',
  marginBottom: 12,
},
errorMessage: {
  fontSize: 16,
  color: '#000',
  textAlign: 'center',
  marginBottom: 8,
},
errorDetails: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  fontFamily: 'monospace',
},
```

---

### ✅ Fix #7: Fix process.env Usage
**File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\src\config\circuit-breakers.ts`

**Add import at top (after line 8):**
```tsx
import Constants from 'expo-constants';
```

**Add helper function (after line 25, before line 26):**
```tsx
/**
 * Get current environment (development/production)
 * Safe for React Native - doesn't use process.env
 */
function getEnvironment(): string {
  if (__DEV__) return 'development';
  return Constants.expoConfig?.extra?.environment || 'production';
}
```

**Change line 350 from:**
```typescript
env: string = process.env.NODE_ENV || 'production'
```

**To:**
```typescript
env: string = getEnvironment()
```

**Change line 373 from:**
```typescript
env: string = process.env.NODE_ENV || 'production'
```

**To:**
```typescript
env: string = getEnvironment()
```

---

## High Priority Fixes (Do Before Testing)

### ✅ Fix #8: Create Metro Config
**Create New File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\metro.config.js`

**Content:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

---

### ✅ Fix #9: Add Error Boundary
**Create New File:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\src\components\ErrorBoundary.tsx`

**Content:**
```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

**Then update:** `d:\009_Projects_AI\Personal_Projects\Shorty.ai\App.tsx`

**Add import:**
```tsx
import { ErrorBoundary } from './src/components/ErrorBoundary';
```

**Wrap return value:**
```tsx
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

## Verification Steps

After applying all fixes:

```bash
# 1. Clear cache
npx expo start -c

# 2. Verify TypeScript
npm run typecheck
# Should show: "No errors"

# 3. Verify tests still pass
npm test
# Should show: "23 passed"

# 4. Test in Expo Go
npm start
# Scan QR code, app should:
# - Load without errors
# - Show splash screen
# - Navigate to niche selection
# - Navigate to projects list
# - Settings screen works
```

---

## Expected Results After Fixes

### Before Fixes (Current State):
- ❌ App crashes on startup
- ❌ Gesture navigation broken
- ❌ TypeScript errors
- ❌ Layout broken on NicheSelection
- ❌ Deep links don't work

### After Fixes:
- ✅ App loads successfully
- ✅ All navigation works smoothly
- ✅ TypeScript compiles clean
- ✅ Layouts render correctly
- ✅ Deep links functional
- ✅ Error handling robust

---

## Estimated Time to Complete

- **Critical Fixes (1-7):** 15-20 minutes
- **High Priority (8-9):** 10 minutes
- **Testing & Verification:** 5-10 minutes

**Total:** 30-40 minutes

---

## Files Modified Summary

| File | Changes | Lines Changed |
|------|---------|--------------|
| `App.tsx` | Add imports, providers, error handling | ~40 |
| `tsconfig.json` | Change moduleResolution | 1 |
| `src/screens/NicheSelectionScreen.tsx` | Remove gap, adjust styles | ~5 |
| `src/navigation/RootNavigator.tsx` | Add linking config | ~20 |
| `src/config/circuit-breakers.ts` | Fix process.env | ~15 |
| `metro.config.js` | **CREATE** | 5 |
| `src/components/ErrorBoundary.tsx` | **CREATE** | 80 |

**Total:** ~166 lines changed/added across 7 files

---

## Rollback Plan

If fixes cause new issues:

```bash
# Restore to previous state
git status
git restore <file>

# Or reset all changes
git checkout .
```

---

## Support Resources

- **Full Analysis:** See `runtime-issues-analysis-report.md`
- **React Navigation Docs:** https://reactnavigation.org/docs/getting-started
- **Expo SDK 54 Docs:** https://docs.expo.dev/versions/v54.0.0/
- **TypeScript Config:** https://docs.expo.dev/guides/typescript/

---

**Checklist Generated By:** Claude (QA Agent)
**Last Updated:** 2025-10-06
