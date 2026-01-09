# GitHub Push Troubleshooting

## Current Setup
- **Username:** joonzambia123
- **Repository:** portfolio.v2
- **Remote URL:** https://github.com/joonzambia123/portfolio.v2.git

## Issue: Authentication Not Working

If you're getting authentication errors even after pasting your token, try these solutions:

### Solution 1: Clear Keychain and Try Again

```bash
cd /Users/joonzambia123/Desktop/Cursor/portfolio

# Remove old credentials from keychain
git credential-osxkeychain erase
host=github.com
protocol=https
# Press Enter twice

# Now try pushing again
git push -u origin main
```

When prompted:
- **Username:** `joonzambia123`
- **Password:** Paste your Personal Access Token (not your GitHub password)

### Solution 2: Use SSH Instead (Recommended)

SSH is often easier and more reliable:

1. **Check if you have SSH keys:**
```bash
ls -al ~/.ssh
```

2. **If you don't have SSH keys, generate one:**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one if you prefer)
```

3. **Add SSH key to GitHub:**
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```

Then:
- Go to: https://github.com/settings/keys
- Click "New SSH key"
- Title: "MacBook" (or any name)
- Paste the key you copied
- Click "Add SSH key"

4. **Update remote to use SSH:**
```bash
cd /Users/joonzambia123/Desktop/Cursor/portfolio
git remote set-url origin git@github.com:joonzambia123/portfolio.v2.git
```

5. **Test SSH connection:**
```bash
ssh -T git@github.com
# Should say: "Hi joonzambia123! You've successfully authenticated..."
```

6. **Push:**
```bash
git push -u origin main
```

### Solution 3: Use Token in URL (Temporary)

⚠️ **Not recommended for security**, but works for one-time push:

```bash
cd /Users/joonzambia123/Desktop/Cursor/portfolio
git remote set-url origin https://YOUR_TOKEN@github.com/joonzambia123/portfolio.v2.git
git push -u origin main
```

Then change it back:
```bash
git remote set-url origin https://github.com/joonzambia123/portfolio.v2.git
```

### Solution 4: Verify Repository Exists

Make sure the repository exists at:
https://github.com/joonzambia123/portfolio.v2

If it doesn't exist:
1. Go to https://github.com/new
2. Repository name: `portfolio.v2`
3. Don't initialize with README
4. Click "Create repository"

### Verify Current Remote

Check your current remote URL:
```bash
git remote -v
```

Should show:
```
origin  https://github.com/joonzambia123/portfolio.v2.git (fetch)
origin  https://github.com/joonzambia123/portfolio.v2.git (push)
```

## Recommended: Use SSH

SSH is the most reliable method. Follow Solution 2 above.
