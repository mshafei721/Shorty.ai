# Component Mapping Matrix

**Platform Strategy:** Dual design system (React Native mobile primary + React Web selective)

---

## Overview

| Flow | RN Mobile Components | React Bits Web (Selective) | Custom Required |
|------|---------------------|---------------------------|-----------------|
| Onboarding | Custom | Stepper | Niche selector, step indicator |
| Script Studio | Custom | AnimatedList | AI generation form, word counter |
| Recording | Custom | — | Camera controls, teleprompter, timer |
| Feature Selection | Custom | Carousel (adapted) | Toggle grid, preset selector |
| Processing | Custom | Counter/CountUp | Progress bar, status machine UI |
| Preview/Export | Custom | — | Video player, share sheet |

---

## Flow 1: Onboarding (Niche Selection → Sub-niche)

### Screens
1. **SplashScreen** → [NicheSelectionScreen.tsx:1](src/screens/NicheSelectionScreen.tsx)
2. **NicheSelectionScreen** → Sub-niche confirmation modal

### Components Needed

#### Mobile (React Native)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **StepIndicator** | `primary.600`, `neutral.200` | Active/complete/inactive | ARIA labels, focus |
| **NicheCard** | `surface.card`, `elevation.sm`, `radius.md` | Default/hover/selected | Min 44px, focus ring |
| **SubNicheSheet** | `surface.overlay`, `elevation.xl`, `radius.lg` | Visible/hidden | Dismiss gesture, ESC |
| **PrimaryButton** | `primary.600`, `text.onPrimary`, `radius.sm` | Rest/pressed/disabled | AAA contrast (7:1) |

#### Web (React Bits)
| Component | Source | Adaptation Required |
|-----------|--------|---------------------|
| **Stepper** | [react-bits/components/stepper] | Replace gradients with `primary.600` solid, map step states to tokens |

**Composition:**
```tsx
// Mobile
<StepIndicator steps={3} current={1} />
<ScrollView>
  {niches.map(n => <NicheCard key={n.id} {...n} />)}
</ScrollView>
<SubNicheSheet visible={selected !== null} />

// Web
<Stepper steps={['Niche', 'Sub-niche', 'Setup']} active={0} />
<NicheGrid>{niches.map(...)}</NicheGrid>
```

---

## Flow 2: Script Studio (AI Generation + Manual Paste)

### Screens
1. **ScriptStudioWrapper** → [ScriptStudioWrapper.tsx:1](src/features/scripting/screens/ScriptStudioWrapper.tsx)
2. **PasteScriptScreen** → [PasteScriptScreen.tsx:1](src/screens/PasteScriptScreen.tsx)

### Components Needed

#### Mobile (React Native)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **AIPromptForm** | `surface.card`, `border.default`, `spacing.s4` | Empty/filling/generating | Clear labels, validation |
| **ScriptEditor** | `body` font, `neutral.900` text, `neutral.100` bg | Editing/readonly | Word count live region |
| **WordCounter** | `caption`, `text.secondary` | Under/valid/over | Announce limits |
| **EstimateBadge** | `accent.100` bg, `accent.700` text, `radius.xs` | N/A | Duration estimate |

#### Web (React Bits)
| Component | Source | Adaptation Required |
|-----------|--------|---------------------|
| **AnimatedList** | [react-bits/animations/animated-list] | Use for script history/versions list; replace item animations with `motion.normal` duration |

**Composition:**
```tsx
// Mobile
<TabView tabs={['AI Generate', 'Paste']}>
  <AIPromptForm onGenerate={...} />
  <ScriptEditor value={script} onChange={...} />
</TabView>
<WordCounter words={120} min={20} max={250} />
<EstimateBadge duration={estimatedDuration} />

// Web
<AnimatedList items={scriptHistory} renderItem={ScriptCard} />
```

---

## Flow 3: Recording + Teleprompter

### Screens
1. **RecordScreen** → [RecordScreen.tsx:1](src/screens/RecordScreen.tsx)
2. **TeleprompterRehearsalScreen** → [TeleprompterRehearsalScreen.tsx:1](src/screens/TeleprompterRehearsalScreen.tsx)

### Components Needed

#### Mobile (React Native ONLY)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **CameraPreview** | Full-screen, `surface.backgroundDark` | Idle/countdown/recording/paused | Announce state changes |
| **RecordButton** | `semantic.error` (recording), 72px circular, `elevation.md` | Idle/recording/paused | AAA contrast, haptic feedback |
| **TeleprompterOverlay** | `surface.overlay` (55% opacity), `text.inverse` | Hidden/paused/scrolling | WPM controls, font size |
| **TimerDisplay** | `h2`, `text.inverse`, monospace | Counting | Live region (minutes:seconds) |
| **ControlBar** | `surface.cardDark`, `elevation.lg`, bottom-aligned | Visible/hidden | Thumb-reachable (bottom 20%) |

#### Web
**Not applicable** — recording is mobile-only. Web preview shows uploaded videos.

**Composition:**
```tsx
// Mobile
<View style={{ flex: 1 }}>
  <CameraPreview ref={cameraRef} />
  {teleprompterVisible && (
    <TeleprompterOverlay
      script={script}
      wpm={wpm}
      isScrolling={isRecording}
    />
  )}
  <TimerDisplay seconds={recordingDuration} />
  <ControlBar>
    <RecordButton state={recordingState} onPress={handleRecord} />
    <TeleprompterToggle />
  </ControlBar>
</View>
```

---

## Flow 4: Feature Selection (M3)

### Screens
1. **FeaturesScreen** → [FeaturesScreen.tsx:1](src/features/m3/screens/FeaturesScreen.tsx)

### Components Needed

#### Mobile (React Native)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **FeatureToggleCard** | `surface.card`, `elevation.sm`, `radius.md` | Off/on | Role="switch", labeled |
| **PresetCarousel** | `spacing.s4` gap, `neutral.100` indicators | Swipeable | Announce page X of Y |
| **VolumeSlider** | `primary.600` track, `accent.500` thumb | Interactive | Value announce |
| **PreviewThumbnail** | 16:9 ratio, `radius.sm`, `elevation.sm` | Loading/ready | Alt text |

#### Web (React Bits)
| Component | Source | Adaptation Required |
|-----------|--------|---------------------|
| **Carousel** | [react-bits/components/carousel] | Replace gradients with solid `neutral.100` borders; use `primary.600` active indicator |
| **ElasticSlider** | [react-bits/components/elastic-slider] | Map colors to `accent.500` (thumb), `neutral.200` (track) |

**Composition:**
```tsx
// Mobile
<ScrollView>
  <FeatureToggleCard
    title="Subtitles"
    enabled={features.subtitles}
    onToggle={...}
  />
  <PresetCarousel
    items={backgroundPresets}
    selected={features.backgroundChange.presetId}
    onSelect={...}
  />
  <VolumeSlider value={features.backgroundMusic.volume} />
</ScrollView>

// Web
<Carousel items={presets} activeIndex={selectedIndex} />
<ElasticSlider min={0} max={100} value={volume} />
```

---

## Flow 5: Processing Status

### Screens
1. **ProcessingStatusScreen** → [ProcessingStatusScreen.tsx:1](src/features/m3/screens/ProcessingStatusScreen.tsx)
2. **ProcessingScreen** → [ProcessingScreen.tsx:1](src/screens/ProcessingScreen.tsx)

### Components Needed

#### Mobile (React Native)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **ProgressBar** | `primary.600` fill, `neutral.200` track, `radius.xs` | 0-100% | Live region (progress %) |
| **StatusMachineBadge** | Semantic colors (info/warning/error), `radius.xs` | Idle/uploading/processing/complete/failed | Status announce |
| **RetryButton** | `semantic.warning`, `text.onPrimary`, `radius.sm` | Enabled/disabled | Error context |
| **CancelButton** | `neutral.400`, `text.secondary`, ghost variant | Enabled/loading | Confirm dialog |

#### Web (React Bits)
| Component | Source | Adaptation Required |
|-----------|--------|---------------------|
| **Counter** | [react-bits/components/counter] | Use for progress percentage display (0→100); replace animation with `motion.fast` |
| **CountUp** | [react-bits/animations/count-up] | Use for processing time elapsed |

**Composition:**
```tsx
// Mobile
<View style={{ padding: spacing.s6 }}>
  <StatusMachineBadge status={job.status} />
  <ProgressBar progress={job.progress} />
  <Text>{job.progress}% complete</Text>
  <CountUpTimer startedAt={job.startedAt} />
  {job.status === 'failed' && <RetryButton onPress={retryJob} />}
  <CancelButton onPress={cancelJob} />
</View>

// Web
<Counter from={0} to={progress} duration={500} />
<CountUp end={elapsedSeconds} />
```

---

## Flow 6: Preview + Export

### Screens
1. **PreviewScreen** → [PreviewScreen.tsx:1](src/features/m3/screens/PreviewScreen.tsx)
2. **ExportPanel** → [ExportPanel.tsx:1](src/features/export/components/ExportPanel.tsx)

### Components Needed

#### Mobile (React Native)
| Component | Token Usage | State | Accessibility |
|-----------|-------------|-------|---------------|
| **VideoPlayer** | Full-screen, native controls, `surface.backgroundDark` | Playing/paused/ended | Media session API |
| **ExportButton** | `primary.600`, 56px height (large), `elevation.md` | Ready/exporting/complete | AAA contrast |
| **ShareSheet** | Native `Sharing.shareAsync()` | N/A | iOS/Android share |
| **ExportStatusToast** | `semantic.success` bg, `text.onPrimary`, `elevation.lg` | Visible 3s | Announce success |

#### Web
**VideoPlayer** (HTML5 `<video>`) with custom controls styled per design system.

**Composition:**
```tsx
// Mobile
<View style={{ flex: 1 }}>
  <VideoPlayer
    source={{ uri: processedVideoUri }}
    controls
    style={{ flex: 1 }}
  />
  <View style={{ padding: spacing.s4 }}>
    <ExportButton onPress={handleExport} size="large" />
  </View>
</View>
{showToast && <ExportStatusToast message="Exported successfully!" />}

// Web
<video controls src={videoUrl} style={{ borderRadius: tokens.radius.md }} />
<button className="export-button">Export</button>
```

---

## Shared Primitives (Cross-Platform)

### Base Components

| Component | RN Implementation | Web Implementation | Tokens |
|-----------|-------------------|-------------------|--------|
| **Button** | `Pressable` + styles | `<button>` + CSS | `primary.600`, `radius.sm`, `spacing.s3/s6` |
| **Input** | `TextInput` | `<input>` | `neutral.100` bg, `border.default`, `spacing.s3/s4` |
| **Card** | `View` + shadow | `<div>` + box-shadow | `surface.card`, `elevation.sm`, `radius.md` |
| **Badge** | `View` + Text | `<span>` | `accent.100` bg, `radius.xs` |
| **Modal** | RN `Modal` + backdrop | Portal + CSS overlay | `surface.overlay`, `elevation.xl` |
| **Toast** | Custom positioned `View` | `<div>` fixed | `semantic.*`, `elevation.lg`, auto-dismiss |

---

## React Bits Selective Integration (Web Only)

### Approved Components

| Component | Status | Gradient Removal Required | Priority |
|-----------|--------|---------------------------|----------|
| **Stepper** | ✅ Use | Yes (replace with `primary.600` solid) | High |
| **AnimatedList** | ✅ Use | No (CSS animations only) | Medium |
| **Carousel** | ✅ Use | Yes (indicators + backgrounds) | Medium |
| **ElasticSlider** | ✅ Use | Yes (thumb + track) | Low |
| **Counter** | ✅ Use | No | Medium |
| **CountUp** | ✅ Use | No | Medium |

### Rejected Components

| Component | Reason |
|-----------|--------|
| All backgrounds | Gradient-heavy, not mobile-compatible |
| 3D components | Performance concerns, not Gen-Z aesthetic |
| Cursor effects | Desktop-only, not mobile-relevant |
| Parallax | Motion-heavy, accessibility concerns |

---

## Usage Patterns

### Example: Primary Button (RN)

```tsx
import { tokens } from '@/design-system/tokens';
import { Pressable, Text, StyleSheet } from 'react-native';

export const PrimaryButton = ({ title, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
  >
    <Text style={styles.text}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.colors.primary[600],
    paddingVertical: tokens.spacing.s3,
    paddingHorizontal: tokens.spacing.s6,
    borderRadius: tokens.radius.sm,
    minHeight: tokens.accessibility.minTouchTarget,
    ...tokens.elevation.sm,
  },
  pressed: {
    backgroundColor: tokens.colors.primary[700],
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: tokens.colors.text.onPrimary,
    fontSize: tokens.typography.fontSize.body,
    fontWeight: tokens.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
```

### Example: Feature Card (RN)

```tsx
<View style={[styles.card, tokens.elevation.sm]}>
  <View style={styles.header}>
    <Text style={styles.title}>Subtitles</Text>
    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{
        false: tokens.colors.neutral[200],
        true: tokens.colors.primary[600],
      }}
      thumbColor={tokens.colors.surface.card}
    />
  </View>
  <Text style={styles.description}>
    Add animated subtitles with word-level timing
  </Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.s4,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.s2,
  },
  title: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  description: {
    fontSize: tokens.typography.fontSize.bodySmall,
    color: tokens.colors.text.secondary,
    lineHeight: tokens.typography.lineHeight.bodySmall,
  },
});
```

---

## Accessibility Checklist (Per Component)

- [ ] All interactive elements ≥44×44px
- [ ] Focus states visible (2px `border.focus`)
- [ ] Color contrast meets AA (AAA for CTAs)
- [ ] Labels present for screen readers
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Touch targets spaced ≥8px apart
- [ ] State changes announced (loading, success, error)

---

## Next Steps

1. **Create base component library** (`src/components/design-system/`)
2. **Theme React Bits components** (web build only, `src/components/react-bits-themed/`)
3. **Compose screen-specific components** (flows 1-6 above)
4. **Write Storybook stories** (web) or component tests (RN)
5. **Accessibility audit** with axe DevTools (web) and iOS Accessibility Inspector (mobile)

---

**Maintained by:** Shorty.ai Design Team
**Last Updated:** 2025-10-10
**Next Review:** 2025-11-10
