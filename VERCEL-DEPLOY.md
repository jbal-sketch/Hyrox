# Deploying to Vercel

## Quick Deploy

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variable**:
   ```bash
   vercel env add GEMINI_API_KEY
   # When prompted, enter: AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No** (first time) or **Yes** (updates)
   - Project name? **hyrox-training-plan** (or your choice)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in

2. **Import your GitHub repository**:
   - Click "Add New" → "Project"
   - Import your `Hyrox` repository
   - Configure project settings

3. **Add Environment Variable**:
   - Go to Project Settings → Environment Variables
   - Add new variable:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** `AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww`
     - **Environments:** Production, Preview, Development (select all)

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Update Frontend Configuration

After deployment, update `api-config.js` with your Vercel URL:

```javascript
const API_CONFIG = {
    // Update this to your Vercel deployment URL
    endpoint: 'https://your-project-name.vercel.app/api/generate-plan',
    
    // Or if using custom domain:
    // endpoint: 'https://yourdomain.com/api/generate-plan',
    
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 8000,
    timeout: 120000
};
```

## Project Structure for Vercel

Vercel automatically detects serverless functions in the `api/` directory:

```
Hyrox/
├── api/
│   └── generate-plan.js    ← Serverless function
├── vercel.json             ← Vercel configuration
├── package.json            ← Dependencies
└── ... (other files)
```

## Testing the Deployment

1. **Get your deployment URL** from Vercel dashboard (e.g., `https://hyrox-training-plan.vercel.app`)

2. **Test the API endpoint**:
   ```bash
   curl -X POST https://your-project.vercel.app/api/generate-plan \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Generate a 4-week Hyrox training plan..."}'
   ```

3. **Update `api-config.js`** with your Vercel URL

4. **Test the full flow**:
   - Open `input.html` in browser
   - Fill out the form
   - Click "Generate My Training Plan"
   - Should work! 🎉

## Environment Variables in Vercel

### Via Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your API key
3. Select all environments (Production, Preview, Development)

### Via CLI:
```bash
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
vercel env add GEMINI_API_KEY development
```

## Troubleshooting

### Error: "GEMINI_API_KEY is not set"
- Make sure environment variable is set in Vercel dashboard
- Redeploy after adding environment variable
- Check variable name is exactly `GEMINI_API_KEY`

### Error: "Module not found: @google/generative-ai"
- Make sure `package.json` includes the dependency
- Vercel will install dependencies automatically
- Check build logs in Vercel dashboard

### Error: "CORS error"
- The function already includes CORS headers
- Make sure your frontend URL is allowed
- Check browser console for specific error

### Function timeout
- Vercel free tier: 10 seconds timeout
- Vercel Pro: 60 seconds timeout
- If plan generation takes longer, consider:
  - Using a faster model
  - Reducing prompt size
  - Upgrading to Pro plan

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `api-config.js` with custom domain

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Production:** `main` branch
- **Preview:** Other branches and PRs

Just push your changes:
```bash
git push origin main
```

Vercel will automatically deploy! 🚀

