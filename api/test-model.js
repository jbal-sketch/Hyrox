// Vercel Serverless Function to test Gemini models
// This endpoint allows testing which models work with an API key
// Uses REST API directly instead of SDK

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
        const { model, apiKey, testPrompt } = req.body;

        if (!model || !apiKey) {
            return res.status(400).json({ 
                success: false,
                error: 'Model name and API key are required' 
            });
        }

        // Test with a simple prompt
        const prompt = testPrompt || "Say 'Hello, this model works!' in one sentence.";
        
        // Use REST API directly
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
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
                console.log('API Error:', {
                    status: response.status,
                    message: errorMsg,
                    details: errorDetails
                });
            } catch (parseError) {
                try {
                    const errorText = await response.text();
                    errorMsg = errorText || errorMsg;
                    console.log('Non-JSON error response:', errorText);
                } catch (textError) {
                    console.log('Could not parse error response');
                }
            }
            
            const fullError = new Error(errorMsg);
            fullError.details = errorDetails;
            fullError.status = response.status;
            throw fullError;
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from Gemini API');
        }

        const text = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ 
            success: true,
            model: model,
            response: text
        });

    } catch (error) {
        console.error('Model test error:', error);
        
        let errorMessage = error.message || 'Unknown error';
        
        // Provide more specific error messages
        const errorMsg = error.message || '';
        
        if (errorMsg.includes('API_KEY') || errorMsg.includes('API key') || errorMsg.includes('API_KEY_INVALID')) {
            errorMessage = 'Invalid API key';
        } else if (errorMsg.includes('model') || errorMsg.includes('Model') || errorMsg.includes('MODEL_NOT_FOUND') || error.status === 400) {
            errorMessage = `Model "${req.body.model}" is not available or invalid`;
            if (error.details) {
                errorMessage += ` - ${JSON.stringify(error.details)}`;
            }
        } else if (errorMsg.includes('quota') || errorMsg.includes('QUOTA') || error.status === 429) {
            errorMessage = 'API quota exceeded';
        } else if (errorMsg.includes('permission') || errorMsg.includes('PERMISSION_DENIED') || error.status === 403) {
            errorMessage = 'Permission denied for this model';
        } else {
            errorMessage = errorMsg || 'Unknown error';
            if (error.details) {
                errorMessage += ` (Details: ${JSON.stringify(error.details)})`;
            }
        }
        
        return res.status(200).json({ 
            success: false,
            model: req.body.model,
            error: errorMessage
        });
    }
};

