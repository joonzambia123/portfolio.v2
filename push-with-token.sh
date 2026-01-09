#!/bin/bash

# Push to GitHub with token authentication
# Repository: portfolio.v2
# Username: joonzambia123

echo "🔐 GitHub Push with Token Authentication"
echo "Repository: https://github.com/joonzambia123/portfolio.v2.git"
echo ""
echo "If you haven't already, you'll need to:"
echo "1. Create a Personal Access Token at: https://github.com/settings/tokens"
echo "2. Make sure it has 'repo' scope"
echo ""
read -p "Have you created your token? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create a token first, then run this script again."
    exit 1
fi

echo ""
echo "📤 Attempting to push..."
echo ""

# Ensure we're on main branch
git branch -M main

# Try to push - this will prompt for username and password (use token as password)
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "View your repo at: https://github.com/joonzambia123/portfolio.v2"
else
    echo ""
    echo "❌ Push failed. Trying alternative method..."
    echo ""
    echo "Alternative: Use SSH instead of HTTPS"
    echo "1. Set up SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
    echo "2. Or try: git remote set-url origin git@github.com:joonzambia123/portfolio.v2.git"
fi
