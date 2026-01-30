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
