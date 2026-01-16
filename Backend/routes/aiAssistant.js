const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController'); 

// @route   POST /api/ai/ask
// @desc    General AI Health Assistant query (Chatbot)
// @access  Private
router.post('/ask', auth, aiController.askAI);

// @route   POST /api/ai/summarize
// @desc    Summarize a specific consultation (chat history)
// @access  Private
router.post('/summarize', auth, aiController.summarizeConsultation);

// @route   POST /api/ai/query
// @desc    Generic AI Query (Smart Doctor Search, Report Analysis)
// @access  Private
// --- FIXED LINE BELOW ---
router.post('/query', auth, aiController.customQuery); 

module.exports = router;