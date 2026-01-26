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
- `public/cms-data/*.json` - CMS content

---

## Video Compression Procedure

When adding a new video to the portfolio, follow these steps:

### 1. Source Video Location
- Place original video in `Videos/` folder (gitignored)
- Naming: `Portfolio (LocationName).mov` or similar

### 2. Compression Settings
Use ffmpeg at `/opt/homebrew/Cellar/ffmpeg/8.0.1_1/bin/ffmpeg`

**All tiers are 1080p with different quality levels:**

| Tier | Resolution | CRF | Audio | Target Size |
|------|------------|-----|-------|-------------|
| Medium | 1080p | 30 | 96k AAC | 2-4MB |
| Premium | 1080p | 26 | 128k AAC | 4-8MB |
| Ultra | 1080p | 23 | 192k AAC | 6-15MB |

### 3. Compression Commands

**For horizontal videos (landscape):**
```bash
# Medium
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 30 -preset medium -c:a aac -b:a 96k -movflags +faststart "output_Medium.mp4" -y

# Premium
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart "output_Premium.mp4" -y

# Ultra
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 192k -movflags +faststart "output_Ultra.mp4" -y
```

**For vertical videos (phone/portrait):**
Same commands - ffmpeg auto-applies rotation metadata.

### 4. Output Location
- `public/videos/compressed/medium/`
- `public/videos/compressed/premium/`
- `public/videos/compressed/ultra/`

### 5. Update JSON
Add entry to `public/cms-data/homepage-media.json`:
```json
{
  "id": <next_id>,
  "type": "video",
  "src": "/videos/compressed/medium/Name_Medium.mp4",
  "srcPremium": "/videos/compressed/premium/Name_Premium.mp4",
  "srcUltra": "/videos/compressed/ultra/Name_Ultra.mp4",
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

### 6. Commit & Deploy
```bash
git add public/videos/compressed/*/Name*.mp4 public/cms-data/homepage-media.json
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
