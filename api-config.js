// API Configuration
// Update this file with your LLM API endpoint

const API_CONFIG = {
    // Your LLM API endpoint
    // Options:
    // 1. Backend proxy endpoint (recommended for security)
    endpoint: '/api/generate-plan',
    
    // 2. Direct OpenAI API (uncomment and configure)
    // endpoint: 'https://api.openai.com/v1/chat/completions',
    // provider: 'openai',
    // apiKey: 'your-api-key-here', // Store securely, not in client code
    
    // 3. Direct Anthropic API (uncomment and configure)
    // endpoint: 'https://api.anthropic.com/v1/messages',
    // provider: 'anthropic',
    // apiKey: 'your-api-key-here',
    
    // Model settings
    model: 'gpt-4-turbo', // or 'claude-3-opus-20240229', etc.
    temperature: 0.7,
    maxTokens: 8000,
    timeout: 120000 // 2 minutes
};

// Make config available globally
window.API_CONFIG = API_CONFIG;

