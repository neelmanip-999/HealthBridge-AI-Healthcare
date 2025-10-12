const express = require('express');
const router = express.Router();
const { chatWithGPT, analyzeSymptoms } = require('../controllers/gptController');
const { protect, authorize } = require('../middleware/auth');

router.post('/chat', protect, authorize('patient'), chatWithGPT);
router.post('/analyze-symptoms', protect, authorize('patient'), analyzeSymptoms);

module.exports = router;
