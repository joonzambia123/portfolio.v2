# Quick Guide: Adding New Media

## When You're Ready to Add Media

Just tell me:

> "Add new media: [video/image name]"

I'll ask you for:

1. **📍 Location**: Where was this taken?
   - Example: "Corrour, Scotland"

2. **🗺️ Coordinates**: GPS coordinates?
   - Example: "56.76040°N, 4.69090°W"
   - (I can look this up if you just give me the location)

3. **📷 Camera**: What did you shoot with?
   - Example: "Sony FX3 · Sigma 24-70"

4. **⚙️ Settings**: Camera settings?
   - Example: "ƒ9.0 · 1/160s · ISO 500"

5. **📝 Alt Text**: Brief description?
   - Example: "Mountain landscape at sunrise"

## If You Don't Have All Info

No problem! Just say:
- **"Use dummy data"** - I'll fill in placeholders
- **"Look up coordinates for [location]"** - I'll search for them
- **"Same camera as last"** - I'll reuse previous camera info

## Examples

### Full Info
```
Add new media: tokyo-shibuya.mp4

Location: Shibuya, Tokyo
Coordinates: 35.6595°N, 139.7004°E
Camera: Sony A7IV · Tamron 28-75
Settings: ƒ2.8 · 1/60s · ISO 1600
Alt: Shibuya crossing at night
```

### Minimal Info
```
Add new media: paris-tower.jpg

Location: Paris, France
(I'll look up coordinates and use dummy camera data)
```

### Super Quick
```
Add new media: random-clip.mp4 with dummy data
```

---

## Current Workflow

1. **Upload file** to `/public/` folder
2. **Tell me** what media to add
3. **Provide info** (or I'll fill in dummy data)
4. **I'll update** `src/mediaData.js` automatically
5. **Done!** Check your site

---

## Ready?

Drop your next video/image in `/public/` and let me know! 🚀

