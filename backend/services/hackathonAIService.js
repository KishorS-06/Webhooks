const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class HackathonWinningAIService {
  constructor() {
    // Try multiple models to ensure we get working AI
    this.models = [
      { name: "gemini-1.5-flash", model: null },
      { name: "gemini-pro", model: null },
      { name: "gemini-1.5-pro-latest", model: null }
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
    
    // Enhanced prompt for hackathon-winning analysis
    const prompt = `You are an expert webhook analyst for a hackathon project. Analyze this webhook request with exceptional detail and business intelligence.

REQUEST DATA:
- Method: ${method}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Headers: ${JSON.stringify(headers, null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Provide comprehensive analysis in this exact JSON format:
{
  "service": {
    "name": "detected_service_name",
    "confidence": "high/medium/low",
    "description": "detailed_service_description",
    "category": "payment/development/communication/ecommerce/other"
  },
  "event": {
    "type": "specific_event_type",
    "action": "what_this_event_does",
    "businessImpact": "business_value_and_impact",
    "priority": "critical/high/medium/low",
    "automationPotential": "high/medium/low"
  },
  "security": {
    "riskLevel": "low/medium/high/critical",
    "overallScore": 0-100,
    "concerns": ["specific_security_concerns"],
    "recommendations": ["actionable_security_recommendations"],
    "threatAssessment": {
      "ipReputation": "safe/suspicious/unknown",
      "authenticationStrength": "strong/weak/none",
      "dataIntegrity": "excellent/good/poor",
      "payloadSafety": "safe/suspicious/dangerous"
    }
  },
  "technical": {
    "requestAnalysis": {
      "method": "HTTP_method",
      "protocol": "http/https",
      "endpoint": "api_endpoint",
      "size": "small/medium/large",
      "complexity": "simple/moderate/complex"
    },
    "payloadStructure": {
      "format": "json/xml/text",
      "schema": "schema_description",
      "fieldCount": number_of_fields,
      "dataTypes": ["detected_data_types"]
    }
  },
  "business": {
    "value": "high/medium/low",
    "useCase": "specific_business_use_case",
    "revenueImpact": "direct/indirect/none",
    "customerImpact": "high/medium/low"
  },
  "predictions": {
    "nextLikelyEvent": "predicted_next_webhook_event",
    "businessOpportunity": "business_opportunity_from_this_webhook",
    "integrationComplexity": "low/medium/high",
    "scalabilityImpact": "how_this_scales"
  },
  "insights": {
    "summary": "executive_summary_of_webhook",
    "keyFindings": ["important_findings"],
    "recommendations": ["actionable_business_recommendations"],
    "competitiveAdvantage": "how_this_provides_competitive_advantage"
  },
  "compliance": {
    "gdprRelevant": true/false,
    "pciRelevant": true/false,
    "hipaaRelevant": true/false,
    "complianceScore": 0-100
  }
}

CRITICAL: Respond ONLY with valid JSON. No explanations, no markdown, no extra text.`

    try {
      const model = await this.getCurrentModel()
      console.log(`🚀 Using AI model: ${this.models[this.currentModelIndex].name}`)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Clean and parse JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      const analysis = JSON.parse(cleanText)
      
      // Add AI provider info
      analysis.aiProvider = this.models[this.currentModelIndex].name
      analysis.analysisTimestamp = new Date().toISOString()
      analysis.confidenceScore = this.calculateConfidence(analysis)
      
      console.log('✅ AI Analysis Successful!')
      console.log(`🎯 Service: ${analysis.service?.name}`)
      console.log(`🔍 Event: ${analysis.event?.type}`)
      console.log(`🛡️ Risk: ${analysis.security?.riskLevel}`)
      console.log(`💰 Value: ${analysis.business?.value}`)
      
      return analysis
      
    } catch (error) {
      console.error('❌ AI Analysis Failed:', error.message)
      
      // Try next model
      if (this.currentModelIndex < this.models.length - 1) {
        this.currentModelIndex++
        console.log(`🔄 Trying next model: ${this.models[this.currentModelIndex].name}`)
        return this.analyzeWebhook(requestData)
      }
      
      // Ultimate fallback - enhanced pattern matching
      console.log('🧠 Using ultimate fallback analysis')
      return this.ultimateFallbackAnalysis(requestData)
    }
  }

  calculateConfidence(analysis) {
    let score = 50
    
    if (analysis.service?.confidence === 'high') score += 20
    else if (analysis.service?.confidence === 'medium') score += 10
    
    if (analysis.security?.overallScore > 80) score += 15
    else if (analysis.security?.overallScore > 60) score += 10
    
    if (analysis.business?.value === 'high') score += 15
    else if (analysis.business?.value === 'medium') score += 8
    
    return Math.min(100, score)
  }

  ultimateFallbackAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Super-enhanced pattern matching
    const serviceDetection = this.detectService(headers, body)
    const eventAnalysis = this.analyzeEvent(body, serviceDetection.name)
    const securityAnalysis = this.performSecurityAnalysis(headers, body, ip)
    
    return {
      service: serviceDetection,
      event: eventAnalysis,
      security: securityAnalysis,
      technical: {
        requestAnalysis: { method, protocol: 'http', size: this.assessSize(body) },
        payloadStructure: { format: 'json', fieldCount: Object.keys(body || {}).length }
      },
      business: {
        value: serviceDetection.name !== 'Unknown' ? 'high' : 'medium',
        useCase: this.identifyUseCase(serviceDetection.name)
      },
      predictions: {
        nextLikelyEvent: this.predictNextEvent(serviceDetection.name, eventAnalysis.type),
        businessOpportunity: this.identifyOpportunity(serviceDetection.name),
        integrationComplexity: 'medium'
      },
      insights: {
        summary: `${serviceDetection.name} webhook ${eventAnalysis.type} event processed`,
        keyFindings: [`Service: ${serviceDetection.name}`, `Event: ${eventAnalysis.type}`],
        recommendations: this.generateRecommendations(serviceDetection.name, securityAnalysis.riskLevel)
      },
      compliance: {
        gdprRelevant: this.containsPersonalData(body),
        pciRelevant: serviceDetection.category === 'payment',
        complianceScore: 85
      },
      aiProvider: 'enhanced_pattern_matching',
      analysisTimestamp: new Date().toISOString(),
      confidenceScore: 75
    }
  }

  detectService(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    // Enhanced service detection with more patterns
    const services = [
      { 
        name: 'Stripe', 
        patterns: ['stripe-signature', 'payment_intent', 'charge.succeeded', 'customer.created'],
        category: 'payment',
        description: 'Leading online payment processing platform'
      },
      { 
        name: 'GitHub', 
        patterns: ['x-github-event', 'x-github-delivery', 'repository', 'push', 'pull_request'],
        category: 'development',
        description: 'World\'s leading software development platform'
      },
      { 
        name: 'Slack', 
        patterns: ['x-slack-request-timestamp', 'x-slack-signature', 'challenge', 'app_mention'],
        category: 'communication',
        description: 'Business communication and collaboration platform'
      },
      { 
        name: 'Razorpay', 
        patterns: ['x-razorpay-signature', 'payment.captured', 'invoice.paid'],
        category: 'payment',
        description: 'Indian payment gateway solution'
      },
      { 
        name: 'Shopify', 
        patterns: ['x-shopify-shop-domain', 'order_created', 'product_created'],
        category: 'ecommerce',
        description: 'Leading e-commerce platform'
      },
      { 
        name: 'PayPal', 
        patterns: ['paypal-auth-algo', 'payment_sale_completed'],
        category: 'payment',
        description: 'Global digital payment platform'
      }
    ]
    
    let bestMatch = { name: 'Unknown', confidence: 'low', score: 0, category: 'other', description: 'Unrecognized webhook service' }
    
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
          score,
          category: service.category,
          description: service.description
        }
      }
    }
    
    return bestMatch
  }

  analyzeEvent(body, serviceName) {
    const eventType = body.event || body.type || body.action || 'unknown'
    
    const eventMap = {
      'Stripe': {
        'payment_intent.succeeded': {
          type: 'payment_intent.succeeded',
          action: 'Customer payment successfully processed',
          businessImpact: 'Revenue received - payment completed successfully',
          priority: 'critical',
          automationPotential: 'high'
        },
        'invoice.payment_succeeded': {
          type: 'invoice.payment_succeeded',
          action: 'Invoice payment received',
          businessImpact: 'Recurring revenue confirmed',
          priority: 'high',
          automationPotential: 'high'
        }
      },
      'GitHub': {
        'push': {
          type: 'push',
          action: 'Code pushed to repository',
          businessImpact: 'Development workflow update - new code deployed',
          priority: 'medium',
          automationPotential: 'high'
        }
      }
    }
    
    const serviceEvents = eventMap[serviceName] || {}
    return serviceEvents[eventType] || {
      type: eventType,
      action: `${eventType} event processed`,
      businessImpact: 'System operation completed',
      priority: 'medium',
      automationPotential: 'medium'
    }
  }

  performSecurityAnalysis(headers, body, ip) {
    const concerns = []
    const recommendations = []
    let riskScore = 0
    
    // Enhanced security checks
    if (!ip || ip === 'unknown') {
      concerns.push('Missing IP address')
      riskScore += 15
    }
    
    const signatureHeaders = ['stripe-signature', 'x-razorpay-signature', 'x-hub-signature', 'x-slack-signature']
    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push('No webhook signature verification')
      recommendations.push('Implement webhook signature verification')
      riskScore += 25
    } else {
      recommendations.push('Webhook signature verification present')
    }
    
    const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'
    
    return {
      riskLevel,
      overallScore: Math.max(0, 100 - riskScore),
      concerns,
      recommendations,
      threatAssessment: {
        ipReputation: ip && !ip.startsWith('192.168') ? 'safe' : 'unknown',
        authenticationStrength: hasSignature ? 'strong' : 'weak',
        dataIntegrity: 'good',
        payloadSafety: 'safe'
      }
    }
  }

  assessSize(body) {
    const size = JSON.stringify(body || {}).length
    return size < 1000 ? 'small' : size < 10000 ? 'medium' : 'large'
  }

  identifyUseCase(serviceName) {
    const useCases = {
      'Stripe': 'payment_processing',
      'GitHub': 'development_workflow',
      'Slack': 'team_communication',
      'Razorpay': 'payment_processing',
      'Shopify': 'ecommerce_management',
      'PayPal': 'payment_processing'
    }
    return useCases[serviceName] || 'data_integration'
  }

  predictNextEvent(serviceName, currentEvent) {
    const predictions = {
      'Stripe': {
        'payment_intent.succeeded': 'payment_intent.payment_failed',
        'invoice.created': 'invoice.payment_succeeded'
      }
    }
    return predictions[serviceName]?.[currentEvent] || 'related_business_event'
  }

  identifyOpportunity(serviceName) {
    const opportunities = {
      'Stripe': 'Automated payment reconciliation and customer lifecycle management',
      'GitHub': 'CI/CD pipeline integration and automated deployment workflows',
      'Slack': 'Automated team notifications and workflow integrations'
    }
    return opportunities[serviceName] || 'Business process automation opportunity'
  }

  generateRecommendations(serviceName, riskLevel) {
    const baseRecommendations = [
      `Implement ${serviceName.toLowerCase()}-specific validation rules`,
      'Set up monitoring and alerting for webhook failures'
    ]
    
    if (riskLevel === 'high') {
      baseRecommendations.push('Immediate security review required')
    }
    
    return baseRecommendations
  }

  containsPersonalData(body) {
    if (!body || typeof body !== 'object') return false
    
    const personalFields = ['email', 'name', 'customer', 'user']
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    return personalFields.some(field => bodyStr.includes(field))
  }
}

module.exports = new HackathonWinningAIService()
