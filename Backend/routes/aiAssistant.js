// backend/routes/aiAssistant.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * @route   POST /api/ai-assistant/query
 * @desc    Send query to ChatGPT and get health-related response
 * @access  Private (requires authentication)
 */
router.post('/query', auth, async (req, res) => {
    try {
        const { query } = req.body;

        // Validate input
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'AI service is not configured. Please contact administrator.'
            });
        }

        // System prompt for health-focused responses
        const systemPrompt = `You are a helpful AI health assistant for HealthBridge platform. 
        Provide informative, accurate, and empathetic responses to health-related questions. 
        Always remind users to consult with healthcare professionals for serious concerns or diagnosis. 
        Keep responses concise (under 200 words), clear, and easy to understand.
        If asked about something unrelated to health, politely redirect to health topics.
        Use a warm, professional, and caring tone.`;

        console.log(`AI Query from user ${req.user.id}: ${query}`);

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // or "gpt-4" if you have access
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        const aiResponse = completion.choices[0].message.content;

        console.log(`AI Response generated successfully`);

        return res.status(200).json({
            success: true,
            response: aiResponse,
            tokens: completion.usage.total_tokens
        });

    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        
        // Handle specific OpenAI errors
        if (error.code === 'insufficient_quota') {
            return res.status(429).json({
                success: false,
                message: 'AI service quota exceeded. Please try again later.'
            });
        }

        if (error.code === 'invalid_api_key') {
            return res.status(500).json({
                success: false,
                message: 'AI service configuration error. Please contact administrator.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to get AI response. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;