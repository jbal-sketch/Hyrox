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
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro' // or 'gemini-1.5-pro' for better results
        });

        // System instruction for the AI
        const systemInstruction = `You are an expert Hyrox coach and training plan designer with deep knowledge of functional fitness, endurance training, and race-specific preparation. You create highly personalized, progressive training plans that help athletes achieve their Hyrox race goals.

Generate a complete, week-by-week Hyrox training plan in HTML format. The plan should be detailed, specific, and actionable. Use the exact HTML structure provided in the prompt.`;

        // Generate content
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: systemInstruction + '\n\n' + prompt }]
            }],
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
        return res.status(500).json({ 
            error: 'Failed to generate training plan',
            message: error.message 
        });
    }
};

