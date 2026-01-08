# Setup Guide

## Installing Node.js and npm

You need to install Node.js first, which includes npm (Node Package Manager).

### Option 1: Official Installer (Recommended - Easiest)

1. Visit **https://nodejs.org/**
2. Click the big green button to download the **LTS version** (recommended for most users)
3. Open the downloaded `.pkg` file
4. Follow the installation wizard (click Next/Continue through the steps)
5. Once installed, **restart your terminal** (close and reopen it)

### Option 2: Using Homebrew (If you have it)

If you have Homebrew installed, you can run:
```bash
brew install node
```

## Verify Installation

After installing Node.js, **close and reopen your terminal**, then run:

```bash
node --version
npm --version
```

You should see version numbers (like `v20.x.x` for node and `10.x.x` for npm).

## Then Run the Project

Once Node.js is installed, navigate to this folder in terminal:

```bash
cd /Users/joonzambia123/Desktop/Cursor/portfolio
npm install
npm run dev
```

The development server will start at `http://localhost:5173`

---

**Note**: Make sure to restart your terminal after installing Node.js so it picks up the new PATH!























