const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
require('dotenv').config();

// Check for API key
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Try using the full model path format first
    try {
      model = genAI.getGenerativeModel({ model: 'models/gemini-pro' });
      console.log('✅ Gemini AI initialized successfully with models/gemini-pro');
    } catch (pathError) {
      // Fallback to short name
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('✅ Gemini AI initialized successfully with gemini-pro');
    }
  } catch (error) {
    console.error('❌ Error initializing Gemini AI:', error.message);
  }
} else {
  console.error('❌ GEMINI_API_KEY missing in .env file');
  console.log('📝 To get a FREE API key:');
  console.log('   1. Visit: https://makersuite.google.com/app/apikey');
  console.log('   2. Create a new API key');
  console.log('   3. Add it to your .env file as: GEMINI_API_KEY=your_api_key_here');
}

router.post('/ask', auth, async (req, res) => {
  console.log('--- POST /api/ai/ask ---');
  
  // Check if Gemini is configured
  if (!model || !genAI) {
    return res.status(503).json({ 
      success: false, 
      message: 'AI service is not configured. Please add GEMINI_API_KEY to your .env file. Get a free key at: https://makersuite.google.com/app/apikey' 
    });
  }

  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    // Enhanced prompt for better medical responses
    const fullPrompt = `
      You are HealthBridge AI, a trusted and empathetic medical information assistant.
      Your role is to provide helpful health information while emphasizing the importance of professional medical consultation.
      
      Guidelines:
      - Give clear, concise, and accurate answers
      - Always remind users that this is informational only, not a diagnosis
      - Encourage consulting a real doctor for serious symptoms
      - Be empathetic and supportive
      - Use simple language that's easy to understand
      
      User Question: ${prompt}
      
      Please provide a helpful response:
    `;

    let result;
    let response;
    let aiText;
    
    try {
      result = await model.generateContent(fullPrompt);
      response = await result.response;
      aiText = response.text();
    } catch (modelError) {
      // If gemini-pro fails, try alternative models
      if (modelError.status === 404 || modelError.message?.includes('not found')) {
        console.log('⚠️  gemini-pro not available, trying alternative models...');
        const alternativeModels = ['models/gemini-pro', 'gemini-pro', 'gemini-1.5-pro', 'models/gemini-1.5-pro'];
        
        for (const altModelName of alternativeModels) {
          try {
            const altModel = genAI.getGenerativeModel({ model: altModelName });
            result = await altModel.generateContent(fullPrompt);
            response = await result.response;
            aiText = response.text();
            console.log(`✅ Successfully used alternative model: ${altModelName}`);
            break;
          } catch (altError) {
            console.log(`⚠️  Model ${altModelName} also failed, trying next...`);
            continue;
          }
        }
        
        if (!aiText) {
          throw new Error('All model attempts failed. Please check your API key and model availability.');
        }
      } else {
        throw modelError;
      }
    }

    console.log('✅ Gemini responded successfully.');
    res.json({ success: true, response: aiText });
  } catch (err) {
    console.error('❌ Error in Gemini route:', err);
    let msg = 'Internal server error with Gemini API.';
    let statusCode = 500;

    // Handle specific error cases
    if (err.status === 404 || err.message?.includes('not found')) {
      msg = 'Gemini model not found. Your API key may not have access to the requested model. Please check your API key permissions or try a different model.';
      statusCode = 404;
    } else if (err.status === 403) {
      msg = 'API key access denied. Please check your GEMINI_API_KEY.';
      statusCode = 403;
    } else if (err.status === 429) {
      msg = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (err.message?.includes('API key')) {
      msg = 'Invalid API key. Please check your GEMINI_API_KEY in .env file.';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false, 
      message: msg,
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
