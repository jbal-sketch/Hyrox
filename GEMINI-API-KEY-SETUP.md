# How to Get a Gemini 1.5 Flash API Key

## Step-by-Step Instructions

### 1. Get Your API Key from Google AI Studio

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/apikey
   - Or: https://ai.google.dev/ → Click "Get API Key"

2. **Sign In**
   - Sign in with your Google account
   - If you don't have one, create a free Google account

3. **Create API Key**
   - Click **"Create API Key"** button
   - You may be prompted to create a Google Cloud project (this is free)
   - Click "Create API key in new project" or select an existing project
   - Your API key will be generated (starts with `AIzaSy...`)

4. **Copy Your API Key**
   - Copy the entire key immediately (you won't be able to see it again)
   - It looks like: `AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww`
   - ⚠️ **Keep it secret!** Never share it publicly or commit it to git

---

## 2. Set Up API Key for Local Development

### Option A: Using `.env` file (Recommended)

1. **Create or edit `.env` file** in your project root:
   ```bash
   # If file doesn't exist, create it
   touch .env
   ```

2. **Add your API key**:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```

3. **Verify `.env` is in `.gitignore`** (so you don't commit it):
   ```bash
   # Check if .env is ignored
   cat .gitignore | grep .env
   ```
   If not, add `.env` to `.gitignore`

4. **Restart your server**:
   ```bash
   npm start
   # or
   node server.js
   ```

### Option B: Using Environment Variable Directly

```bash
export GEMINI_API_KEY=AIzaSyYourActualKeyHere
node server.js
```

---

## 3. Set Up API Key for Vercel Deployment

### Via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Environment Variable**
   - Click **"Add New"**
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyYourActualKeyHere` (paste your key)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Redeploy** (if needed)
   - Go to **Deployments**
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger deployment

### Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Add environment variable
vercel env add GEMINI_API_KEY

# When prompted:
# - Enter your API key value
# - Select environments (production, preview, development)

# Redeploy
vercel --prod
```

---

## 4. Update Code to Use Gemini 1.5 Flash

Your code already tries `gemini-1.5-flash` as a fallback, but you can make it the primary model:

### For Vercel (api/generate-plan.js)

The code already prioritizes `gemini-1.5-flash`. You can also set it explicitly via environment variable:

1. **In Vercel Dashboard:**
   - Add environment variable: `GEMINI_MODEL` = `gemini-1.5-flash`

### For Local Server (server.js)

Update line 32 in `server.js`:

```javascript
// Change from:
model: 'gemini-pro'

// To:
model: 'gemini-1.5-flash'
```

Or set it via environment variable:

```env
# In .env file
GEMINI_MODEL=gemini-1.5-flash
```

Then update `server.js`:
```javascript
model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
```

---

## 5. Test Your API Key

### Quick Test

Use the test harness in your project:

1. **Open `test-models.html`** in your browser
2. **Enter your API key** in the input field
3. **Click "Test All Models"**
4. **Verify** that `gemini-1.5-flash` works ✅

### Command Line Test

```bash
# Test with Node.js script
node test-gemini-models.js
```

### Manual API Test

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello in one sentence"
      }]
    }]
  }'
```

---

## 6. Verify It's Working

### Check Your App

1. **Start your server** (if local):
   ```bash
   npm start
   ```

2. **Open your app** and generate a training plan

3. **Check the console/logs** for:
   ```
   Successfully generated plan using model: gemini-1.5-flash
   ```

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on a deployment → **Functions** tab
3. Click on `/api/generate-plan` → View logs
4. Look for: `Successfully generated plan using model: gemini-1.5-flash`

---

## Troubleshooting

### ❌ Error: "API key is invalid or missing"

**Solutions:**
- ✅ Verify API key is correct (starts with `AIzaSy`)
- ✅ Check environment variable name is exactly `GEMINI_API_KEY`
- ✅ Restart server after adding to `.env`
- ✅ Redeploy on Vercel after adding environment variable

### ❌ Error: "Model not found" or "403 Permission Denied"

**Solutions:**
- ✅ Verify API key has access to Gemini models
- ✅ Check you're using the correct model name: `gemini-1.5-flash`
- ✅ Try `gemini-1.5-pro` or `gemini-pro` as fallback
- ✅ Check Google AI Studio to ensure API is enabled

### ❌ Error: "Quota exceeded" or "429"

**Solutions:**
- ✅ Check your usage in Google AI Studio
- ✅ Free tier has rate limits (60 requests/minute)
- ✅ Wait a minute and try again
- ✅ Consider upgrading to paid tier if needed

### ❌ API Key Not Working

**Check:**
1. ✅ API key copied correctly (no extra spaces)
2. ✅ Environment variable set in correct environment
3. ✅ Server restarted after adding to `.env`
4. ✅ Vercel deployment redeployed after adding variable
5. ✅ Check API key status at: https://aistudio.google.com/apikey

---

## Free Tier Limits

**Gemini API Free Tier:**
- **60 requests per minute**
- **1,500 requests per day**
- **32,000 tokens per minute**
- **1,000,000 tokens per day**

**Gemini 1.5 Flash Pricing:**
- **Input:** $0.075 per million tokens (first 128K tokens)
- **Output:** $0.30 per million tokens
- **Very affordable!** ~$0.45 per 1,000 training plans

---

## Security Best Practices

✅ **DO:**
- Store API key in environment variables
- Use `.env` file for local development (and add to `.gitignore`)
- Never commit API keys to git
- Use different keys for development/production
- Rotate keys periodically

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` files to git
- Share API keys publicly
- Use production keys in development

---

## Next Steps

1. ✅ Get your API key from Google AI Studio
2. ✅ Add it to `.env` for local development
3. ✅ Add it to Vercel environment variables
4. ✅ Update code to use `gemini-1.5-flash`
5. ✅ Test it works
6. ✅ Monitor usage in Google AI Studio

---

## Resources

- **Google AI Studio:** https://aistudio.google.com/apikey
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **Pricing:** https://ai.google.dev/pricing
- **Model List:** https://ai.google.dev/models/gemini

---

## Quick Reference

```bash
# Local setup
echo "GEMINI_API_KEY=AIzaSyYourKeyHere" >> .env
echo "GEMINI_MODEL=gemini-1.5-flash" >> .env

# Vercel setup
vercel env add GEMINI_API_KEY
vercel env add GEMINI_MODEL

# Test
node test-gemini-models.js
```

