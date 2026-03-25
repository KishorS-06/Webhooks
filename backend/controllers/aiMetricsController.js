const Request = require("../models/WebhookRequest")
const Endpoint = require("../models/WebhookEndpoint")
const AICalculator = require("../services/aiCalculatorService")

exports.getAICalculatedMetrics = async (req, res) => {
  try {
    const { userId } = req.params
    
    console.log('🧮 Starting AI-powered metrics calculation...')
    console.log(`👤 User ID: ${userId}`)
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" })
    }

    // Get all webhooks for the user
    const endpoints = await Endpoint.find({ userId: userId })
    const tokens = endpoints.map(e => e.token)
    
    // Get all requests for these webhooks
    const requests = await Request.find({ 
      token: { $in: tokens } 
    }).sort({ timestamp: -1 })
    
    console.log(`📊 Found ${requests.length} requests and ${endpoints.length} webhooks`)
    
    // Calculate AI-powered metrics
    const metrics = await AICalculator.calculateDashboardMetrics(requests, endpoints)
    
    console.log('✅ AI-powered metrics calculation completed!')
    console.log(`📈 Health Score: ${metrics.overview.healthScore}`)
    console.log(`🛡️ Security Score: ${metrics.security.securityScore}`)
    console.log(`⚡ Performance Score: ${metrics.performance.performanceScore}`)
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
      metadata: {
        totalRequests: requests.length,
        totalWebhooks: endpoints.length,
        calculationMethod: metrics.aiProvider || 'intelligent_calculation'
      }
    })
    
  } catch (error) {
    console.error("❌ AI metrics calculation error:", error)
    res.status(500).json({ 
      error: "Failed to calculate AI metrics", 
      details: error.message 
    })
  }
}

exports.getRealTimeMetrics = async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get recent requests (last hour)
    const endpoints = await Endpoint.find({ userId: userId })
    const tokens = endpoints.map(e => e.token)
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await Request.find({ 
      token: { $in: tokens },
      timestamp: { $gte: oneHourAgo }
    }).sort({ timestamp: -1 })
    
    // Calculate real-time metrics
    const metrics = await AICalculator.calculateDashboardMetrics(recentRequests, endpoints)
    
    res.json({
      success: true,
      data: metrics,
      realtime: true,
      timeWindow: 'last_hour',
      timestamp: new Date()
    })
    
  } catch (error) {
    console.error("❌ Real-time metrics error:", error)
    res.status(500).json({ 
      error: "Failed to get real-time metrics", 
      details: error.message 
    })
  }
}

exports.getPredictiveAnalytics = async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get historical data for predictions
    const endpoints = await Endpoint.find({ userId: userId })
    const tokens = endpoints.map(e => e.token)
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const historicalRequests = await Request.find({ 
      token: { $in: tokens },
      timestamp: { $gte: oneWeekAgo }
    }).sort({ timestamp: -1 })
    
    // Calculate metrics with predictions
    const metrics = await AICalculator.calculateDashboardMetrics(historicalRequests, endpoints)
    
    // Return only prediction-related data
    res.json({
      success: true,
      data: {
        predictions: metrics.predictions,
        insights: metrics.insights,
        overview: {
          totalRequests: metrics.overview.totalRequests,
          trend: metrics.overview.trend,
          healthScore: metrics.overview.healthScore
        },
        performance: {
          throughput: metrics.performance.throughput,
          capacityUtilization: metrics.predictions.capacityUtilization
        }
      },
      predictionHorizon: 'next_24_hours',
      timestamp: new Date()
    })
    
  } catch (error) {
    console.error("❌ Predictive analytics error:", error)
    res.status(500).json({ 
      error: "Failed to get predictive analytics", 
      details: error.message 
    })
  }
}
