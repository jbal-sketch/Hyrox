// Backend Server for Hyrox Training Plan Generator
// Handles Gemini API calls securely (API key never exposed to client)

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate training plan using Gemini AI
 */
app.post('/api/generate-plan', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

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
        res.json({ 
            html: generatedHTML,
            success: true 
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate training plan',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'hyrox-plan-generator' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/generate-plan`);
});

