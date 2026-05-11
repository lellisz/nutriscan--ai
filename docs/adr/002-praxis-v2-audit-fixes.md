# ADR-002: PRAXIS v2 Accessibility and UI Audit Fixes

**Status:** Accepted  
**Date:** 2026-05-10  
**Authors:** Architect Agent  

---

## Overview

This ADR documents decisions for fixing accessibility and UI issues identified in the PRAXIS v2 audit: color contrast violations, CSS linear-gradient usage, and insufficient touch targets.

---

## ADR-002.1: Color Contrast WCAG AA Compliance

### Context

Current secondary text color `W4 (#706C84)` fails WCAG AA contrast requirements against dark backgrounds. Minimum contrast ratio for normal text is 4.5:1.

**Current State:**
- `W4 = #706C84` on `#1A1A2E` background = ~3.2:1 contrast (FAIL)

### Decision

Update design token `W4` from `#706C84` to `#8C8AA0`.

**New State:**
- `W4 = #8C8AA0` on `#1A1A2E` background = ~4.7:1 contrast (PASS)

**Implementation:**
```typescript
// tailwind.config.js or NativeWind theme
const colors = {
  // ...existing colors
  W4: '#8C8AA0', // was #706C84
};
```

### Alternatives Considered

1. **Increase font size** - Would require 3:1 ratio for large text, but affects layout
2. **Lighten background** - Changes brand identity significantly
3. **Use W3 instead** - Too bright, loses visual hierarchy

### Consequences

- All secondary text becomes slightly more visible
- Minimal visual change (subtle lightening)
- Affects all components using W4 token
- Must update Figma design system to match

### Files to Modify

```
tailwind.config.js (or constants/colors.ts)
```

---

## ADR-002.2: LinearGradient Component Migration

### Context

Some components use CSS `linear-gradient()` string syntax which is not supported in React Native. This causes silent failures or crashes on native platforms.

**Problematic Pattern:**
```tsx
// BAD - CSS string, doesn't work in RN
<View style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #2D2D44 100%)' }} />
```

### Decision

Replace all CSS gradient strings with `expo-linear-gradient` component.

**Correct Pattern:**
```tsx
// GOOD - expo-linear-gradient component
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#1A1A2E', '#2D2D44']}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.container}
>
  {children}
</LinearGradient>
```

### Alternatives Considered

1. **react-native-linear-gradient** - Requires native linking, expo-linear-gradient is drop-in
2. **SVG gradients** - More complex, worse performance
3. **Image backgrounds** - Not responsive, larger bundle size

### Consequences

- Need to audit all components for CSS gradient usage
- Slight refactor where gradients wrap content
- Better performance (native implementation)
- Consistent cross-platform rendering

### Migration Pattern

```tsx
// Before
<View style={{ background: 'linear-gradient(...)' }}>
  <Content />
</View>

// After
<LinearGradient colors={['#color1', '#color2']} style={viewStyle}>
  <Content />
</LinearGradient>
```

### Files to Audit

```
components/**/*.tsx
app/**/*.tsx
```

Use grep pattern: `linear-gradient\(` or `background:.*gradient`

---

## ADR-002.3: Touch Target Minimum Size

### Context

WCAG 2.1 and platform guidelines (Apple HIG, Material Design) require minimum touch target sizes:
- **WCAG AAA:** 44x44 CSS pixels
- **Apple HIG:** 44x44 points
- **Material:** 48x48 dp

Current audit found several buttons and interactive elements below this threshold.

### Decision

Enforce minimum 44x44 pixel touch targets on all interactive elements.

**Implementation Strategy:**

1. **Add hitSlop where visual size must remain small:**
```tsx
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  style={{ width: 24, height: 24 }}
>
  <Icon />
</TouchableOpacity>
```

2. **Increase actual size where layout allows:**
```tsx
// Buttons, list items, form inputs
<Pressable style={{ minHeight: 44, minWidth: 44, padding: 12 }}>
  {children}
</Pressable>
```

3. **Create shared constants:**
```typescript
// constants/accessibility.ts
export const TOUCH_TARGET = {
  MIN_SIZE: 44,
  MIN_SPACING: 8, // between adjacent targets
} as const;
```

### Alternatives Considered

1. **hitSlop everywhere** - Invisible hit areas can overlap, causing wrong-target taps
2. **Ignore on small screens** - Accessibility regression, not acceptable
3. **48px minimum (Material)** - Harder to fit in dense UIs, 44px is sufficient

### Consequences

- Some UI elements will be slightly larger
- Better accessibility score
- Reduced mis-taps for users with motor impairments
- Need to audit all Pressable/TouchableOpacity components

### Components to Audit

Priority order:
1. Navigation buttons (back, close, menu)
2. Form inputs and toggles
3. List item actions (edit, delete)
4. Icon-only buttons
5. Tab bar items

### Validation

Create a dev-only overlay to visualize touch targets:

```typescript
// components/debug/TouchTargetOverlay.tsx
// Renders semi-transparent boxes showing actual touch areas
// Enable via __DEV__ flag only
```

---

## Summary

| Issue | Fix | Effort | Impact |
|-------|-----|--------|--------|
| W4 contrast | #706C84 -> #8C8AA0 | Low | All secondary text |
| CSS gradients | expo-linear-gradient | Medium | Components using gradients |
| Touch targets | 44px min + hitSlop | Medium | All interactive elements |

### Implementation Order

1. **Color token update** (1 file, immediate)
2. **Gradient migration** (audit + refactor, 1-2 hours)
3. **Touch targets** (audit + refactor, 2-3 hours)

### Testing

- Run Accessibility Inspector (iOS) / Accessibility Scanner (Android)
- Verify contrast with online checker (WebAIM or similar)
- Manual testing with VoiceOver/TalkBack
