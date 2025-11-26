# Vercel Deployment Guide

Complete step-by-step guide to deploy Terraria Loadout Maker to Vercel with GitHub integration.

## Prerequisites

-   GitHub account
-   Vercel account (sign up at https://vercel.com)
-   Supabase database set up (see DATABASE_SETUP.md)
-   Code ready in a Git repository

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd /path/to/terraria-loadout-maker
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `terraria-loadout-maker`)
3. **DO NOT** initialize with README, .gitignore, or license (you already have these)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/terraria-loadout-maker.git
git branch -M main
git push -u origin main
```

## Step 2: Connect Vercel to GitHub

### 2.1 Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Repository

1. Click "Add New Project" or "Import Project"
2. In "Import Git Repository", find your `terraria-loadout-maker` repo
3. Click "Import"

## Step 3: Configure Project Settings

### 3.1 Framework Preset

Vercel should auto-detect:

-   **Framework Preset**: Next.js
-   **Root Directory**: ./
-   **Build Command**: `pnpm build` or `npm run build`
-   **Output Directory**: `.next`

### 3.2 Environment Variables

Click "Environment Variables" and add these from your `.env.local`:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

**Important**: Do NOT add private keys or secrets to `NEXT_PUBLIC_*` variables!

### 3.3 Additional Settings (Optional)

-   **Node.js Version**: 18.x or later (default is usually fine)
-   **Install Command**: `pnpm install` (Vercel auto-detects)
-   **Build Command**: `pnpm build` (already set)

## Step 4: Deploy

1. Review all settings
2. Click "Deploy"
3. Wait 2-5 minutes for the build to complete

You'll see:

-   Building...
-   Running Build Command
-   Deploying...
-   ✓ Deployed successfully!

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Domain

1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Click "Add"
4. Enter your domain (e.g., `terraria-loadouts.com`)

### 5.2 Configure DNS

Vercel will show you DNS records to add:

**For apex domain (example.com):**

-   Type: A
-   Name: @
-   Value: 76.76.21.21

**For www subdomain:**

-   Type: CNAME
-   Name: www
-   Value: cname.vercel-dns.com

### 5.3 Wait for DNS Propagation

-   Can take 24-48 hours
-   Vercel will auto-provision SSL certificate

## Step 6: Set Up Automatic Deployments

Vercel automatically deploys on:

-   **Production**: Pushes to `main` branch
-   **Preview**: Pull requests and other branches

### 6.1 Configure Branch Deployments

1. Go to Settings → Git
2. **Production Branch**: `main` (default)
3. **Deploy Hooks**: Optional webhooks for external triggers

### 6.2 Preview Deployments

Every pull request gets a unique preview URL:

-   Allows testing before merging
-   Preview URL format: `project-name-git-branch-username.vercel.app`

## Step 7: Configure Supabase for Production

### 7.1 Update Supabase Allowed URLs

1. Go to Supabase Dashboard
2. Settings → Authentication → URL Configuration
3. Add your Vercel URLs to **Redirect URLs**:
    ```
    https://your-project.vercel.app
    https://your-project.vercel.app/**
    https://your-custom-domain.com
    https://your-custom-domain.com/**
    ```

### 7.2 Update Site URL

Set your production URL as the Site URL in Supabase:

```
https://your-project.vercel.app
```

Or your custom domain if configured.

## Step 8: Test Production Deployment

### 8.1 Verify Core Functionality

-   [ ] Homepage loads
-   [ ] Authentication works (sign up, login, logout)
-   [ ] Create loadout
-   [ ] View loadouts
-   [ ] Public/private loadouts work correctly
-   [ ] Favorites work
-   [ ] Voting works
-   [ ] Collections work
-   [ ] Images load from Terraria wikis
-   [ ] Navigation works across all pages

### 8.2 Test Performance

Check Vercel Analytics:

1. Project Dashboard → Analytics
2. Monitor:
    - Page load times
    - Web Vitals (LCP, FID, CLS)
    - Error rates

## Step 9: Monitoring and Logs

### 9.1 View Deployment Logs

1. Go to project dashboard
2. Click on any deployment
3. View "Building" and "Functions" logs
4. Check for errors or warnings

### 9.2 Runtime Logs

1. Project Dashboard → Logs
2. Filter by:
    - Time range
    - Deployment
    - Status code
    - Path

### 9.3 Set Up Alerts (Optional)

Project Settings → Notifications:

-   Deployment notifications
-   Comment on GitHub PRs
-   Slack/Discord webhooks

## Step 10: Optimize Production Build

### 10.1 Create `vercel.json` (Optional)

Create `vercel.json` in project root for advanced config:

```json
{
    "framework": "nextjs",
    "buildCommand": "pnpm build",
    "devCommand": "pnpm dev",
    "installCommand": "pnpm install",
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "X-Content-Type-Options",
                    "value": "nosniff"
                },
                {
                    "key": "X-Frame-Options",
                    "value": "DENY"
                },
                {
                    "key": "X-XSS-Protection",
                    "value": "1; mode=block"
                }
            ]
        }
    ]
}
```

### 10.2 Optimize Images

Images are automatically optimized by Next.js Image component:

-   Loaded from external wikis
-   Cached by Vercel CDN
-   Lazy loaded

### 10.3 Enable Analytics

1. Project Settings → Analytics
2. Enable Web Analytics
3. Enable Speed Insights
4. Monitor Core Web Vitals

## Continuous Deployment Workflow

### Making Updates

```bash
# Make changes to code
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel automatically:

1. Detects push to main
2. Builds new version
3. Runs tests (if configured)
4. Deploys to production
5. Notifies via email/Slack

### Rolling Back

If deployment has issues:

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback

## Environment-Specific Configuration

### Development

```bash
pnpm dev
```

Uses `.env.local` with development Supabase instance.

### Preview (Staging)

Create a `preview` branch:

```bash
git checkout -b preview
git push origin preview
```

Add preview environment variables in Vercel:

-   Target: Preview
-   Branch: preview

### Production

Push to `main` branch with production environment variables.

## Troubleshooting

### Build Fails

**Error: Module not found**

-   Run `pnpm install` locally
-   Commit `pnpm-lock.yaml`
-   Push to trigger rebuild

**Error: Environment variable not set**

-   Add missing variables in Vercel dashboard
-   Redeploy

### Runtime Errors

**500 Internal Server Error**

-   Check Vercel function logs
-   Verify Supabase connection
-   Check environment variables

**Authentication not working**

-   Verify Supabase redirect URLs
-   Check Site URL in Supabase
-   Verify environment variables

### Performance Issues

-   Enable Vercel Speed Insights
-   Check bundle size in build logs
-   Optimize images and assets
-   Consider serverless function timeouts

## Security Best Practices

1. **Never commit `.env.local`** - already in `.gitignore`
2. **Use environment variables** for all secrets
3. **Enable RLS in Supabase** - prevents unauthorized access
4. **Keep dependencies updated** - `pnpm update`
5. **Monitor security alerts** - GitHub Dependabot
6. **Use HTTPS only** - Vercel provides free SSL

## Cost Considerations

### Vercel Free Tier Includes:

-   Unlimited deployments
-   100 GB bandwidth/month
-   Serverless function execution
-   100 GB build execution time
-   Custom domains
-   SSL certificates
-   Preview deployments

### Paid Features:

-   Team collaboration
-   Password-protected deployments
-   Advanced analytics
-   Priority support
-   Increased limits

### Supabase Free Tier:

-   500 MB database
-   1 GB file storage
-   2 GB bandwidth
-   50,000 monthly active users
-   7-day log retention

## Post-Deployment Checklist

-   [ ] Production URL is live
-   [ ] Custom domain configured (if applicable)
-   [ ] SSL certificate active
-   [ ] Authentication works
-   [ ] All features tested in production
-   [ ] Environment variables set correctly
-   [ ] Supabase URLs whitelisted
-   [ ] Analytics enabled
-   [ ] Error monitoring active
-   [ ] GitHub webhook active for auto-deploys
-   [ ] Team members invited (if applicable)

## Useful Commands

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy from CLI
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>
```

## Support Resources

-   **Vercel Documentation**: https://vercel.com/docs
-   **Vercel Community**: https://github.com/vercel/vercel/discussions
-   **Next.js Documentation**: https://nextjs.org/docs
-   **Supabase Documentation**: https://supabase.com/docs

## Quick Deploy Button (Optional)

Add to README.md for one-click deploy:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/terraria-loadout-maker)
```

---

**Congratulations!** Your Terraria Loadout Maker is now live on Vercel! 🎉
