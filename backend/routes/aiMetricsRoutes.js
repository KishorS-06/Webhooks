const express = require('express')
const router = express.Router()
const {
  getAICalculatedMetrics,
  getRealTimeMetrics,
  getPredictiveAnalytics
} = require('../controllers/aiMetricsController')

// Get AI-powered dashboard metrics
router.get('/metrics/:userId', getAICalculatedMetrics)

// Get real-time metrics
router.get('/realtime/:userId', getRealTimeMetrics)

// Get predictive analytics
router.get('/predictions/:userId', getPredictiveAnalytics)

module.exports = router
