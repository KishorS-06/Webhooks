const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class CleanGeminiService {
  constructor() {
    // Try multiple models for reliability
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
    
    // Clean prompt focused on AI-generated data only
    const prompt = `Analyze this webhook request and provide AI-generated insights:

REQUEST DATA:
- Method: ${method}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Headers: ${JSON.stringify(headers, null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Provide ONLY AI-generated analysis in this exact JSON format:
{
  "service": "detected_service_name",
  "eventType": "specific_event_type_from_body",
  "confidence": "high/medium/low",
  "security": {
    "riskLevel": "low/medium/high/critical",
    "score": 0-100,
    "concerns": ["specific_security_concerns"],
    "recommendations": ["security_recommendations"]
  },
  "analysis": {
    "summary": "executive_summary_of_webhook_purpose",
    "dataStructure": "analysis_of_payload_structure",
    "keyFields": ["important_fields_in_payload"]
  },
  "recommendations": ["actionable_business_recommendations"],
  "calculatedMetrics": {
    "securityScore": 0-100,
    "riskScore": 0-100,
    "complexityScore": 0-100,
    "performanceScore": 0-100,
    "businessValueScore": 0-100
  },
  "enhancedRecommendations": {
    "immediate": ["immediate_action_items"],
    "shortTerm": ["short_term_recommendations"],
    "longTerm": ["long_term_strategies"],
    "strategic": ["strategic_initiatives"]
  }
}

CRITICAL: Respond ONLY with valid JSON - no markdown, no explanations, no extra text`

    try {
      const model = await this.getCurrentModel()
      console.log(`🚀 Using AI model: ${this.models[this.currentModelIndex].name}`)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Clean and parse JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      const analysis = JSON.parse(cleanText)
      
      // Add only essential AI provider info
      analysis.aiProvider = this.models[this.currentModelIndex].name
      analysis.analysisTimestamp = new Date().toISOString()
      
      console.log('✅ Clean AI Analysis Successful!')
      console.log(`🎯 Service: ${analysis.service}`)
      console.log(`🔍 Event: ${analysis.eventType}`)
      console.log(`🛡️ Risk: ${analysis.security?.riskLevel}`)
      console.log(`📊 Security Score: ${analysis.calculatedMetrics?.securityScore}`)
      
      return analysis
      
    } catch (error) {
      console.error('❌ AI Analysis Failed:', error.message)
      
      // Try next model
      if (this.currentModelIndex < this.models.length - 1) {
        this.currentModelIndex++
        console.log(`🔄 Trying next model: ${this.models[this.currentModelIndex].name}`)
        return this.analyzeWebhook(requestData)
      }
      
      // Clean fallback - only essential AI-generated data
      console.log('🧠 Using clean fallback analysis')
      return this.cleanFallbackAnalysis(requestData)
    }
  }

  cleanFallbackAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Clean pattern matching with only AI-generated fields
    const serviceDetection = this.detectService(headers, body)
    const eventAnalysis = this.analyzeEvent(body, serviceDetection)
    const securityAnalysis = this.performSecurityAnalysis(headers, body, ip)
    
    return {
      service: serviceDetection.name,
      eventType: eventAnalysis.type,
      confidence: serviceDetection.confidence,
      security: securityAnalysis,
      analysis: {
        summary: `${serviceDetection.name} webhook ${eventAnalysis.type} event processed`,
        dataStructure: `JSON object with ${Object.keys(body || {}).length} fields`,
        keyFields: this.extractKeyFields(body)
      },
      recommendations: this.generateRecommendations(serviceDetection.name, securityAnalysis.riskLevel),
      calculatedMetrics: {
        securityScore: securityAnalysis.score,
        riskScore: securityAnalysis.riskScore,
        complexityScore: this.calculateComplexityScore(body),
        performanceScore: 85,
        businessValueScore: serviceDetection.name !== 'Unknown' ? 80 : 50
      },
      enhancedRecommendations: {
        immediate: this.generateImmediateRecommendations(serviceDetection.name),
        shortTerm: this.generateShortTermRecommendations(serviceDetection.name),
        longTerm: this.generateLongTermRecommendations(serviceDetection.name),
        strategic: this.generateStrategicRecommendations(serviceDetection.name)
      },
      aiProvider: 'clean_pattern_matching',
      analysisTimestamp: new Date().toISOString()
    }
  }

  detectService(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    const services = [
      { name: 'Stripe', patterns: ['stripe-signature', 'payment_intent', 'charge.succeeded'] },
      { name: 'GitHub', patterns: ['x-github-event', 'x-github-delivery', 'repository', 'push'] },
      { name: 'Slack', patterns: ['x-slack-request-timestamp', 'x-slack-signature', 'challenge'] },
      { name: 'Razorpay', patterns: ['x-razorpay-signature', 'payment.captured', 'invoice.paid'] },
      { name: 'Shopify', patterns: ['x-shopify-shop-domain', 'order_created', 'product_created'] },
      { name: 'PayPal', patterns: ['paypal-auth-algo', 'payment_sale_completed'] }
    ]
    
    let bestMatch = { name: 'Unknown', confidence: 'low', score: 0 }
    
    for (const service of services) {
      let score = 0
      for (const pattern of service.patterns) {
        if (headerStr.includes(pattern) || bodyStr.includes(pattern)) {
          score += 1
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = {
          name: service.name,
          confidence: score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low',
          score
        }
      }
    }
    
    return bestMatch
  }

  analyzeEvent(body, serviceDetection) {
    const eventType = body.event || body.type || body.action || 'unknown'
    
    const eventMap = {
      'Stripe': {
        'payment_intent.succeeded': { type: 'payment_intent.succeeded' },
        'invoice.payment_succeeded': { type: 'invoice.payment_succeeded' }
      },
      'GitHub': {
        'push': { type: 'push' },
        'pull_request': { type: 'pull_request' }
      }
    }
    
    const serviceEvents = eventMap[serviceDetection.name] || {}
    return serviceEvents[eventType] || { type: eventType }
  }

  performSecurityAnalysis(headers, body, ip) {
    const concerns = []
    const recommendations = []
    let riskScore = 0
    let securityScore = 100
    
    if (!ip || ip === 'unknown') {
      concerns.push('Missing IP address')
      riskScore += 15
      securityScore -= 15
    }
    
    const signatureHeaders = ['stripe-signature', 'x-razorpay-signature', 'x-hub-signature', 'x-slack-signature']
    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push('No webhook signature verification')
      recommendations.push('Implement webhook signature verification')
      riskScore += 25
      securityScore -= 25
    } else {
      recommendations.push('Webhook signature verification present')
    }
    
    const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'
    
    return {
      riskLevel,
      score: Math.max(0, securityScore),
      riskScore: Math.min(100, riskScore),
      concerns,
      recommendations
    }
  }

  extractKeyFields(body) {
    if (!body || typeof body !== 'object') return []
    
    const importantFields = ['event', 'type', 'amount', 'currency', 'customer', 'repository', 'action', 'message']
    return Object.keys(body).filter(key => 
      importantFields.some(important => key.toLowerCase().includes(important))
    ).slice(0, 5)
  }

  calculateComplexityScore(body) {
    if (!body) return 30
    const fieldCount = Object.keys(body).length
    return Math.min(100, fieldCount * 3)
  }

  generateRecommendations(serviceName, riskLevel) {
    const recommendations = [
      `Implement ${serviceName.toLowerCase()}-specific validation rules`,
      'Set up monitoring and alerting for webhook failures'
    ]
    
    if (riskLevel === 'high') {
      recommendations.push('Immediate security review required')
    }
    
    return recommendations
  }

  generateImmediateRecommendations(serviceName) {
    return [
      `Verify ${serviceName} webhook endpoint is accessible`,
      'Check webhook payload structure matches expectations'
    ]
  }

  generateShortTermRecommendations(serviceName) {
    return [
      `Implement ${serviceName} event-specific handling logic`,
      'Set up webhook delivery monitoring'
    ]
  }

  generateLongTermRecommendations(serviceName) {
    return [
      `Build comprehensive ${serviceName} integration automation`,
      'Implement webhook analytics dashboard'
    ]
  }

  generateStrategicRecommendations(serviceName) {
    return [
      `Develop ${serviceName} ecosystem integration strategy`,
      'Create webhook-driven business process optimization'
    ]
  }
}

module.exports = new CleanGeminiService()
