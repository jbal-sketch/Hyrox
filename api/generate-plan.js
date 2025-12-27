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
        // Try gemini-2.5-flash first (newest), fallback to others
        const modelsToTry = [
            process.env.GEMINI_MODEL, // User-specified model first
            'gemini-2.5-flash',       // Newest model
            'gemini-1.5-flash',       // Fast and reliable
            'gemini-1.5-pro',         // Higher quality
            'gemini-pro'              // Original fallback
        ].filter(Boolean); // Remove undefined values

        // System instruction for the AI
        const systemInstruction = `You are an expert Hyrox coach and training plan designer with deep knowledge of functional fitness, endurance training, and race-specific preparation. You create highly personalized, progressive training plans that help athletes achieve their Hyrox race goals.

Generate a complete, week-by-week Hyrox training plan in HTML format. The plan should be detailed, specific, and actionable. Use the exact HTML structure provided in the prompt.`;

        // Combine system instruction and user prompt
        const fullPrompt = systemInstruction + '\n\n' + prompt;
        
        console.log('Generating plan with prompt length:', fullPrompt.length);
        console.log('Trying models in order:', modelsToTry);

        // Try each model until one works
        let lastError;
        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting to use model: ${modelName}`);
                
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
                
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
                    const errorData = await response.json();
                    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                    console.log(`Model ${modelName} failed: ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    continue; // Try next model
                }

                const data = await response.json();
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('Invalid response format from Gemini API');
                }

                const generatedHTML = data.candidates[0].content.parts[0].text;
                
                console.log(`Successfully generated plan using model: ${modelName}`);

                // Return the generated HTML
                return res.status(200).json({ 
                    html: generatedHTML,
                    success: true,
                    model: modelName
                });

            } catch (error) {
                console.log(`Model ${modelName} error:`, error.message);
                lastError = error;
                continue; // Try next model
            }
        }

        // If we get here, all models failed
        throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);

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
        
        if (error.message && error.message.includes('API_KEY') || error.message && error.message.includes('API key')) {
            errorMessage = 'Gemini API key is invalid or missing';
            errorDetails = 'Please check that GEMINI_API_KEY is set correctly in Vercel environment variables';
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = 'API quota exceeded';
            errorDetails = 'Gemini API quota has been exceeded. Please check your API usage limits.';
        } else if (error.message && error.message.includes('model') || error.message && error.message.includes('Model')) {
            errorMessage = 'Invalid model name or model not accessible';
            errorDetails = 'None of the tested models are available with your API key. Check the Gemini API documentation for current model names.';
        } else if (error.message && error.message.includes('All models failed')) {
            errorMessage = 'All Gemini models failed';
            errorDetails = error.message;
        }
        
        return res.status(500).json({ 
            error: 'Failed to generate training plan',
            message: errorMessage,
            details: errorDetails,
            fullError: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

