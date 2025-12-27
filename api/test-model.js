// Vercel Serverless Function to test Gemini models
// This endpoint allows testing which models work with an API key

const { GoogleGenerativeAI } = require('@google/generative-ai');

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

        // Initialize Gemini AI with provided key
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try to get the model
        const geminiModel = genAI.getGenerativeModel({ 
            model: model
        });

        // Test with a simple prompt
        const prompt = testPrompt || "Say 'Hello, this model works!' in one sentence.";
        
        const result = await geminiModel.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
            },
        });

        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ 
            success: true,
            model: model,
            response: text
        });

    } catch (error) {
        console.error('Model test error:', error);
        
        let errorMessage = error.message || 'Unknown error';
        
        // Provide more specific error messages
        if (error.message && error.message.includes('API_KEY')) {
            errorMessage = 'Invalid API key';
        } else if (error.message && (error.message.includes('model') || error.message.includes('Model'))) {
            errorMessage = `Model "${req.body.model}" is not available or invalid`;
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = 'API quota exceeded';
        } else if (error.message && error.message.includes('permission')) {
            errorMessage = 'Permission denied for this model';
        }
        
        return res.status(200).json({ 
            success: false,
            model: req.body.model,
            error: errorMessage
        });
    }
};

