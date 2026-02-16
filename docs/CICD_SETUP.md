# CI/CD Setup Guide for The Feeding Friend

This guide walks you through setting up automated testing and deployment.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Vercel    │────▶│  Supabase   │
│  (Code +CI) │     │  (Hosting)  │     │ (Database)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │
      │ Push to main       │ Auto-deploy
      ▼                    ▼
┌─────────────┐     ┌─────────────┐
│ Lint/Build  │     │ Production  │
│   Check     │     │    App      │
└─────────────┘     └─────────────┘
```

## Step 1: Initialize Git Repository

```bash
cd the-feeding-friend

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: The Feeding Friend v1.0"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name: `the-feeding-friend`
3. Keep it **Private** (has API keys in env)
4. Don't add README (you already have one)
5. Click "Create repository"

Then push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/the-feeding-friend.git
git branch -M main
git push -u origin main
```

## Step 3: Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Your Supabase anon key

These are needed for the CI build step.

## Step 4: Connect Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New Project"
3. Import your `the-feeding-friend` repository
4. Vercel auto-detects Next.js settings
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

## Step 5: Verify Everything Works

After setup, your workflow will be:

1. **Make changes locally**
2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. **GitHub Actions runs automatically** (lint, type-check, build)
4. **If CI passes, Vercel deploys automatically**
5. **Your app is live!**

## CI Pipeline Details

The CI pipeline (`.github/workflows/ci.yml`) runs:

| Step | Command | Purpose |
|------|---------|---------|
| Lint | `npm run lint` | Check code style |
| Type Check | `npm run type-check` | Verify TypeScript |
| Build | `npm run build` | Ensure app compiles |

## Deployment Environments

Vercel gives you:

| Environment | URL | Trigger |
|-------------|-----|---------|
| Production | `your-app.vercel.app` | Push to `main` |
| Preview | `your-app-abc123.vercel.app` | Pull requests |

## Adding Tests (Future)

When ready to add tests:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts` and add tests in `__tests__/` directories.

## Troubleshooting

### Build fails on Vercel
- Check that all env vars are set in Vercel dashboard
- Look at build logs for specific errors

### CI fails but local works
- Make sure you committed all files
- Check if you have different Node versions

### Database issues
- Verify Supabase env vars match between local and Vercel
- Check Supabase dashboard for any RLS policy issues

## Commands Reference

```bash
# Local development
npm run dev

# Check for issues before pushing
npm run lint
npm run type-check
npm run build

# Git workflow
git status              # See what changed
git add .               # Stage changes
git commit -m "msg"     # Commit
git push                # Deploy!
```
