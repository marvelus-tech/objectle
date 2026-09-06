# Objectle Design System — Style Lock

**Target aesthetic:** Museum light studio × Wordle ritual × Apple restraint  
**Demo context:** Full-screen host + guest mobile QR handoff, room audience  
**Theme:** Light ONLY (no dark mode)

---

## Design Principles

### Figure/Ground Hierarchy
1. **Hero stage**: 3D viewer is the theater focal point — gallery plinth presentation
2. **Guest QR**: Second focal point, large (≥240px), always visible, framed for room scanning
3. **Tool timeline**: Editorial director's log, side rail, persistent
4. **Human actions**: One primary (guess), one guest (scan), clear Fitts targets

### Perception Rules
- **Von Restorff**: ONE accent color for primary actions/QR frame (clay red)
- **Hick's Law**: Reduce competing CTAs — no blue+green button soup
- **Gestalt**: Clear clustering, fewer borders, soft elevation over heavy strokes
- **Progression ritual**: Zoom locks and reveal tiers feel like ceremony meters, not debug badges

### Motion Budget (Premium Restraint)
- **Purpose-driven**: Feedback + attention + delight sparingly
- **Interruptible**: Respect prefers-reduced-motion
- **Timing**: 120–280ms range, ease-out bias, avoid constant animation
- **What NOT to animate**: Looping backgrounds, number shimmer, decoration for decoration

---

## Color Tokens (Light Theme)

### Foundation
```css
--field: #F6F3EC;          /* Warm off-white studio background */
--surface: #FFFFFF;         /* Cards, panels, inputs */
--surface-subtle: #FEFDFB; /* Very subtle lift */
```

### Ink
```css
--ink: #1A1A1A;            /* Primary text, near-black */
--ink-secondary: #4A4A4A;   /* Secondary text, WCAG AA on field */
--ink-tertiary: #757575;    /* Tertiary text, metadata */
--ink-muted: #999999;       /* Disabled, placeholder */
```

### Accent (Clay Terracotta)
```css
--accent: #B8503C;          /* Primary CTA, QR frame, focus ring */
--accent-hover: #9A3D2E;    /* Hover/pressed state */
--accent-subtle: #F4E8E5;   /* Wash for backgrounds */
--accent-border: #D6816F;   /* Soft borders when needed */
```

### Semantic
```css
--success: #2D7A3E;         /* Correct guess, win */
--success-bg: #E7F4EA;      /* Success wash */
--error: #C33B29;           /* Wrong guess, lose */
--error-bg: #F9E8E5;        /* Error wash */
--info: #5A5A5A;            /* Neutral info */
--info-bg: #F0EFED;         /* Neutral wash */
```

### 3D Stage
```css
--stage-bg: #EDEDEB;        /* Canvas background, cooler than field */
--stage-shadow: rgba(26, 26, 26, 0.12);
--clay-silhouette: #1A1A1A; /* Reveal tier 0 */
--clay-mid: #B8AFA3;        /* Reveal tier 1 */
--clay-light: #D9D2C8;      /* Reveal tier 2 */
--clay-studio: #EBE6DF;     /* Reveal tier 3 (full light) */
```

### Elevation & Borders
```css
--border-subtle: #E8E6E2;   /* Very soft dividers */
--border: #D4D1CC;          /* Standard borders */
--border-strong: #B8B3AD;   /* Emphasized borders */

/* Elevation shadows (soft, no harsh box-shadow) */
--shadow-sm: 0 1px 3px rgba(26, 26, 26, 0.08);
--shadow-md: 0 2px 8px rgba(26, 26, 26, 0.10);
--shadow-lg: 0 8px 24px rgba(26, 26, 26, 0.12);
```

---

## Typography

### Font Families
```css
--font-display: "Newsreader", "Iowan Old Style", "Palatino Linotype", serif;
  /* Editorial wordmark + hero headings, optical sizing, 500–700 weight */

--font-ui: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  /* UI text, controls, body — clean, readable, 400–600 weight */
```

**Loading:** Google Fonts API  
**Weights:** Display 500/600/700, UI 400/500/600  
**Features:** `font-variant-numeric: tabular-nums` for timers/counters

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px — metadata, tags */
--text-sm: 0.875rem;   /* 14px — secondary UI */
--text-base: 1rem;     /* 16px — body, inputs */
--text-lg: 1.125rem;   /* 18px — subheads */
--text-xl: 1.25rem;    /* 20px — card titles */
--text-2xl: 1.5rem;    /* 24px — section heads */
--text-3xl: 2rem;      /* 32px — Objectle wordmark */
```

**Line heights:**  
- Display: 1.2  
- UI headings: 1.3  
- Body/UI: 1.5  

---

## Spacing & Rhythm

### Scale (4px base unit)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

**Gutters:** `--space-6` (24px) for cards/sections  
**Stage padding:** `--space-8` (32px) to create gallery framing

### Radii
```css
--radius-sm: 4px;     /* Chips, badges */
--radius-md: 8px;     /* Buttons, inputs, cards */
--radius-lg: 12px;    /* Panels, modals */
--radius-xl: 16px;    /* Hero surfaces */
```

---

## Component Specifications

### Buttons
**Primary (Accent):**
- Background: `--accent`, text: white
- Hover: `--accent-hover`
- Active: scale 0.98, 140ms ease-out
- Padding: `--space-3` `--space-5` (12px 20px)
- Border radius: `--radius-md`
- Font: `--font-ui`, 500 weight, `--text-base`

**Secondary (Ghost):**
- Background: transparent, border: `--border`, text: `--ink`
- Hover: background `--info-bg`
- Same sizing/motion as primary

**Disabled:**
- Opacity: 0.4, cursor: not-allowed

### Inputs
- Background: `--surface`, border: `--border`
- Focus: border `--accent`, shadow `0 0 0 3px var(--accent-subtle)`
- Padding: `--space-3` `--space-4`
- Border radius: `--radius-md`
- Font: `--font-ui`, 400 weight, `--text-base`
- Placeholder: `--ink-muted`

### Cards
- Background: `--surface`, border: `--border-subtle` (optional)
- Shadow: `--shadow-sm` for lift
- Padding: `--space-6`
- Border radius: `--radius-lg`

### QR Card (PassCard)
- Size: ≥240px QR code
- Frame: `--accent` border, `--shadow-md`
- Background: `--surface`
- Label above: `--font-display`, `--text-xl`, `--ink`
- Copy below: `--font-ui`, `--text-sm`, `--ink-secondary`

### Tool Log Entry
- Padding: `--space-4`
- Border-left: `3px solid --accent-border`
- Background on hover: `--info-bg`
- Enter animation: translateY(8px) + opacity 0→1, 200ms ease-out, 40ms stagger

### Facet Chips (Guess History)
- Background: `--info-bg` (neutral), `--success-bg` (correct)
- Text: `--ink` / `--success`
- Border radius: `--radius-sm`
- Padding: `--space-1` `--space-3`
- Font: `--font-ui`, 500 weight, `--text-xs`
- Pop animation on correct: scale 1→1.1→1, 240ms ease with slight overshoot

### Progression Chrome
- Container: subtle `--info-bg` background, `--radius-md`
- Zoom lock indicators: `--font-ui`, `--text-sm`, `--ink-tertiary`
- Reveal tier bar: horizontal meter, filled sections in `--accent`, unfilled in `--border`
- Ritual feel: soft borders, clear segmentation

---

## 3D Stage Craft

### Lighting Setup
```typescript
// Key light: soft directional from top-right
<directionalLight position={[5, 6, 3]} intensity={0.8} castShadow />

// Fill lights: cooler ambient, subtle rim
<ambientLight intensity={0.3} color="#f8f8f6" />
<directionalLight position={[-3, 2, -3]} intensity={0.3} color="#dfe5ea" />

// Environment: studio HDRI from Drei
<Environment preset="studio" background={false} />

// Additional Lightformers for gallery polish
<Lightformer position={[0, 5, -5]} intensity={0.3} scale={[10, 5]} />
<Lightformer position={[0, -5, 5]} intensity={0.2} scale={[10, 3]} />
```

### Materials by Reveal Tier
- **Tier 0 (silhouette):** `MeshBasicMaterial`, color `--clay-silhouette`, flat black
- **Tier 1 (unlock):** `MeshStandardMaterial`, color `--clay-mid`, roughness 0.7, metalness 0.1
- **Tier 2 (partial):** color `--clay-light`, roughness 0.5
- **Tier 3 (full studio):** color `--clay-studio`, roughness 0.4, clearer detail

### Canvas Frame
- Background: `--stage-bg`
- ContactShadows: opacity 0.2, blur 3, position y=-1
- Cyclorama back-plane: same as stage-bg for seamless studio
- Outer frame padding: `--space-8` to create gallery plinth effect
- Optional: subtle inset shadow on canvas wrapper for depth

---

## Animation Vocabulary

### Button Press
```css
transition: transform 140ms ease-out, background-color 180ms ease-out;
&:active { transform: scale(0.98); }
```

### Tool Log Entry (enter)
```css
@keyframes slideInFade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: slideInFade 200ms ease-out;
/* Stagger multiple entries by 40ms each */
```

### Facet Chip (correct guess pop)
```css
@keyframes popScale {
  0% { transform: scale(1); }
  50% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
animation: popScale 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
/* Slight overshoot for juicy feedback */
```

### Modal / Overlay (fade + scale)
```css
@keyframes fadeScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
animation: fadeScaleIn 220ms ease-out;
```

### Respect Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Visual Blocklist (Do NOT Use)

❌ **Purple-pink gradients** (SaaS cliché)  
❌ **Inter as the ONLY font** (system-ui fallback alone is bland)  
❌ **Lucide icon soup** (emoji as icons everywhere)  
❌ **Unsolicited dark mode** (light theme ONLY per brief)  
❌ **Generic bento grids** as decoration  
❌ **Constant shimmer/pulse animations** (breaks premium restraint)  
❌ **Heavy black borders everywhere** (prefer soft elevation)  
❌ **Competing blue + green CTAs** (Von Restorff violation)  
❌ **System-ui as the only typeface** (no editorial voice)

---

## Semantic Layout Contract

### App Shell
```
┌─────────────────────────────────────────────────┐
│  Header: Objectle (display font) + tagline      │
├─────────────────┬───────────────────────────────┤
│                 │  ToolLog (sticky sidebar,    │
│  3D Stage       │   director's log style)       │
│  (gallery       ├───────────────────────────────┤
│   plinth)       │  PassCard (large QR frame)   │
│                 ├───────────────────────────────┤
│ ViewerControls  │  GuessInput                   │
│ ProgressionChrome│ GuessHistory                 │
│                 │  GameOver (when applicable)  │
└─────────────────┴───────────────────────────────┘
│  Footer: attribution + links                    │
└─────────────────────────────────────────────────┘

Overlays: ShareModal, AgentPanel (craft entry, not emoji FAB)
```

### Grid Ratio
**Main grid:** `1.5fr 1fr` (stage column slightly wider than side rail)  
**Stage column padding:** `--space-8` for gallery frame  
**Side rail padding:** `--space-6` for reading comfort

---

## Pass Page Craft

Static page (`public/pass/index.html`) must match the style lock:

1. **Same fonts:** Newsreader display + Inter UI
2. **Same tokens:** `--field`, `--ink`, `--accent` palette
3. **QR prominence:** Large, framed in `--accent`, labeled clearly
4. **Room demo copy:** "Guests scan to hand to your agent" above QR
5. **Agent prompt pre:** `--surface` background, `--radius-md`, `--font-ui` monospace
6. **CTA buttons:** Primary accent style, one clear action
7. **Layout:** Centered card, max-width ~720px, padding for mobile
8. **Footer consistency:** Match main app footer

---

## Rationale

### Why Warm Studio (Not Cool Gray)
Museum/gallery spaces use warm whites to make objects feel inviting and premium. Cool grays (#f0f0f0) read as tech utility; warm off-white (#F6F3EC) reads as craft.

### Why Clay Terracotta (Not Blue)
- **Von Restorff:** ONE distinct accent vs. blue+green competition
- **3D context:** Clay materials suggest sculpture/pottery (aligns with object guessing)
- **Contrast:** Terracotta pops against warm field without neon harshness

### Why Newsreader Display
Editorial serif gives Objectle a "daily ritual" quality (like Wordle's newspaper feel) vs. sans-only tech blandness. Optical sizing ensures it looks refined at 32px+ wordmark scale.

### Why Soft Elevation (Not Heavy Borders)
Apple-style restraint: subtle shadows create depth without visual clutter. Heavy borders everywhere = busy, dated; soft lift = premium, confident.

### Why Ritual Chrome
Zoom locks and reveal tiers are core gameplay feedback. Generic debug badges break immersion; treating them as ceremony meters (progress bars, tier indicators) reinforces the daily ritual.

---

## Design Engineer Checklist

Before shipping, verify:

- [ ] NO hardcoded colors outside this token system
- [ ] NO system-ui as the only font (editorial display loaded)
- [ ] NO competing blue + green CTAs
- [ ] NO emoji FAB (replaced with craft agent panel entry)
- [ ] QR is ≥240px, always visible, framed in accent
- [ ] Tool log has enter animations with stagger
- [ ] Buttons have press feedback (scale 0.98)
- [ ] Correct guesses have facet pop animation
- [ ] 3D stage has gallery plinth framing
- [ ] Pass page matches style lock (fonts, colors, layout)
- [ ] Build tested with `/objectle/` base path
- [ ] `prefers-reduced-motion` respected everywhere

---

**Status:** LOCKED 🔒  
**Effective:** 2026-09-06  
**Owner:** Objectle Demo Elevation (Cloud Agent bc-...)
