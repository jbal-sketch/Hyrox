# Server Setup Guide

## Overview

The backend server securely handles Gemini API calls. The API key is stored server-side and never exposed to the browser.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already created with your API key. It's in `.gitignore` so it won't be committed.

If you need to recreate it:
```bash
cp .env.example .env
# Then edit .env and add your API key
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 4. Update Frontend Config

If your server runs on a different port or URL, update `api-config.js`:

```javascript
endpoint: 'http://localhost:3000/api/generate-plan'
```

## Production Deployment

### Option 1: Same Domain (Recommended)

If your frontend and backend are on the same domain:

1. Update `api-config.js`:
   ```javascript
   endpoint: '/api/generate-plan'  // Relative path
   ```

2. Configure your web server (nginx, Apache, etc.) to proxy `/api/*` to your Node.js server

### Option 2: Different Domain

1. Update CORS settings in `server.js`:
   ```javascript
   app.use(cors({
       origin: 'https://your-frontend-domain.com'
   }));
   ```

2. Update `api-config.js`:
   ```javascript
   endpoint: 'https://your-backend-domain.com/api/generate-plan'
   ```

## Security Notes

✅ **API Key is Secure:**
- Stored in `.env` file (not in code)
- `.env` is in `.gitignore` (won't be committed)
- Never sent to browser
- Only used server-side

✅ **Best Practices:**
- Use environment variables for API keys
- Never commit `.env` to git
- Use HTTPS in production
- Add rate limiting if needed
- Consider adding authentication

## Testing

1. Start the server: `npm start`
2. Test the endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/generate-plan \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Generate a 4-week Hyrox training plan..."}'
   ```
3. Check health: `curl http://localhost:3000/health`

## Troubleshooting

### Error: "Cannot find module '@google/generative-ai'"
- Run `npm install`

### Error: "GEMINI_API_KEY is not defined"
- Check `.env` file exists
- Verify API key is in `.env`
- Make sure `dotenv` is installed

### Error: "CORS error"
- Check CORS settings in `server.js`
- Verify frontend URL is allowed

### Error: "Connection refused"
- Make sure server is running
- Check the port (default: 3000)
- Verify endpoint URL in `api-config.js`

## Environment Variables

- `GEMINI_API_KEY` - Your Gemini API key (required)
- `PORT` - Server port (default: 3000)

## API Endpoints

### POST `/api/generate-plan`
Generates a training plan using Gemini AI.

**Request:**
```json
{
  "prompt": "Generate a 4-week Hyrox training plan..."
}
```

**Response:**
```json
{
  "html": "<section>...</section>",
  "success": true
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "hyrox-plan-generator"
}
```

