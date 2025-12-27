# LLM API Setup Guide

## Overview

The training plan generator uses an LLM (Large Language Model) API to create personalized training plans. You need to configure the API endpoint in `api-config.js`.

## Setup Options

### Option 1: Backend Proxy (Recommended)

**Why:** Keeps API keys secure on the server, not exposed to clients.

1. Create a backend endpoint (Node.js, Python, etc.) that:
   - Receives the prompt
   - Calls your LLM API (OpenAI, Anthropic, etc.)
   - Returns the generated HTML

2. Update `api-config.js`:
   ```javascript
   endpoint: '/api/generate-plan'  // Your backend endpoint
   ```

3. Example backend endpoint (Node.js/Express):
   ```javascript
   app.post('/api/generate-plan', async (req, res) => {
       const { prompt } = req.body;
       
       // Call OpenAI
       const response = await openai.chat.completions.create({
           model: 'gpt-4-turbo',
           messages: [
               { role: 'system', content: 'You are an expert Hyrox coach...' },
               { role: 'user', content: prompt }
           ],
           temperature: 0.7,
           max_tokens: 8000
       });
       
       res.json({ html: response.choices[0].message.content });
   });
   ```

### Option 2: Direct OpenAI API

**Note:** This exposes your API key in client code. Not recommended for production.

1. Update `api-config.js`:
   ```javascript
   endpoint: 'https://api.openai.com/v1/chat/completions',
   provider: 'openai',
   apiKey: 'your-api-key-here'
   ```

2. Uncomment the `callOpenAIAPI` function in `llm-api.js`

3. Update `callLLMAPI` to use `callOpenAIAPI` instead

### Option 3: Direct Anthropic API

Similar to Option 2, but for Claude:

1. Update `api-config.js`:
   ```javascript
   endpoint: 'https://api.anthropic.com/v1/messages',
   provider: 'anthropic',
   apiKey: 'your-api-key-here'
   ```

2. Uncomment the `callAnthropicAPI` function in `llm-api.js`

## API Response Format

Your API should return JSON in one of these formats:

```javascript
// Format 1 (preferred)
{ html: "<section>...</section>" }

// Format 2
{ content: "<section>...</section>" }

// Format 3 (OpenAI format)
{ choices: [{ message: { content: "<section>...</section>" } }] }

// Format 4 (Anthropic format)
{ content: [{ text: "<section>...</section>" }] }
```

## Testing

1. Open browser console
2. Test the API call:
   ```javascript
   const testPrompt = "Generate a 4-week Hyrox training plan...";
   callLLMAPI(testPrompt).then(html => console.log(html));
   ```

## Security Notes

- **Never commit API keys** to version control
- Use environment variables for API keys
- Use a backend proxy in production
- Implement rate limiting
- Add authentication if needed

## Troubleshooting

### Error: "API error: 401"
- Check your API key is correct
- Verify API key has proper permissions

### Error: "API error: 429"
- Rate limit exceeded
- Implement retry logic or reduce requests

### Error: "Timeout"
- Increase timeout in `api-config.js`
- Check network connection
- Verify API endpoint is accessible

### Error: "Unexpected API response format"
- Check your API returns one of the supported formats
- Update `callLLMAPI` to handle your specific format

## Next Steps

1. Choose your setup option
2. Configure `api-config.js`
3. Test with a simple prompt
4. Deploy and monitor

