const express = require('express');
const router = express.Router();
const reportAnalysisController = require('../controllers/reportAnalysisController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Analyze single patient report
router.post('/analyze', reportAnalysisController.analyzeReport);

// Analyze multiple reports in batch
router.post('/analyze/batch', reportAnalysisController.analyzeBatchReports);

// Check ML service health
router.get('/health', reportAnalysisController.checkMLServiceHealth);

module.exports = router;


