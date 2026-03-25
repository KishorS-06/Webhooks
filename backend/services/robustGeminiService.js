const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class RobustGeminiService {
  constructor() {
    // Try multiple models for maximum reliability
    this.models = [
      { name: "gemini-1.5-flash", model: null },
      { name: "gemini-pro", model: null }
    ]
    this.currentModelIndex = 0
    this.initializeModels()
  }

  async initializeModels() {
    for (let i = 0; i < this.models.length; i++) {
      try {
        this.models[i].model = genAI.getGenerativeModel({ model: this.models[i].name })
        console.log(`✅ Initialized model: ${this.models[i].name}`)
      } catch (error) {
        console.log(`❌ Failed to initialize ${this.models[i].name}: ${error.message}`)
      }
    }
  }

  async getCurrentModel() {
    if (this.models[this.currentModelIndex].model) {
      return this.models[this.currentModelIndex].model
    }
    
    // Try next available model
    for (let i = 0; i < this.models.length; i++) {
      if (this.models[i].model) {
        this.currentModelIndex = i
        return this.models[i].model
      }
    }
    
    throw new Error("No AI models available")
  }

  async analyzeWebhook(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    console.log('🚀 Starting Robust AI Analysis...')
    console.log(`📊 Request Data: Method=${method}, IP=${ip}, Has Body=${!!body}`)
    
    // Try Gemini AI first
    try {
      const result = await this.tryGeminiAnalysis(requestData)
      if (result) {
        console.log('✅ Gemini AI analysis successful!')
        return result
      }
    } catch (error) {
      console.error('❌ Gemini AI failed:', error.message)
    }
    
    // Fallback to robust pattern matching
    console.log('🧠 Using robust pattern matching fallback...')
    return this.performRobustAnalysis(requestData)
  }

  async tryGeminiAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Robust prompt for reliable analysis
    const prompt = `You are a webhook analysis expert. Analyze this webhook request:

Method: ${method}
IP: ${ip}
User Agent: ${userAgent}
Headers: ${JSON.stringify(headers, null, 2)}
Body: ${JSON.stringify(body, null, 2)}

Provide analysis in this exact JSON format:
{
  "service": "detected_service_name",
  "eventType": "specific_event_type",
  "confidence": "high/medium/low",
  "security": {
    "riskLevel": "low/medium/high",
    "score": 85,
    "concerns": ["specific_concerns"],
    "recommendations": ["security_recommendations"]
  },
  "analysis": {
    "summary": "clear_summary",
    "dataStructure": "payload_structure",
    "keyFields": ["field1", "field2"]
  },
  "recommendations": ["business_recommendations"],
  "calculatedMetrics": {
    "securityScore": 85,
    "riskScore": 20,
    "complexityScore": 40,
    "performanceScore": 90,
    "businessValueScore": 80
  },
  "enhancedRecommendations": {
    "immediate": ["immediate_actions"],
    "shortTerm": ["short_term_actions"],
    "longTerm": ["long_term_actions"],
    "strategic": ["strategic_actions"]
  }
}

Respond ONLY with valid JSON.`

    const model = await this.getCurrentModel()
    console.log(`🤖 Using model: ${this.models[this.currentModelIndex].name}`)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean and parse JSON
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    const analysis = JSON.parse(cleanText)
    
    // Validate and fix response
    return this.validateAndFixResponse(analysis, requestData)
  }

  validateAndFixResponse(analysis, requestData) {
    const { headers, body } = requestData
    
    // Ensure all required fields exist
    if (!analysis.service) {
      analysis.service = this.detectService(headers, body)
    }
    
    if (!analysis.eventType) {
      analysis.eventType = body.event || body.type || 'unknown'
    }
    
    if (!analysis.confidence) {
      analysis.confidence = 'medium'
    }
    
    if (!analysis.security) {
      analysis.security = this.performSecurityAnalysis(headers, body)
    }
    
    if (!analysis.analysis) {
      analysis.analysis = {
        summary: `${analysis.service} webhook processed`,
        dataStructure: `JSON with ${Object.keys(body || {}).length} fields`,
        keyFields: this.extractKeyFields(body)
      }
    }
    
    if (!analysis.recommendations || analysis.recommendations.length === 0) {
      analysis.recommendations = [`Monitor ${analysis.service} webhooks`]
    }
    
    if (!analysis.calculatedMetrics) {
      analysis.calculatedMetrics = {
        securityScore: 75,
        riskScore: 25,
        complexityScore: 50,
        performanceScore: 85,
        businessValueScore: 70
      }
    }
    
    if (!analysis.enhancedRecommendations) {
      analysis.enhancedRecommendations = this.generateEnhancedRecommendations(analysis.service)
    }
    
    // Add metadata
    analysis.aiProvider = this.models[this.currentModelIndex].name
    analysis.analysisTimestamp = new Date().toISOString()
    
    return analysis
  }

  performRobustAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    console.log('🔍 Performing robust pattern matching analysis...')
    
    // Service detection
    const service = this.detectService(headers, body)
    
    // Event analysis
    const eventType = body.event || body.type || body.action || 'unknown'
    
    // Security analysis
    const security = this.performSecurityAnalysis(headers, body)
    
    // Analysis summary
    const analysis = {
      summary: `${service} webhook ${eventType} event processed successfully`,
      dataStructure: `JSON object with ${Object.keys(body || {}).length} fields`,
      keyFields: this.extractKeyFields(body)
    }
    
    // Recommendations
    const recommendations = this.generateRecommendations(service, security.riskLevel)
    
    // Calculated metrics
    const calculatedMetrics = {
      securityScore: security.score,
      riskScore: 100 - security.score,
      complexityScore: this.calculateComplexityScore(body),
      performanceScore: 85,
      businessValueScore: service !== 'Unknown' ? 80 : 50
    }
    
    // Enhanced recommendations
    const enhancedRecommendations = this.generateEnhancedRecommendations(service)
    
    return {
      service,
      eventType,
      confidence: service !== 'Unknown' ? 'high' : 'medium',
      security,
      analysis,
      recommendations,
      calculatedMetrics,
      enhancedRecommendations,
      aiProvider: 'robust_pattern_matching',
      analysisTimestamp: new Date().toISOString()
    }
  }

  detectService(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    // Enhanced service detection patterns
    const services = [
      {
        name: 'Stripe',
        patterns: ['stripe-signature', 'payment_intent', 'charge.succeeded', 'invoice.', 'customer.'],
        events: ['payment_intent.succeeded', 'invoice.payment_succeeded', 'charge.succeeded']
      },
      {
        name: 'GitHub',
        patterns: ['x-github-event', 'x-github-delivery', 'repository', 'push', 'pull_request', 'issues'],
        events: ['push', 'pull_request', 'issues']
      },
      {
        name: 'Slack',
        patterns: ['x-slack-request-timestamp', 'x-slack-signature', 'challenge', 'app_mention', 'message'],
        events: ['message', 'app_mention', 'url_verification']
      },
      {
        name: 'Razorpay',
        patterns: ['x-razorpay-signature', 'payment.captured', 'invoice.paid', 'subscription.'],
        events: ['payment.captured', 'invoice.paid', 'subscription.cancelled']
      },
      {
        name: 'Shopify',
        patterns: ['x-shopify-shop-domain', 'order_created', 'product_created', 'customer_created'],
        events: ['orders/create', 'products/create', 'customers/create']
      },
      {
        name: 'PayPal',
        patterns: ['paypal-auth-algo', 'payment_sale_completed', 'billing_agreement'],
        events: ['PAYMENT.SALE.COMPLETED', 'BILLING.SUBSCRIPTION.CREATED']
      }
    ]
    
    let bestMatch = { name: 'Unknown', score: 0, confidence: 'low' }
    
    for (const service of services) {
      let score = 0
      
      // Check header patterns
      for (const pattern of service.patterns) {
        if (headerStr.includes(pattern)) {
          score += 2
        }
      }
      
      // Check body patterns
      for (const pattern of service.patterns) {
        if (bodyStr.includes(pattern)) {
          score += 1
        }
      }
      
      // Check event match
      if (body.event && service.events.includes(body.event)) {
        score += 3
      }
      
      if (score > bestMatch.score) {
        bestMatch = {
          name: service.name,
          score,
          confidence: score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low'
        }
      }
    }
    
    return bestMatch.name
  }

  performSecurityAnalysis(headers, body, ip) {
    const concerns = []
    const recommendations = []
    let securityScore = 100
    
    // IP address check
    if (!ip || ip === 'unknown' || ip === 'undefined') {
      concerns.push('Missing or invalid IP address')
      securityScore -= 15
    }
    
    // Signature verification check
    const signatureHeaders = [
      'stripe-signature', 'x-razorpay-signature', 'x-hub-signature', 
      'x-slack-signature', 'paypal-auth-algo', 'x-shopify-hmac-sha256'
    ]
    
    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push('No webhook signature verification detected')
      recommendations.push('Implement webhook signature verification')
      securityScore -= 20
    } else {
      recommendations.push('Webhook signature verification present')
    }
    
    // Content-Type check
    if (!headers['content-type']) {
      concerns.push('Missing Content-Type header')
      recommendations.push('Always include Content-Type header')
      securityScore -= 10
    }
    
    // Payload size check
    const payloadSize = JSON.stringify(body || {}).length
    if (payloadSize > 100000) { // 100KB
      concerns.push('Large payload detected')
      recommendations.push('Consider implementing payload size limits')
      securityScore -= 10
    }
    
    // Sensitive data check
    if (body && typeof body === 'object') {
      const sensitiveFields = ['password', 'secret', 'token', 'key', 'credit_card', 'ssn']
      const foundSensitive = sensitiveFields.filter(field => 
        JSON.stringify(body).toLowerCase().includes(field)
      )
      
      if (foundSensitive.length > 0) {
        concerns.push(`Sensitive data detected: ${foundSensitive.join(', ')}`)
        recommendations.push('Ensure sensitive data is properly encrypted')
        securityScore -= 15
      }
    }
    
    // Determine risk level
    const riskLevel = securityScore >= 80 ? 'low' : securityScore >= 60 ? 'medium' : 'high'
    
    return {
      riskLevel,
      score: Math.max(0, securityScore),
      concerns,
      recommendations
    }
  }

  extractKeyFields(body) {
    if (!body || typeof body !== 'object') return []
    
    const importantFields = [
      'event', 'type', 'action', 'amount', 'currency', 'customer', 'user',
      'repository', 'ref', 'message', 'order', 'product', 'subscription'
    ]
    
    return Object.keys(body).filter(key => 
      importantFields.some(important => key.toLowerCase().includes(important))
    ).slice(0, 6)
  }

  calculateComplexityScore(body) {
    if (!body) return 20
    
    const fieldCount = Object.keys(body).length
    const nestedObjects = Object.values(body).filter(v => 
      typeof v === 'object' && v !== null && !Array.isArray(v)
    ).length
    const arrays = Object.values(body).filter(v => Array.isArray(v)).length
    
    let complexity = fieldCount * 2
    complexity += nestedObjects * 5
    complexity += arrays * 3
    
    return Math.min(100, complexity)
  }

  generateRecommendations(service, riskLevel) {
    const recommendations = [
      `Implement ${service.toLowerCase()}-specific validation rules`,
      'Set up monitoring and alerting for webhook failures'
    ]
    
    if (riskLevel === 'high') {
      recommendations.push('Immediate security review required')
      recommendations.push('Review webhook authentication')
    }
    
    if (service === 'Stripe') {
      recommendations.push('Set up payment failure handling')
      recommendations.push('Implement customer notification system')
    } else if (service === 'GitHub') {
      recommendations.push('Set up CI/CD pipeline integration')
      recommendations.push('Implement code review automation')
    } else if (service === 'Slack') {
      recommendations.push('Set up team notification rules')
      recommendations.push('Implement message filtering')
    }
    
    return recommendations
  }

  generateEnhancedRecommendations(service) {
    return {
      immediate: [
        `Verify ${service} webhook endpoint accessibility`,
        'Test webhook payload processing',
        'Check error handling mechanisms'
      ],
      shortTerm: [
        `Implement ${service} event-specific handlers`,
        'Set up webhook delivery monitoring',
        'Create alerting system for failures'
      ],
      longTerm: [
        `Build comprehensive ${service} integration`,
        'Implement webhook analytics dashboard',
        'Create automated testing suite'
      ],
      strategic: [
        `Develop ${service} ecosystem strategy`,
        'Plan webhook-driven automation',
        'Create business intelligence insights'
      ]
    }
  }
}

module.exports = new RobustGeminiService()
