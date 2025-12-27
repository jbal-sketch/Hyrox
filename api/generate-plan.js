// Vercel Serverless Function for Gemini API
// This file will be deployed as a serverless function on Vercel

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

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);

        // Get the Gemini model
        // Current available models (as of 2024):
        // - gemini-pro (original, may be deprecated)
        // - gemini-1.5-flash (fast, recommended)
        // - gemini-1.5-pro (may require special access)
        // Try gemini-1.5-flash first, fallback to gemini-pro
        let model;
        let modelName = 'gemini-1.5-flash';
        
        try {
            console.log('Trying model:', modelName);
            model = genAI.getGenerativeModel({ 
                model: modelName
            });
        } catch (e) {
            console.log('Model not available, trying gemini-pro');
            modelName = 'gemini-pro';
            model = genAI.getGenerativeModel({ 
                model: modelName
            });
        }
        
        console.log('Using Gemini model:', modelName);

        // System instruction for the AI
        const systemInstruction = `You are an expert Hyrox coach and training plan designer with deep knowledge of functional fitness, endurance training, and race-specific preparation. You create highly personalized, progressive training plans that help athletes achieve their Hyrox race goals.

Generate a complete, week-by-week Hyrox training plan in HTML format. The plan should be detailed, specific, and actionable. Use the exact HTML structure provided in the prompt.`;

        // Combine system instruction and user prompt
        const fullPrompt = systemInstruction + '\n\n' + prompt;
        
        console.log('Generating plan with prompt length:', fullPrompt.length);

        // Generate content - Gemini API format
        // The generateContent method can accept text directly or use the parts format
        // Try the simpler text format first
        const result = await model.generateContent(fullPrompt, {
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            },
        });

        const response = await result.response;
        const generatedHTML = response.text();

        // Return the generated HTML
        return res.status(200).json({ 
            html: generatedHTML,
            success: true 
        });

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
        
        if (error.message && error.message.includes('API_KEY')) {
            errorMessage = 'Gemini API key is invalid or missing';
            errorDetails = 'Please check that GEMINI_API_KEY is set correctly in Vercel environment variables';
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = 'API quota exceeded';
            errorDetails = 'Gemini API quota has been exceeded. Please check your API usage limits.';
        } else if (error.message && error.message.includes('model')) {
            errorMessage = 'Invalid model name';
            errorDetails = 'The specified Gemini model may not be available. Try using gemini-1.5-pro or gemini-pro';
        }
        
        return res.status(500).json({ 
            error: 'Failed to generate training plan',
            message: errorMessage,
            details: errorDetails,
            fullError: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

