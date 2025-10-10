# Shorty.ai Design System

**Version:** 1.0.0
**Platform:** Dual (React Native Mobile + React Web)
**Status:** ✅ Foundation Complete | 🚧 Implementation In Progress

---

## Quick Start

### React Native (Mobile)

```tsx
import { tokens } from '@/design-system/tokens';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const MyButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.pressed,
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
  },
  text: {
    color: tokens.colors.text.onPrimary,
    fontSize: tokens.typography.fontSize.body,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});
```

### React Web

```tsx
import '@/design-system/tokens.css';

// CSS Module
.button {
  background-color: var(--color-primary-600);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-sm);
  min-height: var(--min-touch-target);
  color: var(--color-text-on-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-fast) var(--easing-standard);
}

.button:hover {
  background-color: var(--color-primary-700);
  box-shadow: var(--shadow-md);
}
```

---

## File Structure

```
src/design-system/
├── README.md                 # This file
├── tokens.json              # Design tokens (source of truth)
├── tokens.ts                # TypeScript exports + types
└── tokens.css               # CSS variables for web

Root documentation:
├── DESIGN_SYSTEM.md         # Comprehensive usage guide
├── COMPONENT_MAPPING.md     # Flow-specific component breakdown
├── PLAN.md                  # Implementation roadmap (2 weeks)
└── AUDIT_REPORT.md          # React Bits audit findings
```

---

## Design Tokens

### Colors

```typescript
// Primary (Violet) - Brand color
tokens.colors.primary[600]  // #7C5CFF (main CTA)
tokens.colors.primary[700]  // #6D28D9 (pressed state)

// Accent (Cyan) - Highlights
tokens.colors.accent[500]   // #06C1B0 (main accent)

// Neutral (Gray) - Surfaces, text
tokens.colors.neutral[900]  // #101114 (text primary)
tokens.colors.neutral[50]   // #F7F8FA (background)

// Semantic
tokens.colors.semantic.success  // #16A34A
tokens.colors.semantic.error    // #EF4444
tokens.colors.semantic.warning  // #F59E0B
tokens.colors.semantic.info     // #3B82F6
```

### Typography

```typescript
// Font Sizes
tokens.typography.fontSize.h1        // 40px (screen titles)
tokens.typography.fontSize.body      // 16px (default)
tokens.typography.fontSize.caption   // 12px (metadata)

// Weights
tokens.typography.fontWeight.regular   // 400
tokens.typography.fontWeight.semibold  // 600
tokens.typography.fontWeight.bold      // 700
```

### Spacing (4px base unit)

```typescript
tokens.spacing.s4   // 16px (default gap)
tokens.spacing.s6   // 24px (section padding)
tokens.spacing.s8   // 40px (screen margins)
```

### Border Radius

```typescript
tokens.radius.sm    // 8px (buttons, inputs)
tokens.radius.md    // 12px (cards, panels)
tokens.radius.full  // 9999px (circular avatars)
```

### Motion

```typescript
tokens.motion.duration.fast     // 200ms (button press)
tokens.motion.duration.normal   // 300ms (page transitions)
tokens.motion.easing.standard   // cubic-bezier(0.4, 0.0, 0.2, 1)
```

---

## Design Principles

### 1. Mobile-First
- Portrait 9:16 orientation
- Thumb-reachable interactions (bottom 20% of screen)
- 44×44px minimum touch targets

### 2. Bold Simplicity
- High contrast (WCAG AA minimum)
- Clear visual hierarchy
- Minimal decoration

### 3. No Gradients
- Solid colors only
- Depth via subtle shadows
- Layering with opacity

### 4. Accessible by Default
- WCAG AA contrast (4.5:1 normal, 3.0:1 large)
- AAA for critical CTAs (7.0:1)
- Visible focus states (2px ring)
- Motion sensitivity support

---

## Usage Rules

### DO ✅

```tsx
// Use tokens for all colors
backgroundColor: tokens.colors.primary[600]

// Use spacing scale
marginBottom: tokens.spacing.s4

// Use typography scale
fontSize: tokens.typography.fontSize.body

// Respect touch targets
minHeight: tokens.accessibility.minTouchTarget  // 44px
```

### DON'T ❌

```tsx
// No hardcoded colors
backgroundColor: '#7C5CFF'  // ❌ Use tokens.colors.primary[600]

// No magic numbers
marginBottom: 16  // ❌ Use tokens.spacing.s4

// No small touch targets
height: 32  // ❌ Use minHeight: tokens.accessibility.minTouchTarget

// No gradients
background: 'linear-gradient(...)'  // ❌ Use solid colors
```

---

## Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 normal, 3.0:1 large)
- [ ] Critical CTAs meet AAA (7.0:1)
- [ ] All interactive elements ≥44×44px
- [ ] Focus states visible (2px `border.focus`)
- [ ] Screen reader labels present
- [ ] Motion respects `prefers-reduced-motion`

---

## Platform Support

### React Native Mobile ✅
- **Primary platform**
- Custom components using `StyleSheet.create()`
- Native gestures (swipe, pinch, long-press)
- Platform-specific APIs (Camera, FileSystem, Sharing)

### React Web ⚠️
- **Secondary platform**
- CSS variables from `tokens.css`
- Selective React Bits integration (6 components)
- Gradient removal required

---

## Common Patterns

### Button (4 variants)

```tsx
// Primary (main CTA)
backgroundColor: tokens.colors.primary[600]
color: tokens.colors.text.onPrimary

// Secondary (alternative action)
backgroundColor: tokens.colors.neutral[200]
color: tokens.colors.text.primary

// Ghost (tertiary action)
backgroundColor: 'transparent'
color: tokens.colors.primary[600]

// Destructive (delete, cancel)
backgroundColor: tokens.colors.semantic.error
color: tokens.colors.text.onPrimary
```

### Card

```tsx
backgroundColor: tokens.colors.surface.card
borderRadius: tokens.radius.md
padding: tokens.spacing.s4
borderWidth: 1
borderColor: tokens.colors.border.subtle
...tokens.elevation.sm  // Subtle shadow
```

### Input

```tsx
// Default
backgroundColor: tokens.colors.neutral[100]
borderWidth: 1
borderColor: tokens.colors.border.default
borderRadius: tokens.radius.sm
paddingVertical: tokens.spacing.s3
paddingHorizontal: tokens.spacing.s4

// Focus
borderWidth: 2
borderColor: tokens.colors.border.focus
backgroundColor: tokens.colors.primary[50]

// Error
borderColor: tokens.colors.border.error
backgroundColor: tokens.colors.semantic.errorLight
```

---

## Implementation Status

### ✅ Complete (M1)
- [x] Design tokens (JSON, TS, CSS)
- [x] Documentation (DESIGN_SYSTEM.md, COMPONENT_MAPPING.md, PLAN.md)
- [x] React Bits audit (AUDIT_REPORT.md)

### 🚧 In Progress
- [ ] Base component library (Button, Input, Card, Modal, Badge) — M2
- [ ] Flow-specific components (6 core flows) — M3-M6
- [ ] React Bits integration (web) — M7
- [ ] Accessibility audit — M8

### 📅 Planned (Phase 2)
- [ ] Dark mode toggle
- [ ] Animation polish
- [ ] Web dashboard (React Bits heavy)

---

## Resources

- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) — Comprehensive usage guide
- [COMPONENT_MAPPING.md](../../COMPONENT_MAPPING.md) — Flow-specific components
- [PLAN.md](../../PLAN.md) — 2-week implementation roadmap
- [AUDIT_REPORT.md](../../AUDIT_REPORT.md) — React Bits audit findings

---

## Contributing

### Adding New Tokens
1. Update `tokens.json` (source of truth)
2. Regenerate TypeScript types in `tokens.ts`
3. Add CSS variables in `tokens.css`
4. Update documentation in `DESIGN_SYSTEM.md`
5. Run accessibility checks (contrast, touch targets)

### Testing New Components
1. Write unit tests (Jest + React Testing Library)
2. Test on mobile (iPhone SE, Pixel 8 Pro)
3. Test on web (Chrome, Safari, Firefox)
4. Run accessibility audit (axe DevTools, VoiceOver, TalkBack)
5. Add Storybook story (web build)

---

## Support

**Questions?** Check [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) first
**Bug Reports?** Open an issue with label `design-system`
**Design Review?** Tag design team in PR

---

**Last Updated:** 2025-10-10
**Maintained By:** Shorty.ai Design Team
**Status:** Foundation complete, implementation in progress
