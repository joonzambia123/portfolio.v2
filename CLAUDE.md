# Portfolio Project Context

## GitHub Stats Feature
- **Netlify Function**: `netlify/functions/get-github-stats.mts` (fetches directly from GitHub)
- **React Hook**: `src/hooks/useGitHubStats.js`
- **Display**: Stats shown in nav bar via `githubStats` in App.jsx (lines ~1935-1937)
- **Caching**: Edge cached for 1 hour (Cache-Control header)
- **Env vars required**: `GITHUB_TOKEN`, `GITHUB_USERNAME` (set in Netlify dashboard, NOT in .env)
- **Window**: Rolling 7-day window (always shows past week's activity)

## Environment Variables

### Client-side (in .env file)
- `VITE_LASTFM_API_KEY` - Last.fm API key
- `VITE_LASTFM_USERNAME` - Last.fm username

### Server-side (Netlify dashboard only)
- `GITHUB_TOKEN` - GitHub Personal Access Token (no special scopes needed for public repos)
- `GITHUB_USERNAME` - GitHub username (joonzambia123)

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Framer Motion (lazy loaded)
- Netlify Functions (TypeScript)
- Netlify Blobs (key-value storage)

## Deployment
- Hosting: Netlify
- Build: `npm run build`
- Functions: Auto-detected from `netlify/functions/`
- CMS data: Static JSON in `public/cms-data/`

## Key Files
- `src/App.jsx` - Main app component
- `src/hooks/useLastFm.js` - Last.fm integration
- `src/hooks/useGitHubStats.js` - GitHub stats hook
- `src/components/SlideUpModal.jsx` - Modal components
- `netlify.toml` - Netlify configuration
- `cms-data/*.json` - CMS content (source of truth, copied to `public/cms-data/` at build time by Vite plugin)
- `public/cms-data/*.json` - CMS content (build output, DO NOT edit directly)

---

## Video Compression Procedure

When adding a new video to the portfolio, follow these steps:

### 1. Source Video Location
- Place original video in `Videos/` folder (gitignored)
- Naming: `Portfolio (LocationName).mov` or similar

### 2. Video Quality Tiers
The site uses a **2-tier system** based on browser:
- **Standard (Premium)**: High quality for Chrome/desktop (1080p, CRF 26)
- **Safari**: Optimized for Safari browsers (1080p, CRF 28, smaller files for faster buffering)

Use ffmpeg at `/opt/homebrew/Cellar/ffmpeg/8.0.1_1/bin/ffmpeg`

| Tier | File Suffix | Resolution | CRF | Audio | Target Size |
|------|-------------|------------|-----|-------|-------------|
| Standard | _Premium | 1080p | 26 | 128k AAC | 4-8MB |
| Safari | _Safari | 1080p | 28 | 64k AAC | 1-4MB |

### 3. Compression Commands

```bash
# Standard (Chrome/desktop)
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart "output_Premium.mp4" -y

# Safari (smaller file for faster buffering)
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 64k -movflags +faststart "output_Safari.mp4" -y
```

**For vertical videos (phone/portrait):**
Same commands - ffmpeg auto-applies rotation metadata.

### 4. Output Location
- `public/videos/compressed/premium/` (Standard tier files)
- `public/videos/compressed/safari/` (Safari-optimized files)

### 5. Update JSON
**IMPORTANT:** Edit `cms-data/homepage-media.json` (root-level source of truth), NOT `public/cms-data/homepage-media.json`. The Vite build has a `copyCmsData` plugin (`vite.config.js`) that copies from `cms-data/` → `public/cms-data/` at build time, so edits to `public/` get overwritten.

Add entry to `cms-data/homepage-media.json`:
```json
{
  "id": <next_id>,
  "type": "video",
  "src": "/videos/compressed/premium/Name_Premium.mp4",
  "srcSafari": "/videos/compressed/safari/Name_Safari.mp4",
  "location": "City, Country",
  "coordinates": "XX.XXXX°N, XX.XXXX°E",
  "coordinatesUrl": "https://www.google.com/maps?q=...",
  "camera": "Camera Model",
  "aperture": "ƒX.X",
  "shutter": "1/XXs",
  "iso": "XXX",
  "alt": "Description",
  "fileSize": ""
}
```

**Note:** For Cloudinary-hosted videos (external URLs), no `srcSafari` is needed - the app automatically applies URL transforms for Safari.

### 6. Commit & Deploy
```bash
git add public/videos/compressed/*/Name*.mp4 cms-data/homepage-media.json
git commit -m "Add Name video"
git push
```

---

## Adding New Skills/Procedures to CLAUDE.md

When the user asks to "remember" or "learn" a procedure:

1. **Add to this file** - CLAUDE.md is the living document for project-specific knowledge
2. **Use clear sections** - Add `---` dividers and `##` headers
3. **Include:**
   - Step-by-step instructions
   - Exact commands with paths
   - File locations
   - Expected outputs/sizes
4. **Keep it actionable** - Future Claude should be able to follow without clarification
5. **Update existing sections** if the procedure changes (don't duplicate)

---

## Animated Dashed Gridlines Design

A reusable pattern for dark sections with card grids. Creates dashed lines passing through column/row gaps with a marching-ants animation.

### Layout Structure
- Cards in a CSS grid with explicit column sizing: `gridTemplateColumns: 'repeat(N, <card-width>px)'`
- `columnGap` and `rowGap` for spacing
- Grid wrapper: `mx-auto relative` with `width: fit-content`
- Section: `overflow: hidden` to clip extended gridlines at edges

### Gridline Positioning
Gridlines are absolutely positioned inside the grid wrapper, with `overflow: visible` so they extend beyond.

**Vertical lines** pass through column gaps and extend to section edges:
- Internal gap centers: `(col) * cardWidth + (col - 1) * gapWidth + gapWidth/2` for each gap
- Extended lines: continue the same `cardWidth + gapWidth` interval beyond the grid edges
- Top/bottom: `-<section-padding>px` to reach section edges

**Horizontal lines** pass through row gaps:
- Position at `top: calc(50% - 0.5px)` for 2-row grids (adjust for more rows)
- Extend with `left: -50vw; right: -50vw` to span full viewport width

**Formula for N-column grid (cardWidth=W, gapWidth=G):**
```
// All vertical lines at interval of (W + G), centered in gaps
// offset = (i - leftExtensions) * (W + G) + W + G/2
// where leftExtensions = number of lines to extend left of grid
```

### CSS Classes (in index.css)
```css
.gridline-vertical {
  width: 1px;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 6px,
    transparent 6px,
    transparent 12px
  );
  background-size: 1px 12px;
  animation: gridlineMarchV 8s linear infinite;
}

.gridline-horizontal {
  height: 1px;
  background-image: repeating-linear-gradient(
    to right,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 6px,
    transparent 6px,
    transparent 12px
  );
  background-size: 12px 1px;
  animation: gridlineMarchH 8s linear infinite;
}

@keyframes gridlineMarchV {
  to { background-position-y: -12px; }
}
@keyframes gridlineMarchH {
  to { background-position-x: -12px; }
}
```

### Dark Section Styling
Uses `.dark-section-skeuomorphic` class:
- Background: `linear-gradient(180deg, #1e1e1f 0%, #161617 100%)`
- Inset shadows, subtle white border top/bottom
- `::before` pseudo-element: top highlight (40px, 2.5% white opacity)
- `::after` pseudo-element: bottom shadow (40px, 30% black opacity)

### Card Design (when used)
- Fixed width cards (e.g., 200px) with rounded video placeholders
- Text below: font-graphik 14px, `#969494` base, `#e6eaee` for highlighted keywords (no bold)
- Sequential fade-in + slide-up on scroll (IntersectionObserver, 120ms stagger per card)

### Key Design Decisions
- Gridlines are **animated** (marching ants) not static
- Lines extend **beyond the grid** to section edges for a "continuous grid" feel
- Section `overflow: hidden` clips the extended lines cleanly
- Dashes: 6px on, 6px off, `rgba(255,255,255,0.1)` on dark backgrounds

---

## Design System

This section is the single source of truth for the portfolio's visual language. **Every new component, feature, or interface must follow these rules.** If a rule conflicts with a request, flag it before proceeding.

### Design Philosophy

The portfolio follows a **skeuomorphic-minimal** aesthetic: physically grounded surfaces (gradients, inset shadows, subtle borders) combined with restrained typography and generous whitespace. The overall feel is quiet, tactile, and detail-obsessed. Think macOS system UI meets editorial design.

**Core principles:**
1. **Restraint over expression** - No bold text, no loud colors, no decorative elements. Let content breathe.
2. **Physical surfaces** - Every interactive element has depth: top-light inset, bottom-dark inset, subtle gradient, real shadow.
3. **Precision** - Pixel-specific values, not approximate. Use exact hex codes and px measurements.
4. **Consistency of craft** - Every hover state, every transition, every shadow follows the same system.
5. **No ornamentation** - No icons from icon libraries. No emoji. No decorative borders. If an icon is needed, it's a custom minimal SVG.

---

### Typography

#### Font Families
| Token | Family | Fallback | Usage |
|-------|--------|----------|-------|
| `font-graphik` | Graphik | system-ui, -apple-system, sans-serif | **Primary** - all UI text, body copy, buttons, labels |
| `font-calluna` | Calluna | Georgia, Cambria, serif | **Headlines only** - H1 on hero/about page |
| `font-matter` | Matter | system-ui, sans-serif | Reserved (defined but rarely used) |
| Google: Noto Serif KR | — | — | Korean text (weight 400) |
| Google: Nanum Brush Script | — | — | Korean handwritten annotation |

#### Font Weights
| Weight | Value | Font File | Usage |
|--------|-------|-----------|-------|
| Regular | 400 | GraphikRegular.woff2 | Body text, buttons, labels, metadata |
| Medium | 500 | GraphikMedium.woff2 | Modal headings, stat numbers, emphasis |

**Rule: Never use font-bold (700) on Graphik.** The site does not use bold text. Hierarchy is achieved through size, color, and spacing - not weight.

#### Font Size Scale
| Size | Role | Example Usage |
|------|------|---------------|
| 11px | Micro label | Badges ("LIVE", "RECENTLY PLAYED"), field labels, track artist |
| 12px | Small UI | Nav location, search hint, footer links |
| 13px | Secondary body | Currently playing artist, track hover text |
| 14px | **Base / default** | Nav links, hero bio, video metadata, button labels, modal body |
| 15px | Modal heading | Music modal title, activity modal title |
| 21px | Page headline | Hero H1 (Calluna serif only) |
| 22px | Large stat | Code change numbers (+1,247 / -389) |

**Rule: 14px is the default.** When in doubt, use 14px Graphik Regular.

#### Line Heights
| Value | Usage |
|-------|-------|
| `leading-none` (1) | Tight UI elements: nav name, clock, metadata labels |
| `leading-[20px]` | Music track titles, keyboard shortcuts |
| `leading-[25px]` | **Body paragraphs** - hero bio, about page text |
| `leading-[29px]` | H1 headline (Calluna) |

#### Letter Spacing
- **Default**: normal (no tracking) for all body text
- **Micro labels**: `tracking-wide` (0.05em) + `uppercase` for badge/category labels (11px)
- **Never add** letter-spacing to 14px body text

#### Text Treatments
- **Uppercase**: Only for micro labels (11px badges, field headers). Never for headings or body.
- **Italic**: Not used anywhere.
- **Underline**: Only on links, and only dotted style (see Links section).
- **Bold**: Not used. Use font-medium (500) for emphasis sparingly.

---

### Color System

#### Background Colors

**Light surfaces (default theme):**
| Token | Value | Usage |
|-------|-------|-------|
| bg-page | `#FCFCFC` | Page background, loader overlay |
| bg-white | `#ffffff` | Button default, modal background, card background |
| bg-hover | `#fefefe → #fafafa` | Button hover gradient |
| bg-active | `#f3f3f5 → #f7f7f8` | Button active/pressed gradient |
| bg-muted | `#f5f5f6` | Secondary backgrounds, contact modal |
| bg-subtle | `#f0f0f2` | Active nav links, pressed states |

**Dark surfaces:**
| Token | Value | Usage |
|-------|-------|-------|
| bg-dark | `#1e1e1f → #161617` | Dark sections (gradient 180deg) |
| bg-dark-card | `#232325` | Card on dark background |
| bg-dark-button | `#2a2a2b → #1f1f20` | Dark button default gradient |
| bg-dark-hover | `#333334 → #2a2a2b` | Dark button hover gradient |
| bg-dark-active | `#222122 → #1a1a1b` | Dark button active gradient |
| bg-black-box | `#222122` | Video metadata overlay |

**Rule: All backgrounds use vertical gradients** (`linear-gradient(180deg, ...)`), never flat colors for interactive elements. The gradient is always lighter-on-top, darker-on-bottom to simulate top-down lighting.

#### Text Colors

**Light theme text hierarchy (5-tier grayscale):**
| Tier | Value | Usage |
|------|-------|-------|
| Primary | `#1a1a1a` | Headings, modal titles, track names |
| Secondary | `#5B5B5E` | Body copy, nav active, bio text |
| Tertiary | `#888` / `#8f8f8f` | Placeholders, disabled text |
| Muted | `#969494` / `#999` | Metadata, artist names, captions |
| Faint | `#b0b0b0` / `#b5b5b5` | Loading states, timestamps |

**Dark theme text:**
| Tier | Value | Usage |
|------|-------|-------|
| Primary | `#e6eaee` | Main text on dark backgrounds |
| Secondary | `#969494` | Metadata on dark backgrounds |
| Hover | `#ffffff` | Dark nav links on hover |

**Rule: Never use pure black (#000) for text.** Darkest text is `#1a1a1a`.

#### Accent Colors
| Color | Value | Usage |
|-------|-------|-------|
| Blue (link) | `#2480ED` | Link hover, focus outlines, interactive highlights |
| Blue (iOS) | `#007AFF` | Korean name annotation only |
| Blue (contact) | `#4A9EFF` | Contact button default |
| Green | `#22c55e` | Live indicator, waveform bars, positive stats |
| Red | `#ef4444` | Notification badge, negative stats |
| Gold | `#FFB800` | Easter egg hover only |

**Rule: Accent colors are used very sparingly.** Green = live/positive. Red = alert/negative. Blue = interactive. No other accent colors.

#### Selection
```css
::selection { background-color: #E8F6FF; color: #2991DF; }
```

---

### Border System

#### Light theme borders
| Context | Value |
|---------|-------|
| Default | `1px solid rgba(235, 238, 245, 0.9)` |
| Button | `1px solid rgba(235, 238, 245, 0.85)` |
| Hover | `1px solid rgba(230, 233, 240, 0.9)` |
| Active | `1px solid rgba(220, 224, 235, 0.85)` |
| Divider | `1px solid #ebeef5` |
| Dashed divider | `1px dashed #EBEEF5` |

#### Dark theme borders
| Context | Value |
|---------|-------|
| Section edge | `1px solid rgba(255, 255, 255, 0.08)` |
| Button | `1px solid #4a474a` |
| Button hover | `1px solid #5a575a` |
| Subtle | `1px solid rgba(255, 255, 255, 0.05)` |

**Rule: Borders are always 1px.** Never 2px+ except for the blue focus outline (`2px solid #2480ED`).

---

### Shadow System

Every interactive surface uses a **4-layer shadow** combining outer shadows with inset highlights:

#### Light Button (default)
```css
box-shadow:
  0 0.5px 1px rgba(0, 0, 0, 0.03),      /* outer drop */
  0 1px 1px rgba(0, 0, 0, 0.02),          /* outer spread */
  inset 0 0.5px 0 rgba(255, 255, 255, 0.6),  /* top light edge */
  inset 0 -0.5px 0 rgba(0, 0, 0, 0.015);     /* bottom dark edge */
```

#### Light Button (hover)
```css
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.06),
  0 1px 3px rgba(0, 0, 0, 0.04),
  inset 0 0.5px 0 rgba(255, 255, 255, 0.6),
  inset 0 -0.5px 0 rgba(0, 0, 0, 0.025);
```

#### Dark Button (default)
```css
box-shadow:
  0 2px 8px rgba(0, 0, 0, 0.3),
  0 4px 16px rgba(0, 0, 0, 0.2),
  inset 0 1px 0 rgba(255, 255, 255, 0.05),
  inset 0 -1px 0 rgba(0, 0, 0, 0.5);
```

**Rule: Always include both outer shadow AND inset highlights.** The inset top-light + bottom-dark creates the skeuomorphic "raised surface" effect.

---

### Border Radius Scale

| Value | Usage |
|-------|-------|
| 2px | Progress bar dots |
| 5px | Keyboard shortcut keys |
| 8px | **Standard** - buttons, inputs, small cards, album art, video frames |
| 10px | Activity items |
| 12px | Icon containers, face icon, larger interactive areas |
| 14px | Pill containers, video frame, large cards |
| 16px | Home button wrapper, modal pseudo-element highlights |
| 18px | Contact modal |
| 20px | Bottom pill (outermost) |

**Rule: 8px is the default radius.** Use it for any new interactive element unless it's a pill shape (14px+) or a tiny element (5px).

---

### Spacing System

The site uses **Tailwind's default 4px grid** but favors specific recurring values:

#### Spacing Tokens (most common)
| Value | Usage |
|-------|-------|
| 4px | Inner gaps (icon-to-text tight), padding for small containers |
| 6px | Small gaps (button icon spacing, waveform gaps) |
| 8px | **Standard inner padding** - horizontal button padding, small gaps |
| 10px | **Standard gap** - between sibling elements, component internal spacing |
| 12px | Content padding in cards and containers |
| 15px | Nav horizontal padding, larger spacing |
| 20px | Gap between nav links |
| 50px | Column gap in main layout, bottom pill offset from viewport bottom |

#### Section-Level Spacing
- Main content top padding: `120px`
- Column gap (desktop): `50px`
- Bottom pill to viewport bottom: `50px`

#### Component Heights
| Element | Height |
|---------|--------|
| Nav bar | 62px (desktop), 56px (mobile) |
| Bottom pill | 64px |
| Standard button | 37px |
| Smaller button | 35px |
| Video frame | 470px (desktop), min 300px (mobile) |

**Rule: Spacing rhythm is 4-6-8-10-12.** These are the five most common values. When adding spacing, pick from this set first.

---

### Layout

#### Desktop (>813px)
- Content wrapper: `771px` total (375px left + 50px gap + 346px right)
- Left column: 375px (text content)
- Right column: 346px (video frame)
- Centered with `mx-auto`
- All widths are fixed px, not percentages

#### Mobile (<813px)
- Full width with `24px` horizontal padding
- Stacked vertically
- Gap between stacked sections: `32px`
- Video frame: `100%` width, `min-height: 300px`

#### Single Breakpoint
The site uses **one breakpoint: 813px**. No intermediate breakpoints. Desktop is pixel-locked; mobile is fluid.

**Rule: New features need exactly two layouts** - desktop (fixed px) and mobile (fluid). No tablet-specific styles.

---

### Interaction Design

#### Hover Effects (Light Buttons)
```
Default → Hover:
- translateY(-0.5px to -1px)     (slight lift)
- Shadow increases               (more depth)
- Border subtly darkens          (more definition)
- Background shifts to lighter gradient
- Transition: 150-200ms ease
```

#### Active/Press Effects
```
Hover → Active:
- translateY(0)                  (pressed back down)
- scale(0.995 to 0.98)          (slight compress)
- Shadow flattens                (inset dominant)
- Background shifts darker
- Transition: 50-80ms ease      (snappy feedback)
```

#### Hover Expand Pattern
Used for the video metadata box and music pill:
- Element has a collapsed default height
- On hover, smoothly expands to reveal more content
- Transition: 300-400ms ease-in-out
- Content fades in with slight delay

**Rule: Every interactive element must have three states**: default, hover, active. The pattern is always lift-on-hover, press-on-active.

---

### Animation System

#### Entry Animations (Component Load)
Components fade in with directional slide on page load:
- **Left components**: `opacity: 0, translateX(-16px)` → `opacity: 1, translateX(0)`
- **Bottom components**: `opacity: 0, translateY(24px)` → `opacity: 1, translateY(0)`
- **Top nav**: `opacity: 0, translateY(-24px)` → `opacity: 1, translateY(0)`
- **Duration**: 500ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- **Stagger**: 70-120ms between sequential elements

#### Modal Animations
| Type | Enter | Exit | Duration | Easing |
|------|-------|------|----------|--------|
| Contact modal | `y: 24→0, opacity: 0→1` | Reverse | Spring | `stiffness: 400, damping: 35, mass: 0.8` |
| Other modals | `y: 32→0, opacity: 0→1, blur` | Reverse | 250ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |

#### Icon Hover Animations (Contact)
Each icon has a unique micro-animation on hover:
- **Email**: Jiggle rotation `[0, -3, 2.5, -2, 1.5, -1, 0]` + badge pop
- **Instagram**: Lens focus pulse (radius animates)
- **LinkedIn**: Bouncy wave `rotate: [0, -8, 6, -4, 3, 0]` + `scale: [1, 1.1, 1.12, 1.08, 1.04, 1]`
- **Twitter**: Full 360 spin + subtle scale bounce

#### Easing Curves
| Name | Value | Usage |
|------|-------|-------|
| Standard ease-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Component enter, general transitions |
| Spring-like | `cubic-bezier(0.34, 1.2, 0.64, 1)` | Hover lift effects (overshoots slightly) |
| Smooth | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Modal open/close |
| Linear | `linear` | Marquee scroll, gridline march |
| Carousel | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Timeline slide transitions |

#### Duration Scale
| Speed | Duration | Usage |
|-------|----------|-------|
| Instant | 50-80ms | Button press feedback, active states |
| Quick | 150-200ms | Hover transitions, tooltip show/hide |
| Standard | 250-350ms | Modal open/close, component slide |
| Comfortable | 400-500ms | Page-level transitions, expand/collapse |
| Slow | 800ms+ | Marquee, decorative animations |

**Rule: Interactions should feel snappy.** Use 150-200ms for hover, 50-80ms for press. Reserve longer durations for page-level or decorative animations. Never exceed 500ms for user-initiated interactions.

---

### Iconography

**The site uses NO icon library** (no Font Awesome, Lucide, Heroicons, etc.).

All icons are:
- Custom SVG paths, hand-drawn or minimal
- Stroke-based: `strokeWidth="1.5"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Single color: default `#a3a3a3`, hover `#6b7280`
- Sized contextually (no standard icon grid)

**When you need an icon for a new feature:**
1. Create a minimal inline SVG
2. Use stroke style, not fill
3. strokeWidth: 1.5
4. strokeLinecap and strokeLinejoin: round
5. Default color: `#a3a3a3`
6. Keep paths simple - these are not illustrations

**Rule: Never import an icon library.** Every icon is a bespoke SVG.

---

### Link Styles

#### Dotted Underline Links (Primary Pattern)
```css
text-decoration: underline dotted;
text-decoration-thickness: 2px;
text-underline-offset: 3px;
```

**Blue variant** (`.dotted-underline-blue`):
- Default text: inherit, underline: `#9BC8FD`
- Hover text: `#2480ED`, underline: `#2480ED`

**Grey variant** (`.dotted-underline-grey`):
- Default text: `#5B5B5E`, underline: `#C4C4CD`
- Hover text: inherit, underline: `#9AC8FC`

**Rule: Links always use dotted underlines**, not solid. This is a core design signature.

---

### Backdrop Effects

- **Nav bar (scrolled)**: `backdrop-filter: blur(12px)` with `rgba(252, 252, 252, 0.85)` background
- **Tooltips**: `backdrop-filter: blur(12px)` with near-white background
- **Modals**: No backdrop blur on the overlay itself (clean click-outside dismiss)

**Rule: Blur is used sparingly** - only on floating elements that overlay content (nav, tooltips). Never on cards or sections.

---

### Skeuomorphic Surface Recipe

When building a new interactive surface (button, card, container), apply this recipe:

**Light surface:**
```
Background: linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)
Border: 1px solid rgba(235, 238, 245, 0.85)
Border-radius: 8px (default) or 14px (pill)
Shadow: [4-layer system from Shadow System section]
```

**Add pseudo-element for top highlight (optional, for larger surfaces):**
```css
::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 40-50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  border-radius: inherit;
  pointer-events: none;
}
```

**Dark surface:**
```
Background: linear-gradient(180deg, #2a2a2b 0%, #1f1f20 100%)
Border: 1px solid rgba(255, 255, 255, 0.08)
Border-radius: 8px (default) or 14px (pill)
Shadow: [dark 4-layer system]
Top highlight: inset 0 1px 0 rgba(255, 255, 255, 0.05)
Bottom shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.5)
```

---

### What NOT To Do

These patterns are intentionally absent from the design:

1. **No bold text** - hierarchy through size and color only
2. **No icon libraries** - custom SVG only
3. **No solid underlines** - dotted only
4. **No radial gradients** - linear only, 180deg vertical
5. **No CSS Grid for layout** - flexbox only (CSS Grid allowed for card grids in dark sections)
6. **No sticky positioning** - use fixed for persistent elements
7. **No rounded-full on buttons** - pill shapes cap at 20px radius
8. **No color fills on icons** - stroke only
9. **No text-shadow** except easter eggs
10. **No filter effects on images** (grayscale, blur, etc.)
11. **No decorative borders** (double, groove, ridge)
12. **No box-decoration-break**
13. **No pure black (#000000)** backgrounds or text
14. **No emoji** in the UI
15. **No Tailwind color classes** (like `text-gray-500`) - use exact hex values via arbitrary values `text-[#5B5B5E]`

---

### New Feature Checklist

When building any new UI feature, verify:

- [ ] **Font**: Graphik Regular 14px for body, Medium 500 for headings. No bold.
- [ ] **Colors**: Using exact hex values from the color system, not Tailwind named colors.
- [ ] **Background**: Gradient (not flat) for interactive surfaces.
- [ ] **Border**: 1px, using rgba values from the border system.
- [ ] **Shadow**: 4-layer system (outer drop + outer spread + inset top-light + inset bottom-dark).
- [ ] **Radius**: 8px default. Only larger for pill shapes.
- [ ] **Hover**: Lift (-0.5 to -1px translateY) + shadow increase + border darken.
- [ ] **Active**: Press back down (translateY 0) + scale(0.995) + inset shadow dominant.
- [ ] **Transitions**: 150-200ms for hover, 50-80ms for active.
- [ ] **Spacing**: Values from the 4-6-8-10-12 rhythm.
- [ ] **Links**: Dotted underline style.
- [ ] **Icons**: Custom inline SVG, stroke-based, strokeWidth 1.5.
- [ ] **No bold, no icon library, no emoji, no solid underlines, no pure black.**
- [ ] **Two layouts only**: Desktop (fixed px >813px) and mobile (fluid <813px).

---

### Quick Reference: Building a New Section

Example: "Build a weather widget that fits the portfolio aesthetic"

1. **Container**: `rounded-[14px]` with skeuomorphic surface recipe (gradient bg, 1px border, 4-layer shadow)
2. **Heading**: Graphik Medium (500), 15px, `#1a1a1a`
3. **Body text**: Graphik Regular (400), 14px, `#5B5B5E`, leading-[25px]
4. **Metadata/labels**: Graphik Regular, 11px, uppercase, tracking-wide, `#999`
5. **Numbers/stats**: Graphik Medium, 22px, `#1a1a1a` (or accent color for positive/negative)
6. **Icons**: Custom inline SVG, stroke-based, `#a3a3a3`
7. **Hover**: Lift + shadow increase on interactive elements
8. **Entry animation**: fade-in + slide-up, 500ms ease-out, stagger 120ms
9. **Spacing**: 12px internal padding, 10px gaps, 8px small gaps
10. **Dark variant** (if needed): Use dark surface recipe with `#e6eaee` text

---

### Consistency Plan: Areas to Standardize

These are patterns where the current codebase has minor inconsistencies. When touching these areas, normalize to the standard listed here:

#### Border Radius
The codebase uses many radius values (2, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20px). **Preferred scale going forward:**
- `4px` - tiny elements (progress dots, indicators)
- `8px` - standard (buttons, inputs, small cards, album art)
- `12px` - medium (icon containers, larger interactive areas)
- `14px` - large (pill containers, cards, video frames)
- `20px` - pill (outermost containers like bottom bar)

Avoid introducing new radius values outside this scale.

#### Transition Durations
Current code mixes `150ms`, `200ms`, `250ms`, `300ms`, `320ms`, `350ms`, etc. **Standardize to:**
- `80ms` - press/active feedback
- `200ms` - hover transitions
- `300ms` - expand/collapse, modal enter/exit
- `500ms` - page-level, component load

#### Easing Functions
Multiple similar curves exist. **Use these three:**
- `cubic-bezier(0.4, 0, 0.2, 1)` - standard (Material ease-out)
- `cubic-bezier(0.34, 1.2, 0.64, 1)` - spring-like (hover lift overshoot)
- `cubic-bezier(0.25, 0.46, 0.45, 0.94)` - smooth (modals)

#### Color Aliases
The codebase sometimes uses different hex values for the same conceptual color (e.g., `#888` vs `#8f8f8f` for tertiary text). **Canonical values:**
- Primary text: `#1a1a1a`
- Secondary text: `#5B5B5E`
- Tertiary text: `#888`
- Muted text: `#999`
- Body text on dark: `#e6eaee`
- Metadata on dark: `#969494`

When editing existing code, normalize nearby colors to these canonical values if convenient.

---

## Creative API & Interface Philosophy

This section governs how we integrate external data into the portfolio. It applies to any feature that pulls live data (weather, music, GitHub stats, etc.) and defines the creative principles for displaying that data.

### Core Principle: Ambient Over Informational

Data features should feel like **glancing out a window**, not reading a dashboard. The goal is atmosphere and quiet context, not utility or completeness.

**Ask these questions before adding any data feature:**
1. **Does it create a sense of place or time?** (Good: weather, sun position, moon phase. Bad: stock prices, news headlines.)
2. **Is it something you'd notice passively?** (Good: the sky is overcast. Bad: humidity is 72%.)
3. **Can it be expressed in one number or one visual?** (Good: `22°`. Bad: a table of hourly forecasts.)
4. **Does it change slowly enough to feel ambient?** (Good: sun arc moves over hours. Bad: live CPU usage.)

### Data Display Rules

1. **One stat, not many.** Show temperature, not temperature + humidity + wind + pressure. Show moon phase, not a full lunar calendar.
2. **Words over icons for conditions.** "Overcast" as muted text, not a cloud icon. This matches the site's text-driven, icon-free aesthetic.
3. **Visualize time-based data as arcs or gradients**, not charts. A sun arc is a thin curved line. A moon phase is a shaded circle. No bar charts, no line graphs.
4. **Muted by default, detailed on hover.** Show the essential stat normally. Reveal secondary info (sunrise/sunset times, exact moon illumination %) on hover.
5. **Cache aggressively.** Weather doesn't change every second. Fetch once per session or per hour. Never poll rapidly.
6. **Degrade gracefully.** If an API fails, show nothing rather than an error state. The component should feel like it simply hasn't loaded yet, not that it's broken.

### API Selection Criteria

When choosing an API for a new data feature:

| Priority | Requirement |
|----------|-------------|
| 1 | **Free forever** - No credit card, no trial period. Open-Meteo, SunCalc, etc. |
| 2 | **No API key preferred** - Client-side CORS with no key is ideal. If a key is needed, it must be free-tier with no card. |
| 3 | **Simple response** - One clean JSON endpoint. No GraphQL, no pagination, no OAuth. |
| 4 | **Client-side callable** - CORS-enabled so it works from the browser. Serverless function only if the key must be hidden. |
| 5 | **Coordinate-based** - Works with lat/lng so it automatically adapts when the CMS city changes. |

### Current API Stack

| Feature | Provider | Key? | Client-side? | Endpoint Pattern |
|---------|----------|------|-------------|-----------------|
| Weather | Open-Meteo | No | Yes | `api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=temperature_2m,weather_code` |
| Sun/Moon | SunCalc (npm) | No | Yes (JS lib) | Pure math, zero network calls |
| Music | Last.fm | Yes (client) | Yes | Via `useLastFm.js` hook |
| GitHub stats | GitHub API | Yes (server) | No (Netlify fn) | Via `get-github-stats.mts` |
| Static map | Stadia Maps | Yes (free) | Yes (img tag) | `tiles.stadiamaps.com/static/...` |

### Location Architecture

All location-aware features derive from the **CMS city** (`clock_location` in `cms-data/website-copy.json`). When the city changes, everything updates:

1. `clock_location` → `getTimezoneFromCity()` → timezone for clock display
2. `clock_location` → `getCoordsFromCity()` → lat/lng for weather, sun/moon, map
3. All API calls use these derived coordinates

**Rule: Never hardcode coordinates.** Always derive from the CMS city so that changing "Kagoshima" to "Seoul" updates everything automatically.

### Interaction Model for Expanded Cards

When a compact element (pill, badge, stat) expands into a richer view:

1. **Click to expand** - The compact element morphs into the card (Framer Motion `layoutId` or spring animation).
2. **Click again or click outside to collapse** - Returns to compact form.
3. **No separate modal** - The expansion happens in-place, near the trigger element.
4. **Card uses the skeuomorphic surface recipe** from the Design System.
5. **Content fades in after the shape animation** - Don't show content during the morph.
6. **Data fetches on first expand** - Don't fetch data until the user actually clicks. Cache the result for the session.

### Weather Code to Text Mapping

Open-Meteo returns WMO weather codes. Map them to single English words:

```
0 → Clear
1 → Mostly Clear
2 → Partly Cloudy
3 → Overcast
45, 48 → Foggy
51, 53, 55 → Drizzle
61, 63, 65 → Rainy
71, 73, 75 → Snowy
77 → Snow Grains
80, 81, 82 → Showers
85, 86 → Snow Showers
95 → Thunderstorm
96, 99 → Hail
```

**Rule: Use the single word, not "Light rain" or "Heavy drizzle".** Keep it ambient.

---

## Prompt Guideline for New Sessions

When starting a new Claude Code session for this portfolio project, use this prompt to ensure design consistency:

```
Read the Design System section in CLAUDE.md before writing any code. Follow the
New Feature Checklist and What NOT To Do rules. When building UI, reference the
Skeuomorphic Surface Recipe, color system hex values, and spacing rhythm (4-6-8-10-12).
All interactive elements need three states (default, hover, active) using the exact
shadow and transition patterns documented there.
```

That's it. The CLAUDE.md file is automatically loaded as project context, so the design system rules will be available. The prompt just ensures the agent prioritizes reading and following them before writing code.
