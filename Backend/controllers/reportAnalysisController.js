const axios = require('axios');

// FIX 1: Use 127.0.0.1 instead of localhost to prevent IPv6 connection errors
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

/**
 * Analyze patient report using ML model
 */
const analyzeReport = async (req, res) => {
  try {
    const reportData = req.body;
    console.log("🔵 Node.js: Forwarding to ML Service at:", ML_SERVICE_URL);

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

    // Check if Python sent a logical error (even with 200 OK status)
    if (response.data.status === 'error') {
      console.error("🔴 ML Service returned error:", response.data.message);
      return res.status(500).json({
        success: false,
        message: response.data.message || 'Error analyzing report'
      });
    }

    console.log("🟢 ML Analysis Success:", response.data.prediction);

    // FIX 2: Pass EVERYTHING back to frontend (don't filter out modelInfo/featureImportance)
    res.json({
      success: true,
      analysis: {
        ...response.data, // <--- This includes modelInfo, featureImportance, etc.
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🔴 Node Controller Error:', error.message);

    // Handle ML service connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'ML Service is offline. Please ensure ml_service.py is running on port 5001.',
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

    const response = await axios.post(
      `${ML_SERVICE_URL}/predict/batch`,
      { reports },
      { timeout: 60000 }
    );

    res.json({
      success: true,
      analyses: response.data.results,
      count: response.data.results.length
    });

  } catch (error) {
    console.error('Batch Analysis Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check ML service health
 */
const checkMLServiceHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({ success: true, mlService: response.data });
  } catch (error) {
    // Don't log error for health checks to avoid console spam
    res.status(503).json({ success: false, message: 'ML service unavailable' });
  }
};

module.exports = {
  analyzeReport,
  analyzeBatchReports,
  checkMLServiceHealth
};