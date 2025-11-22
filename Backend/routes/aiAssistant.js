const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY missing in .env file');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use the latest valid Gemini model name
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
// You can switch to 'gemini-1.5-flash-latest' if you prefer faster responses.

router.post('/ask', auth, async (req, res) => {
  console.log('--- POST /api/ai/ask ---');
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    const fullPrompt = `
      You are HealthBridge AI, a trusted and empathetic medical information assistant.
      Give short, accurate answers, but remind users to consult a real doctor for diagnosis.
      Question: ${prompt}
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    console.log('✅ Gemini responded successfully.');
    res.json({ success: true, response: aiText });
  } catch (err) {
    console.error('❌ Error in Gemini route:', err);
    let msg = 'Internal server error with Gemini API.';

    if (err.status === 404) msg = 'Gemini model not found — try gemini-1.5-pro-latest or gemini-1.5-flash-latest.';
    if (err.status === 403) msg = 'Forbidden — your API key may not have access to this Gemini model.';

    res.status(500).json({ success: false, message: msg, errorDetails: err.message });
  }
});

module.exports = router;
