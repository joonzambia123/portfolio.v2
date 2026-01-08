# Font Setup Guide

## Font Files Needed

You need to download the following font files and place them in the `src/fonts/` folder:

### Calluna Font (Free)
- **Calluna-Regular.ttf** (or .woff2/.woff)
- **Calluna-Bold.ttf** (or .woff2/.woff) - optional but recommended

**Where to get it:**
1. Visit: https://www.fontsquirrel.com/fonts/calluna
2. Click "Download TTF" or "Webfont Kit"
3. Extract the font files

### Graphik Font (Commercial - requires license)
- **Graphik-Regular.ttf** (or .woff2/.woff)
- **Graphik-Medium.ttf** (or .woff2/.woff)

**Options to get Graphik:**

#### Option 1: Export from Figma (if you have access)
1. Open your Figma file
2. Select any text using Graphik font
3. In the right panel, click the font name
4. Look for an export option or check if fonts are available locally

#### Option 2: Purchase from Commercial Type
- Visit: https://commercialtype.com/catalog/graphik
- Purchase a license and download the font files

#### Option 3: Use a similar alternative (free)
If you don't have access to Graphik, you can use similar fonts:
- **Inter** (already included, similar to Graphik)
- **Work Sans** (free alternative)
- **IBM Plex Sans** (free alternative)

## Installation Steps

1. **Create the fonts folder** (already done - `src/fonts/`)

2. **Download the font files** using the links above

3. **Place the font files** in `src/fonts/` folder:
   ```
   src/fonts/
     ├── Calluna-Regular.ttf (or .woff2/.woff)
     ├── Calluna-Bold.ttf (or .woff2/.woff)
     ├── Graphik-Regular.ttf (or .woff2/.woff)
     └── Graphik-Medium.ttf (or .woff2/.woff)
   ```

4. **Update font file names in CSS** (if needed):
   - Open `src/index.css`
   - Check that the file names in the `@font-face` declarations match your actual font file names
   - The CSS currently looks for: `.ttf`, `.woff`, or `.woff2` formats

5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## File Format Priority

The CSS is set up to use fonts in this order (best to worst):
1. `.woff2` (best compression, modern browsers)
2. `.woff` (good compression, wider support)
3. `.ttf` (largest files, universal support)

If you have multiple formats, include them all - the browser will automatically choose the best one it supports.

## Quick Check

After adding the fonts, you should see:
- **Heading** (h1) using Calluna font
- **Body text and navigation** using Graphik font

If fonts don't appear, check:
1. Font files are in `src/fonts/` folder
2. File names match what's in `src/index.css`
3. Browser console for any font loading errors









