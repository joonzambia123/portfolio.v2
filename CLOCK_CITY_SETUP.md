# Clock City Setup Guide

## Overview
The clock component automatically determines the timezone based on the city name set in the CMS. Simply update the `clock_location` field in the CMS, and the clock will automatically use the correct timezone.

## How to Change the Clock City

### Via CMS (Recommended)
1. Go to `/cms` in your browser
2. Navigate to "Website Copy" collection
3. Find the entry with key `clock_location`
4. Update the `content` field with your desired city name
5. The clock will automatically update to show the correct timezone

### Via JSON Files (Direct Edit)
1. Edit `cms-data/website-copy.json`
2. Find the entry with `"key": "clock_location"`
3. Update the `"content"` field with your city name
4. Also update `public/cms-data/website-copy.json` for production builds

## Supported Cities

The system automatically maps city names to timezones. Supported cities include:

### Asia
- **Saigon** / **Ho Chi Minh** / **HCMC** → Asia/Ho_Chi_Minh
- **Tokyo** / **Japan** / **Kagoshima** → Asia/Tokyo
- **Seoul** / **Korea** → Asia/Seoul
- **Beijing** / **Shanghai** → Asia/Shanghai
- **Hong Kong** → Asia/Hong_Kong
- **Singapore** → Asia/Singapore
- **Bangkok** → Asia/Bangkok
- **Jakarta** → Asia/Jakarta
- **Manila** → Asia/Manila
- **Mumbai** / **Delhi** → Asia/Kolkata
- **Dubai** → Asia/Dubai

### Europe
- **London** → Europe/London
- **Paris** → Europe/Paris
- **Berlin** → Europe/Berlin
- **Rome** → Europe/Rome
- **Madrid** → Europe/Madrid
- **Amsterdam** → Europe/Amsterdam
- **Moscow** → Europe/Moscow

### Americas
- **New York** → America/New_York
- **Los Angeles** / **San Francisco** → America/Los_Angeles
- **Chicago** → America/Chicago
- **Toronto** → America/Toronto
- **Vancouver** → America/Vancouver
- **Mexico City** → America/Mexico_City
- **Sao Paulo** → America/Sao_Paulo
- **Buenos Aires** → America/Buenos_Aires

### Oceania
- **Sydney** → Australia/Sydney
- **Melbourne** → Australia/Melbourne
- **Auckland** → Pacific/Auckland

## Adding New Cities

To add support for a new city, edit `src/App.jsx` and add an entry to the `cityMap` object in the `getTimezoneFromCity` function:

```javascript
const cityMap = {
  // ... existing cities ...
  'your city name': 'Timezone/Identifier',
};
```

Use IANA timezone identifiers (e.g., `America/New_York`, `Europe/London`).

## Current Setting
The clock is currently set to: **Saigon** (Asia/Ho_Chi_Minh timezone)

## Notes
- City names are case-insensitive
- If a city is not found in the mapping, the clock defaults to UTC
- The clock updates in real-time and automatically adjusts when the CMS value changes
- The city name is displayed below the time in the clock component

