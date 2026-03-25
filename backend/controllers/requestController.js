const Endpoint = require("../models/WebhookEndpoint")
const Request = require("../models/WebhookRequest")
const webhookAnalyzer = require("../services/webhookAnalyzer")
const unifiedAI = require("../services/unifiedAIService")

exports.getUserRequests = async(req,res)=>{
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" })
    }

    const endpoints = await Endpoint.find({
      userId: userId
    })

    const tokens = endpoints.map(e => e.token)

    const requests = await Request.find({
      token: { $in: tokens }
    }).sort({ timestamp: -1 })

    res.json(requests)
  } catch (error) {
    console.error("Get user requests error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getRequestsByToken = async(req,res)=>{
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({ error: "Token is required" })
    }

    const requests = await Request.find({
      token: token
    }).sort({ timestamp: -1 })

    res.json(requests)
  } catch (error) {
    console.error("Get requests by token error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getRequestById = async(req,res)=>{
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Request ID is required" })
    }

    const request = await Request.findById(id)

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    res.json(request)
  } catch (error) {
    console.error("Get request by ID error:", error)
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    })
  }
}

exports.analyzeRequest = async(req,res)=>{
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Request ID is required" })
    }

    const request = await Request.findById(id)

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    console.log(`🔍 Analyzing request: ${id}`)
    console.log(`📊 Request data: Method=${request.method}, Has Body=${!!request.body}`)

    // Use Unified AI for enhanced analysis
    const analysis = await unifiedAI.analyzeWebhook({
      headers: request.headers || {},
      body: request.body || {},
      method: request.method || 'Unknown',
      ip: request.ip || 'Unknown',
      userAgent: request.userAgent || 'Unknown'
    })

    console.log(`✅ Analysis completed for request: ${id}`)
    console.log(`🎯 Service: ${analysis.service}, Event: ${analysis.eventType}`)

    res.json({
      requestId: request._id,
      ...analysis,
      timestamp: new Date()
    })
  } catch (error) {
    console.error("❌ Analyze request error:", error)
    res.status(500).json({ 
      error: "Analysis failed", 
      details: error.message 
    })
  }
}

exports.securityScan = async(req,res)=>{
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Request ID is required" })
    }

    const request = await Request.findById(id)

    if (!request) {
      return res.status(404).json({ error: "Request not found" })
    }

    console.log(`🔒 Starting security scan for request: ${id}`)
    console.log(`📊 Security data: IP=${request.ip}, Has Headers=${!!request.headers}`)

    // Use Unified AI for enhanced security analysis
    const analysis = await unifiedAI.analyzeWebhook({
      headers: request.headers || {},
      body: request.body || {},
      method: request.method || 'Unknown',
      ip: request.ip || 'Unknown',
      userAgent: request.userAgent || 'Unknown'
    })

    console.log(`✅ Security scan completed for request: ${id}`)
    console.log(`🛡️ Risk Level: ${analysis.security?.riskLevel}, Score: ${analysis.security?.score}`)

    const securityReport = {
      requestId: request._id,
      security: analysis.security,
      service: {
        service: analysis.service,
        confidence: analysis.confidence
      },
      analysis: analysis.analysis,
      calculatedMetrics: analysis.calculatedMetrics,
      enhancedRecommendations: analysis.enhancedRecommendations,
      timestamp: new Date()
    }

    res.json(securityReport)
  } catch (error) {
    console.error("❌ Security scan error:", error)
    res.status(500).json({ 
      error: "Security scan failed", 
      details: error.message 
    })
  }
}