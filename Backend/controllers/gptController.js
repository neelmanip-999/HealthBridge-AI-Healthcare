const OpenAI = require('openai');
const asyncHandler = require('express-async-handler');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatWithGPT = asyncHandler(async (req, res) => {
  const { message, conversationHistory=[] } = req.body;
  if (req.user.role !== 'patient') { res.status(403); throw new Error('Only patients'); }
  try {
    const messages = [{ role: 'system', content: 'You are a helpful medical assistant. Provide general health information and always remind to consult a doctor.' }, ...conversationHistory, { role: 'user', content: message }];
    const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages, max_tokens: 500, temperature: 0.7 });
    const response = completion.choices[0].message.content;
    res.json({ response, usage: completion.usage });
  } catch (err) {
    console.error(err);
    res.status(500); throw new Error('GPT failed');
  }
});

const analyzeSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, age, gender } = req.body;
  if (req.user.role !== 'patient') { res.status(403); throw new Error('Only patients'); }
  try {
    const prompt = `Patient age:${age} gender:${gender} symptoms:${symptoms} Provide possible conditions, precautions, when to seek help, and suggested specialist.`;
    const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages:[{ role:'system', content:'You are a medical assistant. Provide info only.' }, { role:'user', content: prompt }], max_tokens:600, temperature:0.7 });
    res.json({ analysis: completion.choices[0].message.content, disclaimer: 'For informational purposes only.' });
  } catch (err) {
    console.error(err);
    res.status(500); throw new Error('GPT analyze failed');
  }
});

module.exports = { chatWithGPT, analyzeSymptoms };
