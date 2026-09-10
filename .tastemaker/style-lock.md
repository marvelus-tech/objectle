# Objectle Design System — Style Lock (Soft Prism)

**Target aesthetic:** Soft Prism: futuristic LIGHT design. Museum light studio craft, warm paper field, dark text, and a single dual-tone neon hairline (cyan + soft violet) that moves gently around the 3D stage.  
**Demo context:** Full-screen host + guest mobile QR handoff, room audience  
**Theme:** Light ONLY (no dark mode)

**Not this:** dark cyberpunk, purple-pink gradient blobs, floating neon orbs, neon text.

---

## Design Principles

### Figure/Ground Hierarchy
1. **Hero stage**: 3D viewer is the theater focal point. The prism frame is the only glowing element on the page.
2. **Guest QR**: Second focal point, large (≥240px), always visible, charcoal frame for room scanning
3. **Tool timeline**: Editorial director's log, side rail, persistent, white card with prism hairline
4. **Human actions**: One primary (guess), one guest (scan), clear Fitts targets

### Perception Rules
- **Von Restorff**: the neon pair is the signature and is reserved for: stage frame glow, focus rings, live / in-motion dots, the reveal meter, and 2px card hairlines. Buttons and the QR frame are charcoal so the stage stays the brightest thing in the room.
- **Hick's Law**: Reduce competing CTAs. One charcoal primary, hairline ghosts for everything else
- **Gestalt**: Clear clustering, fewer borders, soft elevation over heavy strokes
- **Progression ritual**: Zoom locks and reveal tiers feel like ceremony meters, not debug badges
- **Contrast**: raw neon hexes never carry small text. Use `--neon-a-ink` / `--neon-b-ink` (AA on white) for tinted labels.

### Motion Budget (Premium Restraint)
- **Purpose-driven**: Feedback + attention + delight sparingly
- **Interruptible**: Respect prefers-reduced-motion
- **Timing**: 120–280ms range, ease-out bias, avoid constant animation
- **The one allowed ambient loop**: the prism chase on the stage frame (18s, linear, transform-only). Nothing else loops.
- **What NOT to animate**: Looping backgrounds, number shimmer, decoration for decoration

---

## Color Tokens (Light Theme)

### Foundation
```css
--field: #F7F4EE;          /* Warm paper studio background */
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

### Accent (Prism Charcoal)
```css
--accent: #22222A;          /* Primary CTA, QR frame, attempt dots */
--accent-hover: #0F0F14;    /* Hover/pressed state */
--accent-subtle: #EEF0F4;   /* Cool wash for pills and hover */
--accent-border: #C8CAD2;   /* Soft borders when needed */
```

### Neon Pair (Soft Prism signature)
```css
--neon-a: #3DD6C3;          /* Cyan: stage hairline, focus ring, live dot */
--neon-b: #8B7CFF;          /* Soft violet: stage hairline, working theory */
--neon-a-ink: #0F8F82;      /* Cyan-tinted TEXT, AA on white */
--neon-b-ink: #5A4BD6;      /* Violet-tinted TEXT, AA on white */
--neon-a-wash: #E9F9F6;     /* Cyan background wash */
--neon-b-wash: #F0EEFF;     /* Violet background wash */
--neon-a-soft: rgba(61, 214, 195, 0.22);   /* Glow layer */
--neon-b-soft: rgba(139, 124, 255, 0.20);  /* Glow layer */
--neon-ring: 0 0 0 3px rgba(61, 214, 195, 0.30);  /* Input focus */
--prism-line: linear-gradient(90deg, var(--neon-a), var(--neon-b));
```

**Usage contract**
- Raw `--neon-a` / `--neon-b`: lines, dots, glow only. Never body or label text.
- `--neon-a-*` = motion / live / tool activity. `--neon-b-*` = agent reasoning ("working theory").
- Neon never appears on buttons. Buttons are charcoal (primary) or hairline ghost.

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
--stage-bg: #F0EEEA;        /* Canvas background, a hair cooler than field */
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
**Primary (`.btn-primary`, charcoal):**
- Background: `--accent`, text: white
- Hover: `--accent-hover`
- Active: scale 0.98, 140ms ease-out
- Padding: `--space-3` `--space-5` (12px 20px)
- Border radius: `--radius-md`
- Font: `--font-ui`, 500 weight, `--text-base`

**Secondary (`.btn-ghost`, hairline):**
- Background: `--surface`, border: `1px --border`, text: `--ink`
- Hover: background `--accent-subtle`, border `--border-strong`
- Same sizing/motion as primary

**Disabled:**
- Opacity: 0.4, cursor: not-allowed

### Inputs
- Background: `--surface`, border: `1px --border`
- Focus: border `--neon-a`, shadow `--neon-ring`
- Focus-visible outline everywhere: `2px solid --neon-a`, offset 3px
- Padding: `--space-3` `--space-4`
- Border radius: `--radius-md`
- Font: `--font-ui`, 400 weight, `--text-base`
- Placeholder: `--ink-muted`

### Cards
- Background: `--surface`, border: `1px --border-subtle`
- Shadow: `--shadow-sm` for lift
- Padding: `--space-5` to `--space-6`
- Border radius: `--radius-xl`
- Optional `.prism-hairline`: 2px `--prism-line` along the top edge. Used on the tool timeline and the pass card only.

### Prism Stage Frame (`.prism-frame`)
The hero. One 2px dual-tone hairline that slowly chases around the stage plus a soft static glow.

```
.prism-frame            padding 2px, radius 20px, overflow hidden, isolation isolate
.prism-frame::before    inset -100%, conic-gradient(neon-a, neon-b, pale, neon-a, neon-b, pale, neon-a)
                        animation prismChase 18s linear infinite  (transform: rotate 360deg)
.prism-frame__inner     radius 18px, overflow hidden, background --stage-bg
.stage-corners          viewfinder ticks, inset 14px, 14px x 1.5px, --ink-secondary at 0.6
```

Glow (static, layered box-shadow on `.prism-frame`):
```css
0 0 0 1px rgba(255,255,255,0.9),   /* crisp white keyline */
0 0 20px var(--neon-a-soft),       /* cyan halo */
0 10px 44px var(--neon-b-soft),    /* violet drop */
var(--shadow-md);                  /* grounding */
```

Rules:
- The frame sits directly on `--field`, not inside a white card, so the glow has room to breathe.
- Alpha on glow layers stays at or under 0.22. Brighter reads as cyberpunk.
- The chase is transform-only (rotating a pre-painted gradient), so it runs on the compositor at 60fps with no per-frame paint.
- Reduced motion: `::before` becomes a static `linear-gradient(135deg, neon-a, neon-b)` with no animation. The glow stays.

### QR Card (PassCard)
- Size: ≥240px QR code
- Card: `--surface`, `1px --border-subtle`, `.prism-hairline` top
- QR well: pure `#FFFFFF`, `2px solid --accent` frame (charcoal keeps scan contrast high; no neon near the code)
- Label: `--font-display`, `--ink`
- Copy below: `--font-ui`, `--text-sm`, `--ink-secondary`
- Connection pill: `--neon-a-wash` / `--neon-a-ink` when live, otherwise neutral

### Tool Log Entry
- Padding: `--space-4`
- Border-left: `3px solid` state color: `--neon-a` running, `--success` complete, `--error` failed
- Working theory entries: `--neon-b-wash` background, `--neon-b` border-left, `--neon-b-ink` eyebrow
- Header: white, eyebrow "Agent tool timeline", `Step N` pill in `--accent-subtle`
- Enter animation: translateY(8px) + opacity 0→1, 200ms ease-out, 40ms stagger

### Facet Chips (Guess History)
- Background: `--info-bg` (neutral), `--success-bg` (correct)
- Text: `--ink` / `--success`
- Border radius: `--radius-sm`
- Padding: `--space-1` `--space-3`
- Font: `--font-ui`, 500 weight, `--text-xs`
- Pop animation on correct: scale 1→1.1→1, 240ms ease with slight overshoot

### Progression Chrome
- Container: `--surface` card, `--radius-xl`
- Zoom lock indicators: unlocked `--accent` fill, locked `--surface` with `--border`
- Reveal tier bar: horizontal meter, fill is `--prism-line` at 0.55 opacity on `--info-bg`
- Ritual feel: soft borders, clear segmentation

### Attempt Dots (GuessHistory)
- Six 10px circles, `1.5px` border. Used: `--accent` fill. Remaining: hollow, `--border-strong`
- Sits next to the "Guess history" heading with an `N / 6` tabular count

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
- Background: `--stage-bg` (`#F0EEEA`)
- ContactShadows: opacity 0.2, blur 3, position y=-1
- Cyclorama back-plane: `#F0EEEA` and plinth `#E3DED6`, both `MeshBasicMaterial` with `toneMapped={false}`. Unlit on purpose: the reveal ritual dims the object, never the room, so the stage stays light at tier 0.
- Outer frame: `.prism-frame` (see above). No white card between the frame and the field.
- Materials and lights stay in the light gallery register. Neon lives in CSS only; never tint Three.js lights cyan or violet.

---

## Animation Vocabulary

### Prism Chase (stage frame only)
```css
@keyframes prismChase { to { transform: rotate(360deg); } }
.prism-frame::before { animation: prismChase 18s linear infinite; will-change: transform; }

@media (prefers-reduced-motion: reduce) {
  .prism-frame::before {
    animation: none;
    inset: 0;
    background: linear-gradient(135deg, var(--neon-a), var(--neon-b));
  }
}
```
Why 18s: slow enough to read as ambient light, not a loading spinner. Why linear: any easing makes the highlight lurch.

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

❌ **Purple-pink gradient blobs** (SaaS cliché; the prism hairline is a 2px line, not a background)  
❌ **Dark cyberpunk** (Soft Prism is a LIGHT design; neon lives on paper)  
❌ **Floating neon orbs / bokeh** (no decorative glow anywhere but the stage frame)  
❌ **Neon-colored text** (use `--neon-*-ink` variants, AA only)  
❌ **Neon on buttons or the QR frame** (charcoal keeps scan contrast and CTA hierarchy)  
❌ **Inter as the ONLY font** (system-ui fallback alone is bland)  
❌ **Lucide icon soup** (emoji as icons everywhere)  
❌ **Unsolicited dark mode** (light theme ONLY per brief)  
❌ **Generic bento grids** as decoration  
❌ **Constant shimmer/pulse animations** (the prism chase is the single ambient loop)  
❌ **Heavy black borders everywhere** (prefer soft elevation)  
❌ **Competing blue + green CTAs** (Von Restorff violation)  
❌ **Em or en dashes in UI copy** (use periods, commas, or colons)

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

### Why Charcoal CTAs + a Neon Pair (Not Terracotta)
- **Von Restorff:** the glow around the stage is the one distinct signal. Giving buttons a saturated color would compete with it.
- **Room scanning:** a charcoal QR frame is the highest-contrast frame possible on white; neon near the code hurts scan reliability.
- **Futuristic light:** cyan + soft violet on warm paper reads as instrument / lab light rather than club neon. The pair is held to hairlines and low-alpha glow so it stays premium.
- **Semantics:** cyan = motion and live state, violet = agent reasoning. Green and red stay reserved for correct and wrong.

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
- [ ] NO raw neon on text, buttons, or the QR frame
- [ ] NO em or en dashes in UI copy
- [ ] QR is ≥240px, always visible, framed in charcoal
- [ ] Tool log has enter animations with stagger
- [ ] Buttons have press feedback (scale 0.98)
- [ ] Correct guesses have facet pop animation
- [ ] 3D stage has the prism frame with glow under 0.22 alpha
- [ ] Prism chase is transform-only and falls back to a static gradient under reduced motion
- [ ] Pass page matches style lock (fonts, colors, layout, hairline)
- [ ] Build tested with `/objectle/` base path
- [ ] `prefers-reduced-motion` respected everywhere

---

**Status:** LOCKED 🔒  
**Effective:** 2026-09-10 (Soft Prism revision; supersedes the 2026-09-06 clay terracotta lock)  
**Owner:** Objectle Soft Prism Elevation (Cloud Agent)
