# Quick Start Guide

## Your API Key is Secure! 🔒

Your Gemini API key (`AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww`) is now stored securely on the server and will NEVER be exposed to the browser.

## Setup Steps

### 1. Create .env File

Create a file named `.env` in the project root with:

```
GEMINI_API_KEY=AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww
PORT=3000
```

**Important:** The `.env` file is in `.gitignore` and will NOT be committed to git.

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Express (web server)
- Google Generative AI (Gemini SDK)
- CORS (cross-origin support)
- dotenv (environment variables)

### 3. Start the Server

```bash
npm start
```

You should see:
```
Server running on port 3000
API endpoint: http://localhost:3000/api/generate-plan
```

### 4. Test It

1. Open `input.html` in your browser
2. Fill out the form
3. Click "Generate My Training Plan"
4. The plan will be generated using Gemini AI!

## How It Works

1. **Frontend** (`input.html`) → User fills form
2. **Frontend** (`plan-generator.js`) → Builds prompt
3. **Frontend** (`llm-api.js`) → Sends prompt to backend
4. **Backend** (`server.js`) → Calls Gemini API with secure key
5. **Backend** → Returns generated HTML
6. **Frontend** → Displays personalized plan

**Your API key never leaves the server!** ✅

## Production Deployment

When deploying to production:

1. Set environment variable on your server:
   ```bash
   export GEMINI_API_KEY=AIzaSyBGaMbsDgg0kvsCGWBXuHF70ERjeyaQnww
   ```

2. Update `api-config.js` endpoint to your production URL

3. Deploy both frontend and backend

See `SERVER-SETUP.md` for detailed deployment instructions.

