const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Analyze patient report using ML model
 */
const analyzeReport = async (req, res) => {
  try {
    const reportData = req.body;

    if (!reportData || Object.keys(reportData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient report data is required'
      });
    }

    // Call ML service
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, reportData, {
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.status === 'error') {
      return res.status(500).json({
        success: false,
        message: response.data.message || 'Error analyzing report'
      });
    }

    res.json({
      success: true,
      analysis: {
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        probabilities: response.data.probabilities,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in report analysis:', error);

    // Handle ML service connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'ML service is not available. Please ensure the ML service is running.',
        error: 'Service unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error analyzing patient report',
      error: error.message
    });
  }
};

/**
 * Batch analyze multiple patient reports
 */
const analyzeBatchReports = async (req, res) => {
  try {
    const { reports } = req.body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of patient reports is required'
      });
    }

    // Call ML service for batch prediction
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict/batch`,
      { reports },
      { timeout: 60000 } // 60 seconds timeout for batch
    );

    if (response.data.status === 'error') {
      return res.status(500).json({
        success: false,
        message: response.data.message || 'Error analyzing reports'
      });
    }

    res.json({
      success: true,
      analyses: response.data.results,
      count: response.data.results.length
    });

  } catch (error) {
    console.error('Error in batch report analysis:', error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'ML service is not available. Please ensure the ML service is running.',
        error: 'Service unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error analyzing patient reports',
      error: error.message
    });
  }
};

/**
 * Check ML service health
 */
const checkMLServiceHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      mlService: response.data
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service is not available',
      error: error.message
    });
  }
};

module.exports = {
  analyzeReport,
  analyzeBatchReports,
  checkMLServiceHealth
};