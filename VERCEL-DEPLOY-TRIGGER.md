# Trigger Vercel Deployment

## Option 1: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Find your **Hyrox** project
3. Click on the project
4. Go to the **Deployments** tab
5. Click the **"..."** menu on the latest deployment
6. Select **"Redeploy"**
7. Confirm the redeploy

This will trigger a new deployment with your latest GitHub changes.

## Option 2: Install Vercel CLI and Deploy

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
cd "/Users/janetbalneaves/Documents/Cursor Projects/Hyrox"
vercel --prod
```

## Option 3: Check GitHub Integration

If Vercel should auto-deploy from GitHub:

1. Go to Vercel Dashboard → Your Project → Settings
2. Check **Git** section
3. Verify:
   - Repository is connected
   - Production Branch is set to `main`
   - Auto-deploy is enabled

If not connected:
1. Go to Settings → Git
2. Click "Connect Git Repository"
3. Select your `Hyrox` repository
4. Configure:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

## Option 4: Push an Empty Commit (Trigger Webhook)

Sometimes the webhook doesn't fire. You can trigger it with:

```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

## Check Deployment Status

1. Go to Vercel Dashboard → Your Project
2. Check the **Deployments** tab
3. Look for:
   - ✅ Success (green)
   - ⏳ Building (yellow)
   - ❌ Error (red) - click to see error details

## Common Issues

### Deployment Fails
- Check build logs in Vercel dashboard
- Verify `package.json` has all dependencies
- Check that environment variables are set (GEMINI_API_KEY)

### Functions Not Working
- Verify `api/` folder structure is correct
- Check function timeout settings in `vercel.json`
- Test endpoints after deployment

### Changes Not Showing
- Clear browser cache
- Check you're viewing the production deployment (not preview)
- Verify the deployment actually completed

