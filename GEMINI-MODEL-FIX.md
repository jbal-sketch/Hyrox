# Gemini Model Name Fix

## Issue
Getting "Invalid model name" error when generating plans.

## Solution

The Gemini API model names have changed. Your API key might need to use a specific model name.

### Option 1: Use gemini-1.0-pro (Newer API)

Update `api/generate-plan.js` to use:
```javascript
const modelName = 'gemini-1.0-pro';
```

### Option 2: Check Available Models

You can test which models work with your API key by checking the Gemini API documentation or testing different model names:

- `gemini-pro` (original)
- `gemini-1.0-pro` (newer)
- `gemini-1.5-flash` (if available)
- `gemini-1.5-pro` (if available)

### Option 3: Set Model via Environment Variable

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add: `GEMINI_MODEL` = `gemini-1.0-pro` (or whatever model works)
3. Redeploy

### Testing

To test which model works, you can temporarily modify the code to try different models:

```javascript
const modelsToTry = ['gemini-1.0-pro', 'gemini-pro', 'gemini-1.5-flash'];
for (const modelName of modelsToTry) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Model ${modelName} works!`);
        break;
    } catch (e) {
        console.log(`Model ${modelName} failed:`, e.message);
    }
}
```

## Current Fix Applied

The code now uses `gemini-pro` as the default, which should work with most API keys. If it still fails, your API key might need to be updated or you may need to use a different model name.

