#!/bin/bash

# Push to GitHub script for portfolio.v2
# Username: joonzambia123
# Repository: portfolio.v2

echo "🚀 Pushing to GitHub..."
echo "Repository: https://github.com/joonzambia123/portfolio.v2.git"
echo ""

# Ensure we're on main branch
git branch -M main

# Check if remote exists, if not add it
if ! git remote | grep -q origin; then
    echo "Adding remote origin..."
    git remote add origin https://github.com/joonzambia123/portfolio.v2.git
else
    echo "Remote origin already exists"
    git remote set-url origin https://github.com/joonzambia123/portfolio.v2.git
fi

# Show current status
echo ""
echo "Current git status:"
git status

echo ""
echo "📤 Pushing to GitHub..."
echo "Note: You may be prompted for GitHub credentials"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "View your repo at: https://github.com/joonzambia123/portfolio.v2"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Repository doesn't exist - create it at https://github.com/new"
    echo "2. Authentication required - use Personal Access Token or SSH"
    echo "3. Check your internet connection"
fi
