# Deployment Guide for testjoonseo.com

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `portfolio` (or any name you prefer)
3. Make it **Private** (recommended) or Public
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Push to GitHub

After creating the repo, GitHub will show you commands. Run these in your terminal:

```bash
cd /Users/joonzambia123/Desktop/Cursor/portfolio
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy to Netlify

1. Go to https://app.netlify.com
2. Sign up/Login with your GitHub account
3. Click "Add new site" → "Import an existing project"
4. Choose "GitHub" and authorize Netlify
5. Select your `portfolio` repository
6. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** (leave empty)
7. Click "Deploy site"

## Step 4: Configure Custom Domain (testjoonseo.com)

### In Netlify:

1. Go to your site dashboard → **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Enter: `testjoonseo.com`
4. Also add: `www.testjoonseo.com` (Netlify will handle redirects)
5. Netlify will show you DNS records needed

### In Cloudflare:

1. Go to your Cloudflare dashboard for `testjoonseo.com`
2. Go to **DNS** → **Records**
3. Add these records:

   **For root domain (testjoonseo.com):**
   - Type: `CNAME`
   - Name: `@` (or root domain)
   - Target: `YOUR_NETLIFY_SITE.netlify.app` (Netlify will show this)
   - Proxy status: ✅ Proxied (orange cloud)

   **For www subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Target: `YOUR_NETLIFY_SITE.netlify.app`
   - Proxy status: ✅ Proxied (orange cloud)

   **Alternative (if CNAME doesn't work for root):**
   - Type: `A`
   - Name: `@`
   - IPv4 address: `75.2.60.5` (Netlify's IP - check Netlify docs for current IP)
   - Proxy status: ✅ Proxied

4. Wait for DNS propagation (usually 5-30 minutes)

### SSL Certificate:

Netlify will automatically provision an SSL certificate via Let's Encrypt once DNS is configured. This usually takes a few minutes to a few hours.

## Step 5: Verify Deployment

1. Check Netlify build logs to ensure build succeeds
2. Visit `https://testjoonseo.com` once DNS propagates
3. Check that SSL certificate is active (should show 🔒 in browser)

## Troubleshooting

- **Build fails:** Check Netlify build logs, ensure all dependencies are in `package.json`
- **DNS not working:** Wait longer (up to 48 hours), check Cloudflare DNS settings
- **SSL not working:** Wait for Netlify to provision certificate (can take up to 24 hours)
- **Site not updating:** Push new commits to GitHub, Netlify auto-deploys

## Environment Variables

### Last.fm Integration

To enable Last.fm integration on your live site, you need to configure environment variables in Netlify:

1. Go to **Netlify Dashboard** → Your site → **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add the following two variables:

   - **Key:** `VITE_LASTFM_API_KEY`
     **Value:** (Your Last.fm API key from your `.env` file)
   
   - **Key:** `VITE_LASTFM_USERNAME`
     **Value:** (Your Last.fm username from your `.env` file)

4. Click **Save**
5. **Redeploy your site** (go to **Deploys** tab → Click **Trigger deploy** → **Deploy site**)

**Note:** These are the same values from your local `.env` file. The Last.fm integration will only work on localhost until these are configured in Netlify.

### Other Environment Variables

If you need to add other environment variables:
1. Netlify Dashboard → Site settings → Environment variables
2. Add variables as needed
3. Redeploy site
