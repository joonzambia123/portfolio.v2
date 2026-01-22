# Portfolio Project Context

## GitHub Stats Feature
- **Netlify Function**: `netlify/functions/get-github-stats.mts` (fetches directly from GitHub)
- **React Hook**: `src/hooks/useGitHubStats.js`
- **Display**: Stats shown in nav bar via `githubStats` in App.jsx (lines ~1935-1937)
- **Caching**: Edge cached for 1 hour (Cache-Control header)
- **Env vars required**: `GITHUB_TOKEN`, `GITHUB_USERNAME` (set in Netlify dashboard, NOT in .env)
- **Resets**: Every Monday 00:00 UTC (calculates current week on each request)

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
