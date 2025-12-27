// Vercel Serverless Function for Gemini API
// This file will be deployed as a serverless function on Vercel
// Uses REST API directly instead of SDK for better compatibility

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Get API key from environment variable (set in Vercel dashboard)
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'API key not configured' 
            });
        }

        // Get model name from environment or use default
        // Use only gemini-2.5-flash
        const modelsToTry = [
            process.env.GEMINI_MODEL || 'gemini-2.5-flash', // Use environment variable or default to gemini-2.5-flash
            'gemini-2.5-flash'        // Only model to use
        ].filter(Boolean); // Remove undefined values

        // System instruction for the AI
        const systemInstruction = `You are an expert Hyrox coach and training plan designer with deep knowledge of functional fitness, endurance training, and race-specific preparation. You create highly personalized, progressive training plans that help athletes achieve their Hyrox race goals.

Generate a complete, week-by-week Hyrox training plan in HTML format. The plan should be detailed, specific, and actionable. Use the exact HTML structure provided in the prompt.`;

        // Combine system instruction and user prompt
        const fullPrompt = systemInstruction + '\n\n' + prompt;
        
        console.log('Generating plan with prompt length:', fullPrompt.length);
        console.log('Trying models in order:', modelsToTry);

        // Try each model until one works
        // Also try both v1beta and v1 API endpoints
        const apiVersions = ['v1beta', 'v1'];
        let lastError;
        
        for (const modelName of modelsToTry) {
            for (const apiVersion of apiVersions) {
                try {
                    console.log(`Attempting to use model: ${modelName} with API ${apiVersion}`);
                    
                    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
                    
                    const payload = {
                        contents: [{
                            parts: [{
                                text: fullPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 8192,
                        }
                    };

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                if (!response.ok) {
                    let errorMsg = `HTTP ${response.status}`;
                    let errorDetails = {};
                    
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error?.message || errorData.error?.status || errorMsg;
                        errorDetails = errorData.error || {};
                        console.log(`Model ${modelName} failed:`, {
                            status: response.status,
                            message: errorMsg,
                            details: errorDetails
                        });
                    } catch (parseError) {
                        // If response isn't JSON, try to get text
                        try {
                            const errorText = await response.text();
                            errorMsg = errorText || errorMsg;
                            console.log(`Model ${modelName} failed with non-JSON response:`, errorText);
                        } catch (textError) {
                            console.log(`Model ${modelName} failed: HTTP ${response.status} ${response.statusText}`);
                        }
                    }
                    
                    lastError = new Error(errorMsg);
                    lastError.details = errorDetails;
                    lastError.status = response.status;
                    continue; // Try next model
                }

                const data = await response.json();
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('Invalid response format from Gemini API');
                }

                    const generatedHTML = data.candidates[0].content.parts[0].text;
                    
                    console.log(`Successfully generated plan using model: ${modelName} with API ${apiVersion}`);

                    // Return the generated HTML
                    return res.status(200).json({ 
                        html: generatedHTML,
                        success: true,
                        model: modelName,
                        apiVersion: apiVersion
                    });

                } catch (error) {
                    console.log(`Model ${modelName} (${apiVersion}) error:`, {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                    lastError = error;
                    continue; // Try next API version or model
                }
            }
        }

        // If we get here, all models failed
        const allErrors = `All models failed. Last error: ${lastError?.message || 'Unknown error'}`;
        console.error('All models failed:', {
            modelsTried: modelsToTry,
            lastError: lastError?.message,
            lastErrorDetails: lastError?.details,
            lastErrorStatus: lastError?.status
        });
        throw new Error(allErrors);

    } catch (error) {
        console.error('Gemini API Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Provide more detailed error information
        let errorMessage = error.message || 'Unknown error';
        let errorDetails = '';
        
        // Check for specific error types from Gemini API
        const lastErrorMsg = error.message || '';
        
        if (lastErrorMsg.includes('API_KEY') || lastErrorMsg.includes('API key') || lastErrorMsg.includes('API_KEY_INVALID')) {
            errorMessage = 'Gemini API key is invalid or missing';
            errorDetails = 'Please check that GEMINI_API_KEY is set correctly in Vercel environment variables';
        } else if (lastErrorMsg.includes('quota') || lastErrorMsg.includes('QUOTA') || lastErrorMsg.includes('429')) {
            errorMessage = 'API quota exceeded';
            errorDetails = 'Gemini API quota has been exceeded. Please check your API usage limits.';
        } else if (lastErrorMsg.includes('model') || lastErrorMsg.includes('Model') || lastErrorMsg.includes('MODEL_NOT_FOUND') || lastErrorMsg.includes('400')) {
            errorMessage = 'Invalid model name or model not accessible';
            errorDetails = `None of the tested models (${modelsToTry.join(', ')}) are available with your API key. The last error was: ${lastErrorMsg}. Check the Gemini API documentation for current model names or try using the test harness to find a working model.`;
        } else if (lastErrorMsg.includes('All models failed')) {
            errorMessage = 'All Gemini models failed';
            errorDetails = `${lastErrorMsg}. Models tried: ${modelsToTry.join(', ')}. Check Vercel function logs for detailed error messages.`;
        } else if (lastErrorMsg.includes('403') || lastErrorMsg.includes('PERMISSION_DENIED')) {
            errorMessage = 'Permission denied';
            errorDetails = 'Your API key does not have permission to access Gemini models. Check your API key permissions in Google AI Studio.';
        } else {
            errorMessage = 'Failed to generate plan';
            errorDetails = `Error: ${lastErrorMsg}. Check Vercel function logs for more details.`;
        }
        
        return res.status(500).json({ 
            error: 'Failed to generate training plan',
            message: errorMessage,
            details: errorDetails,
            fullError: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

