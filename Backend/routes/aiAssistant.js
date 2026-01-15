const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
require('dotenv').config();

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, '').trim();
const DEMO_MODE = process.env.DEMO_MODE === 'true';

console.log('🔍 GEMINI_API_KEY status:', apiKey ? '✅ LOADED' : '❌ NOT FOUND');
console.log('📝 DEMO_MODE:', DEMO_MODE ? '✅ ON (using mock responses)' : '❌ OFF (using real API)');

if (!apiKey && !DEMO_MODE) {
  console.error('❌ GEMINI_API_KEY missing in .env file');
  console.log('📝 To get a FREE API key: https://makersuite.google.com/app/apikey');
}

// Mock responses for different health topics
const mockResponses = {
  fever: `
**HealthBridge AI Response:**

Fever is your body's natural defense mechanism against infection. Here's what you should do:

**Immediate Actions:**
- Rest and get adequate sleep
- Stay hydrated - drink water, herbal tea, or warm broth
- Take over-the-counter fever reducers (acetaminophen or ibuprofen) as directed
- Use cool compresses on your forehead
- Wear light, breathable clothing

**When to Seek Medical Help (URGENT):**
- Fever above 103°F (39.4°C)
- Fever lasting more than 3 days
- Severe headache, stiff neck, or confusion
- Difficulty breathing or chest pain
- Severe dehydration symptoms

**Monitor These:**
- Body temperature patterns
- Associated symptoms (cough, sore throat, body aches)
- Fluid intake and hydration status

Remember: While we provide guidance, please see a healthcare provider if fever persists or worsens.
  `,
  
  cough: `
**HealthBridge AI Response:**

A cough can have various causes. Here's guidance on managing it:

**Self-Care Measures:**
- Stay hydrated with warm liquids (honey, lemon water, herbal tea)
- Use humidifiers to moisten the air
- Get adequate rest
- Avoid irritants like smoke or strong perfumes
- Use saline nasal drops if congestion is present

**Over-the-Counter Options:**
- Cough drops or lozenges
- Honey (for adults and children over 1 year)
- Warm steam inhalation

**Seek Medical Help If:**
- Cough persists for more than 2 weeks
- Coughing up blood or discolored mucus
- Severe chest pain when coughing
- Difficulty breathing or shortness of breath
- High fever accompanying the cough

**Track:**
- Duration and frequency of cough
- Type (dry vs. productive)
- Associated symptoms

Persistent coughs need professional evaluation to determine the underlying cause.
  `,
  
  headache: `
**HealthBridge AI Response:**

Headaches can vary in intensity and cause. Here's how to manage them:

**Relief Strategies:**
- Rest in a quiet, dark room
- Apply a cold or warm compress to your head/neck
- Stay hydrated - dehydration is a common cause
- Gentle neck stretches or massage
- Over-the-counter pain relievers (as directed on packaging)
- Avoid caffeine withdrawal suddenly

**Preventive Measures:**
- Regular sleep schedule
- Stress management and relaxation
- Limit screen time
- Stay physically active
- Maintain good posture

**Seek Emergency Care If:**
- Sudden, severe "thunderclap" headache
- Headache with high fever, stiff neck, confusion
- Vision changes or weakness
- Head injury preceding the headache
- Frequent recurring headaches

**Important Notes:**
- Track headache patterns, triggers, and associated symptoms
- Chronic headaches warrant professional evaluation

If headaches are frequent or severe, consult a healthcare provider for proper diagnosis.
  `,
  
  ill: `
**HealthBridge AI Response:**

Sorry to hear you're not feeling well. Here's immediate guidance:

**First Steps:**
- Rest - your body needs energy to fight illness
- Stay hydrated - drink water, clear broths, or electrolyte drinks
- Monitor your symptoms carefully
- Take your temperature if you have access to a thermometer
- Eat light, nutritious foods when ready

**Common Symptom Management:**
- **Fever**: Cool compress, light clothing, appropriate fever reducers
- **Body Aches**: Rest, warm compress, over-the-counter pain relievers
- **Nausea**: Small frequent meals, clear fluids, ginger tea
- **Sore Throat**: Warm salt water gargle, throat lozenges, honey

**Track These Symptoms:**
- Temperature and fever patterns
- Symptom severity and changes
- Duration of illness
- Any new symptoms developing

**SEEK IMMEDIATE MEDICAL HELP IF:**
- Difficulty breathing or chest pain
- Confusion or loss of consciousness
- Severe persistent vomiting
- Blue lips or face discoloration
- Severe abdominal pain
- Symptoms rapidly worsening

**Important:** This guidance is general. If you're severely ill or symptoms worsen, please contact a healthcare professional or visit an urgent care clinic immediately.

Is there a specific symptom you'd like more information about?
  `,
  
  default: (prompt) => `
**HealthBridge AI Response:**

Thank you for your question: "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"

Based on our medical knowledge base, here are some general recommendations:

**General Health Guidance:**
- Consult with a healthcare professional for proper diagnosis
- Maintain a healthy lifestyle with balanced nutrition and exercise
- Get adequate rest (7-9 hours daily)
- Stay hydrated throughout the day
- Practice good hygiene habits

**Important Reminders:**
- This information is educational only, not a medical diagnosis
- Symptoms can vary widely among individuals
- Professional medical evaluation is important for persistent issues
- Don't delay seeking help if symptoms are severe

**When to Seek Medical Help:**
- Symptoms persist for more than a few days
- Symptoms are severe or worsening
- You develop new concerning symptoms
- If in doubt, contact a healthcare professional

**Next Steps:**
- Document your symptoms and when they started
- Note any potential triggers or patterns
- Prepare questions for your healthcare provider
- Keep track of any treatments you try

For specific medical advice tailored to your condition, please consult with a qualified healthcare provider.

Is there something specific about your health concerns you'd like to discuss?
  `
};

function getMockResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for specific health conditions
  if (lowerPrompt.includes('fever') || lowerPrompt.includes('temperature')) {
    return mockResponses.fever;
  }
  if (lowerPrompt.includes('cough') || lowerPrompt.includes('coughing')) {
    return mockResponses.cough;
  }
  if (lowerPrompt.includes('headache') || lowerPrompt.includes('head pain')) {
    return mockResponses.headache;
  }
  if (lowerPrompt.includes('ill') || lowerPrompt.includes('sick') || lowerPrompt.includes('unwell')) {
    return mockResponses.ill;
  }
  
  // Default response
  return mockResponses.default(prompt);
}

router.post('/ask', auth, async (req, res) => {
  console.log('--- POST /api/ai/ask ---');

  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    // Use demo mode if enabled
    if (DEMO_MODE) {
      console.log('📝 DEMO_MODE: Returning mock response');
      const mockResponse = getMockResponse(prompt);
      return res.json({ success: true, response: mockResponse });
    }

    // Production: Use real Gemini API
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GEMINI_API_KEY to .env or enable DEMO_MODE'
      });
    }

    console.log('📨 Sending request to Gemini API...');

    // System prompt for medical context
    const systemPrompt = `You are HealthBridge AI, a trusted medical information assistant.
    - Provide clear, accurate health information
    - Always remind users this is informational, not a diagnosis
    - Encourage consulting real doctors for serious symptoms
    - Be empathetic and supportive
    - Use simple, easy-to-understand language`;

    const userMessage = `User Question: ${prompt}\n\nPlease provide a helpful response:`;

    // Retry logic for rate limiting
    let response;
    let retries = 3;
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        // Call Gemini API directly via REST endpoint
        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userMessage }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          }
        );
        break; // Success, exit retry loop
      } catch (err) {
        lastError = err;
        if (err.response?.status === 429 && i < retries - 1) {
          // Rate limit - wait and retry
          const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`⚠️  Rate limited. Retrying in ${waitTime}ms... (attempt ${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw err;
        }
      }
    }

    // Extract text from response
    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('❌ No text in Gemini response:', response.data);
      return res.status(500).json({
        success: false,
        message: 'Invalid response from Gemini API'
      });
    }

    console.log('✅ Gemini responded successfully');
    res.json({ success: true, response: aiText });

  } catch (err) {
    console.error('❌ Error calling Gemini API:', err.response?.status, err.response?.data?.error?.message || err.message);

    let msg = 'Error communicating with AI service';
    let statusCode = 500;

    if (err.response?.status === 401 || err.response?.status === 403) {
      msg = 'Invalid API key. Please check your GEMINI_API_KEY in .env';
      statusCode = 401;
    } else if (err.response?.status === 429) {
      msg = 'Rate limit exceeded. Google Gemini API is overloaded. Please wait a moment and try again. For unlimited access, upgrade your API quota at: https://console.cloud.google.com/';
      statusCode = 429;
    } else if (err.response?.status === 400) {
      msg = 'Invalid request to AI service. ' + (err.response?.data?.error?.message || 'Please try again');
      statusCode = 400;
    } else if (err.message?.includes('ECONNREFUSED')) {
      msg = 'Cannot connect to AI service. Check your internet connection';
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      message: msg
    });
  }
});

module.exports = router;
