# Last.fm Integration Setup Guide

This guide will help you set up Last.fm integration to display your recently played music on your portfolio.

## Why Last.fm?

- **Simple**: No OAuth or complex authentication - just an API key
- **Free**: Free forever with generous rate limits
- **Cross-platform**: Works with Spotify, Apple Music, YouTube Music, and more
- **Reliable**: No API blocks or restrictions
- **Privacy-friendly**: Uses public scrobble data

## Prerequisites

- A Last.fm account
- A music service that can scrobble to Last.fm (e.g., Spotify, Apple Music)

## Setup Steps

### 1. Create a Last.fm Account

1. Go to [Last.fm](https://www.last.fm/join)
2. Sign up for a free account
3. Remember your username - you'll need it later

### 2. Connect Your Music Service

#### For Spotify:

**Desktop App:**
1. Open Spotify Desktop app
2. Go to **Settings** (Preferences on Mac)
3. Scroll down to **Social** section
4. Click **Connect** next to Last.fm
5. Log in with your Last.fm credentials
6. Wait ~5 minutes for scrobbles to start appearing

**Web/Mobile:**
- Spotify Web and Mobile don't support Last.fm directly
- Use a third-party scrobbler like [Web Scrobbler](https://web-scrobbler.com/) (browser extension)
- Or use [Last.fm's mobile app](https://www.last.fm/about/trackmymusic) for scrobbling

#### For Apple Music:

- Download and use [Last.fm's macOS app](https://www.last.fm/about/trackmymusic)
- Or use third-party tools like [Neptunes](https://apps.apple.com/app/id1006739057)

#### For Other Services:

See [Last.fm's scrobbling guide](https://www.last.fm/about/trackmymusic) for your platform

### 3. Get Your Last.fm API Key

1. Go to [Last.fm API Account Creation](https://www.last.fm/api/account/create)
2. Fill in the form:
   - **Application name**: Portfolio Music Widget (or any name)
   - **Application description**: Displays recently played music on my portfolio
   - **Callback URL**: Leave blank or use your portfolio URL
3. Accept the Terms of Service
4. Click **Submit**
5. You'll receive:
   - **API Key** - Copy this
   - **Shared Secret** - You don't need this for read-only access

### 4. Configure Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your Last.fm credentials:

```bash
VITE_LASTFM_API_KEY=your_api_key_here
VITE_LASTFM_USERNAME=your_lastfm_username_here
```

**Important**: 
- Replace `your_api_key_here` with your actual API key
- Replace `your_lastfm_username_here` with your Last.fm username
- Never commit the `.env` file to git (it's already in `.gitignore`)

### 5. Restart Your Dev Server

```bash
npm run dev
```

The music widget should now display your recently played track!

## Troubleshooting

### "No recent track" displayed

**Possible causes:**
- Last.fm credentials not configured correctly
- No scrobbles in your Last.fm history yet
- Scrobbling not enabled in your music app

**Solutions:**
1. Check that your `.env` file has the correct API key and username
2. Visit your Last.fm profile to verify scrobbles are appearing
3. Wait 5-10 minutes after connecting Spotify for first scrobbles
4. Check browser console for any error messages

### Album art not showing

**Possible causes:**
- The track doesn't have album art in Last.fm's database
- Image URL is broken or blocked by CORS

**Solutions:**
- Last.fm usually has album art for most tracks
- Try playing a different, more popular track
- Album art will appear once Last.fm indexes it

### API rate limiting

**Last.fm rate limits:**
- ~5 requests per second per API key
- Very generous for personal use
- The app polls every 30 seconds, well within limits

**If you hit limits:**
- Increase polling interval in `src/hooks/useLastFm.js` (change `30000` to higher value)
- This is unlikely for normal personal use

### Tracks not updating

**Check:**
1. Is the dev server running?
2. Is Last.fm scrobbling working? (Check your Last.fm profile)
3. Are there any errors in the browser console?
4. Try refreshing the page

## Features

### Current Implementation

- Displays most recently played/currently playing track
- Shows track name, artist, and album art
- Automatically updates every 30 seconds
- Clicking opens the track on Last.fm
- Vinyl animation spins on hover

### Customization

**Change update frequency:**

Edit `src/hooks/useLastFm.js`, line ~70:
```javascript
const interval = setInterval(() => {
  getRecentlyPlayed();
}, 30000); // Change 30000 to your desired milliseconds
```

**Show more tracks:**

Edit `src/hooks/useLastFm.js`, line ~18:
```javascript
const response = await fetch(
  `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
);
```
Change `limit=1` to show more tracks, then update your component to display them.

## Privacy & Security

- ✅ Last.fm only shows public scrobble data
- ✅ API key is for read-only access to your public data
- ✅ No sensitive information is exposed
- ✅ API key is stored in `.env` (not committed to git)
- ✅ Client-side implementation (no backend needed)

For production deployment, consider:
- Using environment variables in your hosting platform
- The API key is visible in network requests (this is okay for read-only public data)
- If concerned, implement a backend proxy (optional)

## Resources

- [Last.fm API Documentation](https://www.last.fm/api)
- [Last.fm Scrobbling Guide](https://www.last.fm/about/trackmymusic)
- [Get API Key](https://www.last.fm/api/account/create)

## Support

If you encounter issues:
1. Check the [Last.fm API Status](https://twitter.com/lastfmstatus)
2. Review your browser console for errors
3. Verify your scrobbles appear on your Last.fm profile
4. Ensure `.env` file is properly configured

Happy listening! 🎵
