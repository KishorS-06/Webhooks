const Endpoint = require("../models/WebhookEndpoint")
const Request = require("../models/WebhookRequest")
const { v4: uuidv4 } = require("uuid")
const { ObjectId } = require("mongodb")
const { getLocationFromIP, detectService, analyzeRequestPattern, detectAnomalies } = require("../services/analysisService")
const unifiedAI = require("../services/unifiedAIService")

exports.createWebhook = async (req, res) => {
  try {
    const { userId, name } = req.body

    if (!userId || !name) {
      return res.status(400).json({ error: "User ID and name are required" })
    }

    const token = uuidv4()

    const endpoint = await Endpoint.create({
      userId,
      name,
      token
    })

    // Get public URL from environment or use localhost for development
    const publicUrl = process.env.PUBLIC_WEBHOOK_URL || 'http://localhost:5001'

    res.status(201).json({
      message: "Webhook created successfully",
      webhook_url: `${publicUrl}/hooks/${token}`,
      public_url: `${publicUrl}/hooks/${token}`, // For external services
      local_url: `http://localhost:5001/hooks/${token}`, // For local testing
      token,
      endpoint_id: endpoint._id
    })
  } catch (error) {
    console.error("Create webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getUserWebhooks = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" })
    }

    const webhooks = await Endpoint.find({
      userId: userId
    }).sort({ createdAt: -1 })

    // Add public URLs to each webhook
    const publicUrl = process.env.PUBLIC_WEBHOOK_URL || 'http://localhost:5001'
    const webhooksWithUrls = webhooks.map(webhook => ({
      ...webhook.toObject(),
      public_url: `${publicUrl}/hooks/${webhook.token}`,
      local_url: `http://localhost:5001/hooks/${webhook.token}`,
      webhook_url: `${publicUrl}/hooks/${webhook.token}`
    }))

    res.json(webhooksWithUrls)
  } catch (error) {
    console.error("Get user webhooks error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params

    console.log("Delete webhook request received. ID:", id)
    console.log("ID type:", typeof id)

    if (!id) {
      return res.status(400).json({ error: "Webhook ID is required" })
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format:", id)
      return res.status(400).json({ error: "Invalid webhook ID format" })
    }

    // Find the webhook first to get the token
    const webhook = await Endpoint.findById(id)
    console.log("Found webhook:", webhook)
    
    if (!webhook) {
      console.log("Webhook not found for ID:", id)
      // Try to find all webhooks for debugging
      const allWebhooks = await Endpoint.find({})
      console.log("All webhooks in database:", allWebhooks.map(w => ({ _id: w._id, name: w.name, token: w.token })))
      return res.status(404).json({ error: "Webhook not found" })
    }

    // Delete all requests associated with this webhook
    await Request.deleteMany({ token: webhook.token })

    // Delete the webhook
    await Endpoint.findByIdAndDelete(id)

    res.json({
      message: "Webhook and all associated requests deleted successfully"
    })
  } catch (error) {
    console.error("Delete webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateWebhookConfig = async (req, res) => {
  try {
    const { id } = req.params
    const { responseConfig, isActive, autoResponse } = req.body

    if (!id) {
      return res.status(400).json({ error: "Webhook ID is required" })
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid webhook ID format" })
    }

    const webhook = await Endpoint.findById(id)
    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" })
    }

    // Update response configuration
    if (responseConfig) {
      webhook.responseConfig = {
        ...webhook.responseConfig,
        ...responseConfig
      }
    }

    // Update other settings
    if (typeof isActive === 'boolean') {
      webhook.isActive = isActive
    }
    if (typeof autoResponse === 'boolean') {
      webhook.autoResponse = autoResponse
    }

    await webhook.save()

    res.json({
      message: "Webhook configuration updated successfully",
      webhook: webhook
    })
  } catch (error) {
    console.error("Update webhook config error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getWebhookConfig = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Webhook ID is required" })
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid webhook ID format" })
    }

    const webhook = await Endpoint.findById(id)
    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" })
    }

    res.json({
      webhook: webhook
    })
  } catch (error) {
    console.error("Get webhook config error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.receiveWebhook = async (req, res) => {
  try {
    const token = req.params.token

    if (!token) {
      return res.status(400).json({ error: "Token is required" })
    }

    // Find the webhook endpoint with its response configuration
    const endpoint = await Endpoint.findOne({ token, isActive: true })
    
    if (!endpoint) {
      // Still create a request record for 404 errors so they appear in the tester
      const request = await Request.create({
        token,
        method: req.method,
        statusCode: 404,
        headers: req.headers,
        body: req.body,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
            (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown',
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        url: req.originalUrl,
        timestamp: new Date()
      })

      // Emit to WebSocket for real-time updates
      const io = req.app.get("io")
      if (io) {
        io.emit("new_webhook", request)
      }

      return res.status(404).json({ error: "Webhook endpoint not found or inactive" })
    }

    // Create request record with AI analysis
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
    
    // Get location data
    const location = await getLocationFromIP(clientIP)
    
    // Detect service using AI
    const aiServiceDetection = await unifiedAI.detectWebhookService({
      headers: req.headers,
      body: req.body,
      method: req.method,
      ip: clientIP,
      userAgent: req.get('User-Agent')
    })
    
    const service = aiServiceDetection.service || detectService(req.headers, req.body, req.get('User-Agent'))
    
    // Get historical data for anomaly detection
    const historicalData = await Request.find({ token })
      .sort({ timestamp: -1 })
      .limit(50)
    
    // Detect anomalies
    const anomalies = detectAnomalies(req, historicalData)
    
    // Get AI analysis
    let aiAnalysis = {}
    try {
      aiAnalysis = await unifiedAI.analyzeWebhook({
        headers: req.headers,
        body: req.body,
        method: req.method,
        ip: clientIP,
        userAgent: req.get('User-Agent')
      })
    } catch (error) {
      console.error('AI analysis failed:', error.message)
    }
    
    // Get security scan
    let securityAnalysis = {}
    try {
      securityAnalysis = await unifiedAI.securityScan({
        headers: req.headers,
        body: req.body,
        method: req.method,
        ip: clientIP,
        userAgent: req.get('User-Agent')
      })
    } catch (error) {
      console.error('Security analysis failed:', error.message)
    }
    
    // Determine risk level
    let riskLevel = securityAnalysis.riskLevel || 'low'
    if (anomalies.some(a => a.severity === 'High')) riskLevel = 'high'
    else if (anomalies.some(a => a.severity === 'Medium')) riskLevel = 'medium'
    
    const request = await Request.create({
      token,
      method: req.method,
      statusCode: endpoint.autoResponse ? endpoint.responseConfig.statusCode : 200,
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: clientIP,
      location,
      service,
      analysis: {
        anomalies,
        riskLevel,
        pattern: analyzeRequestPattern(historicalData),
        aiAnalysis,
        securityAnalysis,
        aiServiceDetection
      },
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      url: req.originalUrl,
      timestamp: new Date()
    })

    // Emit to WebSocket for real-time updates
    const io = req.app.get("io")
    if (io) {
      io.emit("new_webhook", request)
    }

    // Apply custom response configuration if auto-response is enabled
    if (endpoint.autoResponse) {
      const config = endpoint.responseConfig
      
      // Apply delay if configured
      if (config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay))
      }

      // Set custom headers
      if (config.headers && config.headers.length > 0) {
        config.headers.forEach(header => {
          if (header.key && header.value) {
            res.set(header.key, header.value)
          }
        })
      }

      // Set content type
      res.set('Content-Type', config.contentType)

      // Send custom response
      try {
        // Try to parse as JSON first
        const parsedBody = JSON.parse(config.body)
        res.status(config.statusCode).json(parsedBody)
      } catch (e) {
        // If not valid JSON, send as plain text
        res.status(config.statusCode).send(config.body)
      }
    } else {
      // Default response when auto-response is disabled
      res.json({
        message: "Webhook received successfully",
        request_id: request._id,
        timestamp: request.timestamp
      })
    }
  } catch (error) {
    console.error("Receive webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}