// API Configuration
// Backend proxy endpoint - API key is stored securely on the server

// Auto-detect environment and set endpoint
function getApiEndpoint() {
    // If we're on a Vercel deployment, use relative paths
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('localhost')) {
        return '/api/generate-plan';
    }
    
    // For custom domains, you can set a specific endpoint here
    // Or use relative path if frontend and backend are on same domain
    return '/api/generate-plan';
}

const API_CONFIG = {
    // Backend proxy endpoint (API key is secure on server)
    // Automatically detects environment
    endpoint: getApiEndpoint(),
    
    // For local development with separate server, uncomment:
    // endpoint: 'http://localhost:3000/api/generate-plan',
    
    // For production with different domain, set explicitly:
    // endpoint: 'https://your-backend-domain.com/api/generate-plan',
    
    // Model settings (used by backend)
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 8000,
    timeout: 120000 // 2 minutes
};

// Make config available globally
window.API_CONFIG = API_CONFIG;
