// API Configuration
// Backend proxy endpoint - API key is stored securely on the server

const API_CONFIG = {
    // Backend proxy endpoint (API key is secure on server)
    // For local development:
    endpoint: 'http://localhost:3000/api/generate-plan',
    
    // For production, update to your server URL:
    // endpoint: 'https://your-domain.com/api/generate-plan',
    // Or use relative path if same domain:
    // endpoint: '/api/generate-plan',
    
    // Model settings (used by backend)
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 8000,
    timeout: 120000 // 2 minutes
};

// Make config available globally
window.API_CONFIG = API_CONFIG;
