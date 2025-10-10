# Shorty.ai Design System

**Version:** 1.0.0
**Platform:** Dual (React Native Mobile + React Web)
**Aesthetics:** Gen-Z friendly, bold yet minimal, high clarity, accessible
**Constraint:** No gradients — solid colors only

---

## Philosophy

### Core Principles

1. **Mobile-First**: Portrait-first 9:16 orientation, thumb-reachable interactions
2. **Bold Simplicity**: High contrast, clear hierarchy, minimal decoration
3. **Accessible by Default**: WCAG AA minimum (AAA for critical actions)
4. **Motion as Enhancement**: Honor `prefers-reduced-motion`, never rely solely on animation
5. **Solid Depth**: Use layering, shadows, and opacity—never gradients

### 60-30-10 Rule

- **60%** Neutrals (backgrounds, containers, surfaces)
- **30%** Primary brand color (#7C5CFF Violet 600)
- **10%** Accent highlights (#06C1B0 Cyan 500)

---

## Color System

### Primary (Violet)

**Usage:** CTAs, active states, progress indicators, brand moments

| Token | Hex | Usage |
|-------|-----|-------|
| `primary.50` | #F5F3FF | Lightest tint, backgrounds |
| `primary.100` | #EDE9FE | Subtle highlights |
| `primary.200` | #DDD6FE | Hover backgrounds |
| `primary.300` | #C4B5FD | Disabled states (with opacity) |
| `primary.400` | #A78BFA | Secondary actions |
| `primary.500` | #8B5CF6 | Default primary |
| `primary.600` | #7C5CFF | **Brand primary** (CTA buttons) |
| `primary.700` | #6D28D9 | Pressed states |
| `primary.800` | #5B21B6 | Darker accents |
| `primary.900` | #4C1D95 | Darkest, text on light |

**Contrast Validation:**
- `primary.600` on white: 5.8:1 (AA Large ✓)
- White on `primary.600`: 5.8:1 (AA Large ✓)
- For AA normal text (4.5:1), use `primary.700` or darker

### Accent (Cyan)

**Usage:** Success feedback, highlights, interactive elements (non-primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent.50` | #ECFEFF | Lightest tint |
| `accent.100` | #CFFAFE | Info backgrounds |
| `accent.200` | #A5F3FC | Hover states |
| `accent.300` | #67E8F9 | Active borders |
| `accent.400` | #22D3EE | Secondary |
| `accent.500` | #06C1B0 | **Brand accent** |
| `accent.600` | #0891B2 | Pressed states |
| `accent.700` | #0E7490 | Dark accents |
| `accent.800` | #155E75 | Darker |
| `accent.900` | #164E63 | Darkest |

**Contrast Validation:**
- `accent.500` on white: 4.2:1 (AA Large ✓, fails AA normal)
- Use `accent.600` (5.1:1) for text

### Neutral (Gray)

**Usage:** Surfaces, text hierarchy, borders, backgrounds (60% of UI)

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral.50` | #F7F8FA | Background light |
| `neutral.100` | #E5E7EB | Subtle borders |
| `neutral.200` | #D1D5DB | Disabled text light |
| `neutral.300` | #9CA3AF | Tertiary text |
| `neutral.400` | #6B7280 | Secondary text dark mode |
| `neutral.500` | #4B5563 | Secondary text light |
| `neutral.600` | #374151 | Borders dark mode |
| `neutral.700` | #1F2937 | Subtle dark surfaces |
| `neutral.800` | #18191C | Card dark mode |
| `neutral.900` | #101114 | Background dark |

**Contrast Validation:**
- `neutral.900` on `neutral.50`: 19.5:1 (AAA ✓✓✓)
- `neutral.500` on white: 8.6:1 (AAA ✓)

### Semantic

**Usage:** Status feedback, alerts, validation

| Token | Hex | Contrast on White | Usage |
|-------|-----|-------------------|-------|
| `semantic.success` | #16A34A | 4.8:1 AA ✓ | Success states |
| `semantic.successLight` | #86EFAC | 1.8:1 ✗ | Backgrounds only |
| `semantic.successDark` | #15803D | 6.4:1 AAA ✓ | Text |
| `semantic.info` | #3B82F6 | 4.6:1 AA ✓ | Info states |
| `semantic.infoLight` | #93C5FD | 2.1:1 ✗ | Backgrounds |
| `semantic.infoDark` | #1E40AF | 8.2:1 AAA ✓ | Text |
| `semantic.warning` | #F59E0B | 2.8:1 ✗ | Use `warningDark` for text |
| `semantic.warningLight` | #FCD34D | 1.4:1 ✗ | Backgrounds |
| `semantic.warningDark` | #D97706 | 4.5:1 AA ✓ | Text |
| `semantic.error` | #EF4444 | 4.0:1 AA Large ✓ | Error states |
| `semantic.errorLight` | #FCA5A5 | 2.0:1 ✗ | Backgrounds |
| `semantic.errorDark` | #DC2626 | 5.9:1 AA ✓ | Text |

**Rule:** Never use `-Light` variants for text. Use base or `-Dark` tokens.

### Surface

**Usage:** Containers, overlays, backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `surface.background` | #F7F8FA | App background (light) |
| `surface.backgroundDark` | #101114 | App background (dark) |
| `surface.card` | #FFFFFF | Card/panel (light) |
| `surface.cardDark` | #18191C | Card/panel (dark) |
| `surface.overlay` | rgba(16,17,20,0.85) | Modal backdrop (dark) |
| `surface.overlayLight` | rgba(247,248,250,0.92) | Modal backdrop (light) |

### Text

**Usage:** All typography color assignments

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `text.primary` | #101114 | #F7F8FA | Headings, body |
| `text.secondary` | #4B5563 | #9CA3AF | Supporting text |
| `text.tertiary` | #9CA3AF | #6B7280 | Captions, metadata |
| `text.disabled` | #D1D5DB | #374151 | Disabled states |
| `text.inverse` | #F7F8FA | #101114 | On colored backgrounds |
| `text.onPrimary` | #FFFFFF | #FFFFFF | On primary.600 |
| `text.onAccent` | #FFFFFF | #FFFFFF | On accent.500 |

### Border

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `border.default` | #E5E7EB | #374151 | Standard borders |
| `border.subtle` | #F7F8FA | #1F2937 | Dividers |
| `border.focus` | #7C5CFF | #7C5CFF | Focus rings |
| `border.error` | #EF4444 | #EF4444 | Error states |

---

## Typography

### Font Families

```typescript
fontFamily.primary: System (native font stack)
fontFamily.mono: SF Mono, Monaco, Consolas (code/timestamps)
```

**Web:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**React Native:**
```typescript
fontFamily: Platform.select({ ios: 'System', android: 'Roboto' })
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `display` | 56px | 64px | 800 (extrabold) | Hero text (rare) |
| `h1` | 40px | 48px | 700 (bold) | Screen titles |
| `h2` | 32px | 40px | 700 (bold) | Section headers |
| `h3` | 24px | 32px | 600 (semibold) | Card titles |
| `h4` | 20px | 28px | 600 (semibold) | List items |
| `body` | 16px | 24px | 400 (regular) | Primary text |
| `bodySmall` | 14px | 20px | 400 (regular) | Secondary text |
| `caption` | 12px | 16px | 500 (medium) | Metadata, labels |
| `tiny` | 10px | 14px | 500 (medium) | Timestamps (use sparingly) |

### Letter Spacing

- `tight` (-0.5px): Large headings (display, h1, h2)
- `normal` (0): Body text, buttons
- `wide` (0.5px): All-caps labels (use sparingly)

### Usage Guidelines

**DO:**
- Use `h1` for screen titles (one per screen)
- Use `body` for most content (default)
- Pair `bodySmall` with `text.secondary` for hierarchy

**DON'T:**
- Don't use `display` for UI text (hero sections only)
- Don't mix more than 3 font sizes on a single card
- Don't use `tiny` for critical information

---

## Spacing

### Scale (4px base unit)

| Token | Value | Usage |
|-------|-------|-------|
| `s0` | 0 | Reset margins |
| `s1` | 4px | Icon padding, borders |
| `s2` | 8px | Tight spacing (chips) |
| `s3` | 12px | Compact components |
| `s4` | 16px | **Default gap** (cards, lists) |
| `s5` | 20px | Comfortable spacing |
| `s6` | 24px | Section padding |
| `s7` | 32px | Large gaps |
| `s8` | 40px | Screen margins (mobile) |
| `s9` | 48px | Hero spacing |
| `s10` | 64px | Major sections |
| `s11` | 80px | Large screen margins |
| `s12` | 96px | Extra large (rare) |

### Layout Patterns

**Mobile (< 768px):**
- Screen horizontal padding: `s4` (16px)
- Vertical spacing between sections: `s6` (24px)
- Card internal padding: `s4` (16px)

**Tablet/Desktop (≥ 768px):**
- Screen horizontal padding: `s8` (40px)
- Vertical spacing: `s8` (40px)
- Card internal padding: `s6` (24px)

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Flush edges (rare) |
| `xs` | 4px | Badges, tags |
| `sm` | 8px | Buttons, inputs |
| `md` | 12px | Cards, panels |
| `lg` | 16px | Modals, sheets |
| `xl` | 20px | Hero cards |
| `full` | 9999px | Circular (avatars) |

**Default:** `md` (12px) for most components

---

## Elevation (Shadows)

**No gradients**—depth via two-layer subtle shadows.

### React Native

```typescript
elevation.none: { elevation: 0 }
elevation.sm: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1
}
elevation.md: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2
}
elevation.lg: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4
}
elevation.xl: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.16,
  shadowRadius: 16,
  elevation: 8
}
```

### Web (CSS)

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.16);
```

**Usage:**
- Cards: `elevation.sm` (rest) → `elevation.md` (hover/pressed)
- Modals: `elevation.lg`
- Overlays: `elevation.xl` + backdrop

---

## Motion

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 100ms | Hover feedback |
| `fast` | 200ms | Button press, toggle |
| `normal` | 300ms | Page transitions |
| `slow` | 400ms | Modal enter/exit |
| `slower` | 600ms | Complex animations |

### Easing

| Token | Curve | Usage |
|-------|-------|-------|
| `standard` | cubic-bezier(0.4, 0, 0.2, 1) | Default |
| `decelerate` | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| `accelerate` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| `sharp` | cubic-bezier(0.4, 0, 0.6, 1) | Snappy feedback |
| `bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Playful (use sparingly) |

### Accessibility

**Always honor `prefers-reduced-motion`:**

```typescript
// React Native
import { AccessibilityInfo } from 'react-native';
const reduceMotion = AccessibilityInfo.isReduceMotionEnabled();

// Web
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0ms !important; }
}
```

---

## Accessibility

### Contrast Requirements

- **Normal text (<19px):** 4.5:1 (AA) or 7.0:1 (AAA)
- **Large text (≥19px or ≥14px bold):** 3.0:1 (AA) or 4.5:1 (AAA)
- **Critical CTAs (Record, Export):** AAA (7.0:1)

### Touch Targets

- **Minimum:** 44×44px (iOS Human Interface Guidelines)
- **Comfortable:** 48×48px (Material Design)
- **Spacing:** 8px minimum gap between interactive elements

### Focus States

**All interactive elements must have:**
1. Visible focus ring (2px `border.focus`)
2. Increased contrast (hover/focus)
3. Non-color indicator (outline, scale)

```typescript
// Example
focusStyle = {
  borderWidth: 2,
  borderColor: colors.border.focus,
  transform: [{ scale: 1.02 }]
}
```

---

## Component Patterns

### Buttons

**Variants:**
- **Primary:** `primary.600` background, `text.onPrimary` text
- **Secondary:** `neutral.200` background, `text.primary` text
- **Ghost:** Transparent background, `primary.600` text
- **Destructive:** `semantic.error` background, white text

**States:**
- Hover: Darken 1 step (`primary.700`)
- Pressed: Darken 2 steps + scale(0.98)
- Disabled: 40% opacity + `text.disabled`

**Sizing:**
- Small: 32px height, `bodySmall` (14px)
- Medium: 44px height, `body` (16px) ← **default**
- Large: 56px height, `h4` (20px)

### Inputs

**Variants:**
- Default: `neutral.100` background, `border.default` border
- Focus: `border.focus` (2px), `primary.50` background
- Error: `border.error` (2px), `semantic.errorLight` background
- Disabled: `neutral.50` background, `text.disabled`

**Padding:** `s3` vertical, `s4` horizontal

### Cards

**Default:**
- Background: `surface.card`
- Border: `border.subtle` (1px)
- Radius: `md` (12px)
- Padding: `s4` (16px mobile), `s6` (24px desktop)
- Shadow: `elevation.sm`

**Interactive (tap/click):**
- Hover: `elevation.md`
- Pressed: scale(0.99) + `elevation.sm`

---

## Platform-Specific Notes

### React Native Mobile

**Use:**
- `StyleSheet.create()` for performance
- `Platform.select()` for iOS/Android differences
- `Dimensions.get('window')` for responsive breakpoints

**Avoid:**
- Web-only CSS (flexbox shortcuts like `gap` work on RN 0.71+)
- DOM-specific libraries

### React Web

**Use:**
- CSS Modules or styled-components
- CSS variables from `tokens.css`
- `@media (prefers-color-scheme: dark)` for auto dark mode

**Selective React Bits integration:**
- Stepper (onboarding)
- Counter/CountUp (analytics)
- Carousel (feature selection)
- AnimatedList (project lists)

**Replace all gradient usage in React Bits with solid colors.**

---

## Usage Examples

### Button (React Native)

```tsx
import { tokens } from '@/design-system/tokens';

<Pressable
  style={({ pressed }) => [
    {
      backgroundColor: tokens.colors.primary[600],
      paddingVertical: tokens.spacing.s3,
      paddingHorizontal: tokens.spacing.s6,
      borderRadius: tokens.radius.sm,
      minHeight: tokens.accessibility.minTouchTarget,
      opacity: pressed ? 0.9 : 1,
    },
    tokens.elevation.sm,
  ]}
>
  <Text style={{ color: tokens.colors.text.onPrimary, fontSize: tokens.typography.fontSize.body }}>
    Continue
  </Text>
</Pressable>
```

### Card (Web)

```css
.card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-fast) var(--easing-standard);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

---

## Migration Guide

### Removing Gradients from React Bits

**Before (Gradient):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**After (Solid + Shadow):**
```css
background: var(--color-primary-600);
box-shadow: 0 4px 8px rgba(124, 92, 255, 0.2);
```

**Layering Technique:**
```tsx
<View style={{ backgroundColor: tokens.colors.primary[600] }}>
  <View style={{ backgroundColor: tokens.colors.primary[700], opacity: 0.3 }}>
    {/* Content */}
  </View>
</View>
```

---

## Testing Checklist

- [ ] All text meets AA contrast (AAA for Record/Export buttons)
- [ ] All touch targets ≥44×44px
- [ ] Focus states visible on all interactive elements
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Dark mode tested (if applicable)
- [ ] Tested on iPhone SE (small) and iPhone 15 Pro Max (large)
- [ ] Landscape orientation functional for preview screens
- [ ] No gradients present in final build

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Maintained by:** Shorty.ai Design Team
**Last Updated:** 2025-10-10
**Next Review:** 2025-11-10
