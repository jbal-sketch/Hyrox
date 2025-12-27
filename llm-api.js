// LLM API Integration for Training Plan Generation
// Handles API calls to generate personalized training plans

// Use API_CONFIG from api-config.js
const LLM_CONFIG = window.API_CONFIG || {
    endpoint: '/api/generate-plan',
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 8000,
    timeout: 120000
};

/**
 * Call LLM API to generate training plan
 * @param {string} prompt - The complete prompt for the LLM
 * @returns {Promise<string>} - Generated HTML training plan
 */
async function callLLMAPI(prompt) {
    try {
        // Show loading state
        showLoadingState();
        
        // Make API call
        const response = await fetch(LLM_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: LLM_CONFIG.model,
                temperature: LLM_CONFIG.temperature,
                max_tokens: LLM_CONFIG.maxTokens
            }),
            signal: AbortSignal.timeout(LLM_CONFIG.timeout)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (data.html) {
            return data.html;
        } else if (data.content) {
            return data.content;
        } else if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else if (typeof data === 'string') {
            return data;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('LLM API Error:', error);
        hideLoadingState();
        throw error;
    }
}

/**
 * Alternative: Direct OpenAI API call
 * Uncomment and configure if using OpenAI directly
 */
/*
async function callOpenAIAPI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LLM_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: LLM_CONFIG.model || 'gpt-4-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Hyrox coach and training plan designer. Generate detailed, personalized training plans in HTML format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 8000
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
*/

/**
 * Alternative: Direct Anthropic Claude API call
 * Uncomment and configure if using Anthropic directly
 */
/*
async function callAnthropicAPI(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': LLM_CONFIG.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: LLM_CONFIG.model || 'claude-3-opus-20240229',
            max_tokens: 8000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}
*/

/**
 * Show loading state during plan generation
 */
function showLoadingState() {
    // Create or update loading overlay
    let loadingOverlay = document.getElementById('plan-generating-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'plan-generating-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
        `;
        document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🏋️</div>
            <h2 style="margin-bottom: 1rem;">Generating Your Training Plan...</h2>
            <p style="margin-bottom: 2rem; opacity: 0.9;">This may take 30-60 seconds</p>
            <div class="spinner" style="
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            "></div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
    loadingOverlay.style.display = 'flex';
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loadingOverlay = document.getElementById('plan-generating-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Handle API errors gracefully
 */
function handleAPIError(error, planId) {
    hideLoadingState();
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 500px;
    `;
    errorDiv.innerHTML = `
        <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Error Generating Plan</h2>
        <p style="margin-bottom: 1.5rem;">${error.message || 'An error occurred while generating your training plan. Please try again.'}</p>
        <div style="display: flex; gap: 1rem;">
            <button onclick="this.closest('div').remove(); window.location.href='input.html';" 
                    style="flex: 1; padding: 0.75rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Go Back
            </button>
            <button onclick="retryPlanGeneration('${planId}'); this.closest('div').remove();" 
                    style="flex: 1; padding: 0.75rem; background: var(--secondary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Retry
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * Retry plan generation
 */
async function retryPlanGeneration(planId) {
    const planData = localStorage.getItem('hyrox_plan_' + planId);
    if (!planData) {
        alert('Plan data not found. Please start over.');
        window.location.href = 'input.html';
        return;
    }
    
    const data = JSON.parse(planData);
    await generatePlanFromData(data, planId);
}

// Make functions available globally
window.callLLMAPI = callLLMAPI;
window.showLoadingState = showLoadingState;
window.hideLoadingState = hideLoadingState;
window.handleAPIError = handleAPIError;
window.retryPlanGeneration = retryPlanGeneration;

