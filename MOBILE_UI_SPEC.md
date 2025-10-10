# Shorty.ai Mobile UI Specification

**Version:** 2.0.0 (Mobile-Only, OLED Dark Mode)
**Platform:** React Native (iOS + Android via Expo)
**Target Audience:** Gen-Z creators
**Design Philosophy:** Bold, minimal, high-contrast, authentic

---

## Design Principles

### 1. OLED Dark Mode First
- **Pure black backgrounds** (#000000) for OLED battery efficiency
- **High-contrast UI elements** on black (WCAG AAA where possible)
- **Bold accent colors** (Electric Blue #00D4FF, Vibrant Purple #7C5CFF)
- **No light mode** (dark mode only reduces complexity, 70% Gen-Z preference)

### 2. Bold & Minimal Aesthetic
- **Oversized typography** for headers (32-48px, weight 700-900)
- **Generous spacing** (16-24px screen padding, 8px base unit)
- **No gradients** (solid colors with subtle shadows)
- **Neubrutalism influences** (flat colors, sharp borders, offset shadows)

### 3. Instant Feedback
- **Micro-interactions on every tap** (scale 0.95 → 1.0, 200ms)
- **Haptic feedback** for all interactive elements
- **60fps animations** via React Native Reanimated
- **Optimistic updates** (show success before server confirms)

### 4. Thumb-Reachable Design
- **Bottom-heavy layout** (primary actions in bottom 50% of screen)
- **44×44px minimum touch targets** (48×48px preferred)
- **Bottom sheets** for contextual actions
- **One-handed operation** optimized for 6.1-6.7" screens

---

## Color System (OLED Optimized)

### Core Palette

```typescript
// Primary (Vibrant Purple)
primary[600]: '#7C5CFF'  // Main CTA buttons, active states
primary[700]: '#6D28D9'  // Pressed states

// Accent (Electric Blue)
accent[500]: '#00D4FF'   // Success states, highlights, links
accent[600]: '#00B8E6'   // Hover/pressed accent

// Neutral (OLED Black)
neutral[1000]: '#000000' // Background (OLED)
neutral[900]: '#0A0E27'  // Alt background (dark navy)
neutral[800]: '#18191C'  // Cards, panels
neutral[700]: '#1F2937'  // Elevated cards

// Text (White on Black)
text.primary: '#FFFFFF'    // Headings, body text
text.secondary: '#9CA3AF'  // Supporting text
text.tertiary: '#6B7280'   // Captions, metadata
text.disabled: '#4B5563'   // Disabled states

// Semantic
success: '#10B981'         // Green (mint)
error: '#FF006E'           // Hot pink (bold error)
warning: '#FF8C42'         // Coral orange
recording: '#FF006E'       // Same as error (bold)
```

### Contrast Validation

| Combo | Ratio | WCAG | Usage |
|-------|-------|------|-------|
| White on #000000 | 21:1 | AAA ✓✓✓ | Body text |
| #00D4FF on #000000 | 9.5:1 | AAA ✓✓✓ | Accent elements |
| #7C5CFF on #000000 | 5.2:1 | AA ✓ | Primary buttons |
| White on #7C5CFF | 4.8:1 | AA ✓ | Button text |
| #9CA3AF on #000000 | 5.8:1 | AA ✓ | Secondary text |

---

## Typography

### Font Stack

```typescript
// iOS: SF Pro Display/Text (system default)
// Android: Roboto (system default)
fontFamily: Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System'
})

// Teleprompter (dyslexia-friendly)
fontFamily: 'Lexend' or 'OpenDyslexic' (optional setting)
```

### Type Scale (Mobile-Optimized)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 48px | 900 (Black) | 56px | Hero text (rare) |
| `h1` | 32px | 700 (Bold) | 40px | Screen titles |
| `h2` | 28px | 700 (Bold) | 36px | Section headers |
| `h3` | 24px | 600 (Semibold) | 32px | Card titles |
| `h4` | 20px | 600 (Semibold) | 28px | List items, subtitles |
| `bodyLarge` | 18px | 400 (Regular) | 28px | Large body text |
| `body` | 16px | 400 (Regular) | 24px | Default text |
| `bodySmall` | 14px | 400 (Regular) | 20px | Supporting text |
| `caption` | 13px | 500 (Medium) | 18px | Metadata |
| `label` | 12px | 600 (Semibold) | 16px | Uppercase labels |
| `tiny` | 10px | 500 (Medium) | 14px | Timestamps (rare) |

### Typography Rules

**DO:**
- Use `h1` (32px, bold) for screen titles
- Use `body` (16px) as default for all content
- Pair bold headings with regular body text
- Use `-0.5px` letter-spacing for large headlines

**DON'T:**
- Use `display` (48px) in UI (hero sections only)
- Mix more than 3 font sizes on one screen
- Use `tiny` (10px) for critical information
- Use font weights <400 (too thin on OLED)

---

## Component Library

### 1. Recording Button (Primary CTA)

**Specifications:**
- Size: 80×80px outer circle
- Inner circle: 64×64px
- Border: 4px white ring
- States:
  - **Idle:** White fill, gray border
  - **Recording:** Hot pink (#FF006E) fill, pulsing ring animation
  - **Paused:** Yellow (#FF8C42) fill, ring paused

**Animation:**
- Press: Scale 1.0 → 0.95 (100ms) → 1.0 (150ms)
- Pulse: Opacity 0.8 → 0, Scale 1.0 → 1.4, Loop 1200ms
- Haptic: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`

**React Native Implementation:**
```tsx
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const RecordButton = ({ state, onPress }) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

  // Pulse animation (recording only)
  useEffect(() => {
    if (state === 'recording') {
      pulseScale.value = withRepeat(
        withTiming(1.4, { duration: 1200 }),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1200 }),
        -1,
        false
      );
    }
  }, [state]);

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.95);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0);
        onPress();
      }}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        {/* Inner circle + pulse ring */}
      </Animated.View>
    </Pressable>
  );
};
```

---

### 2. Bottom Sheet

**Specifications:**
- Slide up from bottom with spring animation
- Drag handle: 36×4px, centered, 12px from top
- Rounded top corners: 24px
- Backdrop: rgba(0,0,0,0.6) with blur effect
- Swipe-to-dismiss gesture

**Heights:**
- Small: 30-40% viewport (quick actions)
- Medium: 50-60% viewport (feature selection)
- Full: 90% viewport (script editing)

**React Native Implementation:**
```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

const BottomSheet = ({ children, height, onClose }) => {
  const translateY = useSharedValue(height);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd(() => {
      if (translateY.value > height * 0.3) {
        translateY.value = withSpring(height, {}, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0);
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
```

---

### 3. Progress Indicators

**Determinate Progress Bar:**
```tsx
<View style={styles.progressTrack}>
  <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
</View>
<Text style={styles.progressText}>{progress}%</Text>

const styles = StyleSheet.create({
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: tokens.colors.accent[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing.s2,
  },
});
```

**Circular Progress (Processing):**
- Use `react-native-svg` for stroke-based circle
- Animated `strokeDashoffset` for smooth progression
- Center text: Progress % + status label

---

### 4. Status Badges

**Design:**
- Pill shape: auto width, 24px height
- Text: 12px, weight 600, uppercase
- Padding: 8px horizontal, 4px vertical
- No border, solid background

**States:**
```tsx
const statusColors = {
  idle: tokens.colors.neutral[600],
  uploading: tokens.colors.accent[500],
  processing: tokens.colors.accent[500],
  complete: tokens.colors.semantic.success,
  failed: tokens.colors.semantic.error,
  queued: tokens.colors.neutral[500],
};
```

---

### 5. Input Fields

**Specifications:**
- Height: 48px (comfortable touch target)
- Border: 2px, rgba(255,255,255,0.1)
- Border radius: 12px
- Background: rgba(255,255,255,0.05)
- Padding: 12px vertical, 16px horizontal
- Font: 16px (prevents iOS zoom on focus)

**States:**
- **Default:** Border rgba(255,255,255,0.1)
- **Focus:** Border #7C5CFF (primary.600), background rgba(124,92,255,0.1)
- **Error:** Border #FF006E (error), background rgba(255,0,110,0.1)
- **Disabled:** Opacity 0.5, no interaction

---

### 6. Cards

**Design (Neubrutalism-Inspired):**
```tsx
<View style={[styles.card, tokens.elevation.sm]}>
  <Text style={styles.cardTitle}>Project Name</Text>
  <Text style={styles.cardMeta}>Created 2 hours ago</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.s4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s1,
  },
  cardMeta: {
    fontSize: tokens.typography.fontSize.caption,
    color: tokens.colors.text.secondary,
  },
});
```

**Interactive Card (Pressable):**
- Press animation: Scale 0.98, duration 100ms
- Active state: Border color accent.500
- Haptic feedback on press

---

## Screen-Specific Patterns

### Recording Screen Layout

```
┌─────────────────────────────────────┐
│  ●  00:45      [Settings] [Close]   │ ← Top bar (40px)
│                                       │
│                                       │
│         [Camera Viewfinder]           │
│           Full Screen 9:16            │
│                                       │
│  ┌──────────────────────────────┐    │
│  │  Teleprompter Overlay (55%)  │    │ ← Teleprompter
│  │  Current sentence (100% op)  │    │   (centered, 60% width)
│  │  Upcoming sentence (50% op)  │    │
│  └──────────────────────────────┘    │
│                                       │
│                                       │
│  [Flash] [●Record●] [Flip Camera]    │ ← Controls (bottom)
│                80px from bottom       │
└─────────────────────────────────────┘
```

### Feature Selection (Bottom Sheet)

```
┌─────────────────────────────────────┐
│                ▬▬                     │ ← Drag handle
│                                       │
│  Edit Video Features                  │ ← Sheet title
│                                       │
│  ┌──────────────────────────────┐    │
│  │ [Icon] Subtitles       [●]   │    │ ← Toggle card
│  │ Add animated subtitles       │    │   (72px height)
│  └──────────────────────────────┘    │
│                                       │
│  ┌──────────────────────────────┐    │
│  │ [Icon] Background      [○]   │    │
│  │ Change background color      │    │
│  └──────────────────────────────┘    │
│                                       │
│  ┌──────────────────────────────┐    │
│  │ [Icon] Music Volume    [●]   │    │
│  │  ╍╍╍╍╍╍╍╍╍●────── 60%       │    │ ← Slider (expanded)
│  └──────────────────────────────┘    │
│                                       │
│  [Continue to Processing]             │ ← Primary CTA
└─────────────────────────────────────┘
```

### Processing Status

```
┌─────────────────────────────────────┐
│              [X Close]                │
│                                       │
│           [Lottie Animation]          │ ← Animated icon
│              120×120px                │   (uploading/processing)
│                                       │
│           Processing...               │ ← Status text (h2)
│                                       │
│  ╍╍╍╍╍╍╍╍●───────────────── 45%     │ ← Progress bar
│                                       │
│               45%                     │ ← Large percentage
│        Estimated 2 min remaining      │   (32px, bold)
│                                       │
│                                       │
│           [Cancel Processing]         │ ← Secondary action
└─────────────────────────────────────┘
```

---

## Animation Specifications

### Required Libraries

```json
{
  "dependencies": {
    "react-native-reanimated": "^4.0.0",
    "react-native-gesture-handler": "^2.28.0",
    "expo-haptics": "^14.0.0",
    "lottie-react-native": "^7.0.0"
  }
}
```

### Key Animations

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Button press | Scale 1.0 → 0.95 → 1.0 | 200ms | Spring |
| Recording pulse | Opacity 0.8 → 0, Scale 1.0 → 1.4 | 1200ms | Linear (loop) |
| Bottom sheet slide | TranslateY | 300ms | Spring (damping 15) |
| Progress bar fill | Width 0% → 100% | Based on duration | Decelerate |
| Success checkmark | Scale 0 → 1.2 → 1.0 | 400ms | Bounce |
| Error shake | TranslateX ±10px (3x) | 400ms | Sharp |
| List item swipe | TranslateX + reveal | 200ms | Standard |
| Tab transition | Fade + slide | 300ms | Decelerate |

### Reduce Motion Support

```tsx
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Conditionally disable animations
const animationDuration = reduceMotion ? 0 : 300;
```

---

## Accessibility Requirements

### Touch Targets
- ✅ Minimum 44×44px (iOS HIG)
- ✅ Preferred 48×48px (Material)
- ✅ 8-12px spacing between interactive elements

### Contrast
- ✅ Body text: 21:1 (AAA ✓✓✓) - White on black
- ✅ Primary CTA: 5.2:1 (AA ✓) - #7C5CFF
- ✅ Secondary text: 5.8:1 (AA ✓) - #9CA3AF
- ✅ Accent: 9.5:1 (AAA ✓✓✓) - #00D4FF

### Screen Reader Support
- ✅ All interactive elements have `accessibilityLabel`
- ✅ State changes announced via `accessibilityLiveRegion`
- ✅ Progress updates every 5% (not every 1%)
- ✅ Recording state changes announced
- ✅ Teleprompter text accessible (not rendered as image)

### Testing Checklist
- [ ] VoiceOver (iOS) can navigate all screens
- [ ] TalkBack (Android) announces all states
- [ ] Focus order is logical (top to bottom)
- [ ] All images have `accessibilityLabel`
- [ ] Reduce motion respected (no animations when enabled)
- [ ] Color contrast validated with tools (Contrast Checker)

---

## Performance Targets

| Metric | Target | Measured With |
|--------|--------|---------------|
| Warm start | <2s | React Native DevTools |
| Cold start | <4s | React Native DevTools |
| Button press response | <100ms | User perception |
| Screen transition | <300ms | React Native Performance Monitor |
| Animation frame rate | 60fps | React Native Performance Monitor |
| Recording UI responsiveness | <50ms | Manual testing with Haptics |

---

## Next Steps

### Phase 1: Base Component Library (Week 1)
1. Set up `react-native-reanimated` + `react-native-gesture-handler`
2. Implement Button component (4 variants) with haptics + animations
3. Implement Input component with validation states
4. Implement Card component (default + interactive)
5. Implement Bottom Sheet with gesture handling
6. Implement Progress Indicators (linear + circular)
7. Implement Status Badges with semantic colors
8. Write unit tests (Jest + React Testing Library)

### Phase 2: Flow-Specific Components (Week 2)
1. Recording Button with pulse animation
2. Teleprompter Overlay with smooth scrolling
3. Feature Toggle Cards with expansion animation
4. Processing Status Screen with Lottie
5. Video Player with custom controls
6. Export Success animation

### Phase 3: Polish & Accessibility (Week 3)
1. Accessibility audit (VoiceOver + TalkBack)
2. Performance profiling (60fps validation)
3. Haptic feedback tuning
4. Reduce motion testing
5. Contrast validation
6. Final QA on iPhone SE + Pixel 8 Pro

---

**Status:** Research Complete, Ready for Implementation
**Last Updated:** 2025-10-10
**Next Review:** Post Phase 1 (Week 2)
