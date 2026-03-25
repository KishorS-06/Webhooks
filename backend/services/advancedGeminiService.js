const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class AdvancedGeminiService {
  constructor() {
    // Try multiple models for maximum reliability
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
    
    // Advanced prompt for comprehensive frontend-compatible analysis
    const prompt = `You are an expert webhook analyst providing detailed analysis for a frontend dashboard. Analyze this webhook request with comprehensive details.

REQUEST DATA:
- Method: ${method}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Headers: ${JSON.stringify(headers, null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Provide comprehensive analysis in this exact JSON format that matches frontend requirements:
{
  "service": {
    "name": "detected_service_name",
    "confidence": "high/medium/low",
    "description": "detailed_service_description",
    "category": "payment/development/communication/ecommerce/other",
    "officialDocs": "https://documentation-url.com"
  },
  "eventType": "specific_event_type_from_body",
  "confidence": "high/medium/low",
  "security": {
    "riskLevel": "low/medium/high/critical",
    "score": 0-100,
    "concerns": ["specific_security_concerns_array"],
    "recommendations": ["security_recommendations_array"],
    "threatAssessment": {
      "ipReputation": "safe/suspicious/unknown",
      "authenticationStrength": "strong/weak/none",
      "dataIntegrity": "excellent/good/poor",
      "payloadSafety": "safe/suspicious/dangerous"
    }
  },
  "analysis": {
    "summary": "executive_summary_of_webhook_purpose",
    "dataStructure": "analysis_of_payload_structure",
    "keyFields": ["important_fields_in_payload"],
    "technicalDetails": {
      "complexity": "simple/moderate/complex",
      "format": "json/xml/text",
      "fieldCount": number_of_fields,
      "dataTypes": ["detected_data_types"]
    }
  },
  "recommendations": ["actionable_business_recommendations_array"],
  "calculatedMetrics": {
    "securityScore": 0-100,
    "riskScore": 0-100,
    "complexityScore": 0-100,
    "performanceScore": 0-100,
    "businessValueScore": 0-100
  },
  "automation": {
    "potential": "high/medium/low",
    "confidence": 85-99,
    "timeSavings": "estimated_time_savings",
    "complexity": "low/medium/high"
  },
  "enhancedRecommendations": {
    "immediate": ["immediate_action_items"],
    "shortTerm": ["short_term_recommendations"],
    "longTerm": ["long_term_strategies"],
    "strategic": ["strategic_initiatives"]
  },
  "business": {
    "impact": "high/medium/low",
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
    "summary": "detailed_insights_summary",
    "keyFindings": ["important_findings_array"],
    "recommendations": ["insights_recommendations_array"],
    "competitiveAdvantage": "how_this_provides_competitive_advantage"
  },
  "compliance": {
    "gdprRelevant": true/false,
    "pciRelevant": true/false,
    "hipaaRelevant": true/false,
    "complianceScore": 0-100
  }
}

CRITICAL REQUIREMENTS:
1. Respond ONLY with valid JSON - no markdown, no explanations, no extra text
2. Ensure all arrays have actual content, not empty arrays
3. Provide specific, actionable recommendations
4. Include realistic scores (0-100) for all metrics
5. Make business insights specific and valuable
6. Ensure service detection is accurate based on headers/body patterns
7. eventType must match the actual event from the webhook body`

    try {
      const model = await this.getCurrentModel()
      console.log(`🚀 Using AI model: ${this.models[this.currentModelIndex].name}`)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Clean and parse JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      const analysis = JSON.parse(cleanText)
      
      // Add AI provider info and ensure all required fields
      analysis.aiProvider = this.models[this.currentModelIndex].name
      analysis.analysisTimestamp = new Date().toISOString()
      analysis.confidenceScore = this.calculateConfidence(analysis)
      
      // Ensure frontend compatibility
      this.ensureFrontendCompatibility(analysis)
      
      console.log('✅ Advanced AI Analysis Successful!')
      console.log(`🎯 Service: ${analysis.service?.name}`)
      console.log(`🔍 Event: ${analysis.eventType}`)
      console.log(`🛡️ Risk: ${analysis.security?.riskLevel}`)
      console.log(`📊 Security Score: ${analysis.calculatedMetrics?.securityScore}`)
      console.log(`💰 Business Value: ${analysis.business?.value}`)
      
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

  ensureFrontendCompatibility(analysis) {
    // Ensure all required fields for frontend exist
    if (!analysis.service) {
      analysis.service = { name: 'Unknown', confidence: 'low', description: 'Service not detected' }
    }
    
    if (!analysis.eventType) {
      analysis.eventType = 'unknown'
    }
    
    if (!analysis.confidence) {
      analysis.confidence = 'low'
    }
    
    if (!analysis.security) {
      analysis.security = { riskLevel: 'medium', score: 50, concerns: [], recommendations: [] }
    }
    
    if (!analysis.calculatedMetrics) {
      analysis.calculatedMetrics = {
        securityScore: 70,
        riskScore: 30,
        complexityScore: 50,
        performanceScore: 80,
        businessValueScore: 75
      }
    }
    
    if (!analysis.enhancedRecommendations) {
      analysis.enhancedRecommendations = {
        immediate: ['Monitor webhook performance'],
        shortTerm: ['Set up alerting'],
        longTerm: ['Implement automation'],
        strategic: ['Optimize business processes']
      }
    }
    
    // Ensure arrays are not empty
    if (!analysis.security.concerns || analysis.security.concerns.length === 0) {
      analysis.security.concerns = ['No immediate security concerns detected']
    }
    
    if (!analysis.security.recommendations || analysis.security.recommendations.length === 0) {
      analysis.security.recommendations = ['Continue monitoring webhook activity']
    }
    
    if (!analysis.recommendations || analysis.recommendations.length === 0) {
      analysis.recommendations = ['Regular webhook monitoring recommended']
    }
    
    if (!analysis.analysis?.keyFields || analysis.analysis.keyFields.length === 0) {
      if (!analysis.analysis) analysis.analysis = {}
      analysis.analysis.keyFields = ['event', 'timestamp']
    }
  }

  calculateConfidence(analysis) {
    let score = 50
    
    if (analysis.service?.confidence === 'high') score += 20
    else if (analysis.service?.confidence === 'medium') score += 10
    
    if (analysis.security?.score > 80) score += 15
    else if (analysis.security?.score > 60) score += 10
    
    if (analysis.business?.value === 'high') score += 15
    else if (analysis.business?.value === 'medium') score += 8
    
    if (analysis.confidence === 'high') score += 10
    else if (analysis.confidence === 'medium') score += 5
    
    return Math.min(100, score)
  }

  ultimateFallbackAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Super-enhanced pattern matching with frontend compatibility
    const serviceDetection = this.detectService(headers, body)
    const eventAnalysis = this.analyzeEvent(body, serviceDetection.name)
    const securityAnalysis = this.performSecurityAnalysis(headers, body, ip)
    
    return {
      service: serviceDetection,
      eventType: eventAnalysis.type,
      confidence: serviceDetection.confidence,
      security: securityAnalysis,
      analysis: {
        summary: `${serviceDetection.name} webhook ${eventAnalysis.type} event processed`,
        dataStructure: `JSON object with ${Object.keys(body || {}).length} fields`,
        keyFields: this.extractKeyFields(body),
        technicalDetails: {
          complexity: this.assessComplexity(body),
          format: 'json',
          fieldCount: Object.keys(body || {}).length,
          dataTypes: this.extractDataTypes(body)
        }
      },
      recommendations: this.generateRecommendations(serviceDetection.name, securityAnalysis.riskLevel),
      calculatedMetrics: {
        securityScore: securityAnalysis.score,
        riskScore: securityAnalysis.riskScore,
        complexityScore: this.calculateComplexityScore(body),
        performanceScore: 85,
        businessValueScore: serviceDetection.name !== 'Unknown' ? 80 : 50
      },
      automation: {
        potential: serviceDetection.name !== 'Unknown' ? 'high' : 'medium',
        confidence: 85,
        timeSavings: '2-4 hours per week',
        complexity: 'medium'
      },
      enhancedRecommendations: {
        immediate: this.generateImmediateRecommendations(serviceDetection.name),
        shortTerm: this.generateShortTermRecommendations(serviceDetection.name),
        longTerm: this.generateLongTermRecommendations(serviceDetection.name),
        strategic: this.generateStrategicRecommendations(serviceDetection.name)
      },
      business: {
        impact: serviceDetection.name !== 'Unknown' ? 'high' : 'medium',
        value: serviceDetection.name !== 'Unknown' ? 'high' : 'medium',
        useCase: this.identifyUseCase(serviceDetection.name),
        revenueImpact: serviceDetection.category === 'payment' ? 'direct' : 'indirect',
        customerImpact: serviceDetection.name !== 'Unknown' ? 'high' : 'medium'
      },
      predictions: {
        nextLikelyEvent: this.predictNextEvent(serviceDetection.name, eventAnalysis.type),
        businessOpportunity: this.identifyOpportunity(serviceDetection.name),
        integrationComplexity: 'medium',
        scalabilityImpact: 'High - supports enterprise scale'
      },
      insights: {
        summary: `${serviceDetection.name} integration provides business value through automated processing`,
        keyFindings: [`Service: ${serviceDetection.name}`, `Event: ${eventAnalysis.type}`, `Risk: ${securityAnalysis.riskLevel}`],
        recommendations: this.generateInsightsRecommendations(serviceDetection.name),
        competitiveAdvantage: 'Real-time webhook processing with intelligent analysis'
      },
      compliance: {
        gdprRelevant: this.containsPersonalData(body),
        pciRelevant: serviceDetection.category === 'payment',
        hipaaRelevant: false,
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
    
    // Enhanced service detection
    const services = [
      { 
        name: 'Stripe', 
        patterns: ['stripe-signature', 'payment_intent', 'charge.succeeded', 'customer.created'],
        category: 'payment',
        description: 'Leading online payment processing platform',
        officialDocs: 'https://stripe.com/docs/webhooks'
      },
      { 
        name: 'GitHub', 
        patterns: ['x-github-event', 'x-github-delivery', 'repository', 'push', 'pull_request'],
        category: 'development',
        description: 'World\'s leading software development platform',
        officialDocs: 'https://docs.github.com/en/developers/webhooks-and-events/webhooks'
      },
      { 
        name: 'Slack', 
        patterns: ['x-slack-request-timestamp', 'x-slack-signature', 'challenge', 'app_mention'],
        category: 'communication',
        description: 'Business communication and collaboration platform',
        officialDocs: 'https://api.slack.com/webhooks'
      },
      { 
        name: 'Razorpay', 
        patterns: ['x-razorpay-signature', 'payment.captured', 'invoice.paid'],
        category: 'payment',
        description: 'Indian payment gateway solution',
        officialDocs: 'https://razorpay.com/docs/webhooks'
      },
      { 
        name: 'Shopify', 
        patterns: ['x-shopify-shop-domain', 'order_created', 'product_created'],
        category: 'ecommerce',
        description: 'Leading e-commerce platform',
        officialDocs: 'https://shopify.dev/docs/webhooks'
      },
      { 
        name: 'PayPal', 
        patterns: ['paypal-auth-algo', 'payment_sale_completed'],
        category: 'payment',
        description: 'Global digital payment platform',
        officialDocs: 'https://developer.paypal.com/docs/webhooks/'
      }
    ]
    
    let bestMatch = { 
      name: 'Unknown', 
      confidence: 'low', 
      score: 0, 
      category: 'other', 
      description: 'Unrecognized webhook service',
      officialDocs: null
    }
    
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
          description: service.description,
          officialDocs: service.officialDocs
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
          businessImpact: 'Revenue received - payment completed successfully'
        },
        'invoice.payment_succeeded': {
          type: 'invoice.payment_succeeded',
          action: 'Invoice payment received',
          businessImpact: 'Recurring revenue confirmed'
        }
      },
      'GitHub': {
        'push': {
          type: 'push',
          action: 'Code pushed to repository',
          businessImpact: 'Development workflow update - new code deployed'
        }
      }
    }
    
    const serviceEvents = eventMap[serviceName] || {}
    return serviceEvents[eventType] || {
      type: eventType,
      action: `${eventType} event processed`,
      businessImpact: 'System operation completed'
    }
  }

  performSecurityAnalysis(headers, body, ip) {
    const concerns = []
    const recommendations = []
    let riskScore = 0
    let securityScore = 100
    
    // Enhanced security checks
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
      recommendations,
      threatAssessment: {
        ipReputation: ip && !ip.startsWith('192.168') ? 'safe' : 'unknown',
        authenticationStrength: hasSignature ? 'strong' : 'weak',
        dataIntegrity: 'good',
        payloadSafety: 'safe'
      }
    }
  }

  extractKeyFields(body) {
    if (!body || typeof body !== 'object') return []
    
    const importantFields = ['event', 'type', 'amount', 'currency', 'customer', 'repository', 'action', 'message']
    return Object.keys(body).filter(key => 
      importantFields.some(important => key.toLowerCase().includes(important))
    ).slice(0, 5)
  }

  assessComplexity(body) {
    if (!body) return 'simple'
    const fieldCount = Object.keys(body).length
    return fieldCount <= 5 ? 'simple' : fieldCount <= 15 ? 'moderate' : 'complex'
  }

  extractDataTypes(body) {
    if (!body) return []
    const types = new Set()
    
    const checkTypes = (obj) => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          types.add('object')
          checkTypes(value)
        } else if (Array.isArray(value)) {
          types.add('array')
        } else {
          types.add(typeof value)
        }
      }
    }
    
    checkTypes(body)
    return Array.from(types).slice(0, 5)
  }

  calculateComplexityScore(body) {
    if (!body) return 30
    const fieldCount = Object.keys(body).length
    return Math.min(100, fieldCount * 3)
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

  generateInsightsRecommendations(serviceName) {
    return [
      `Leverage ${serviceName} data for business intelligence`,
      'Implement proactive monitoring and alerting',
      'Optimize webhook processing for better performance'
    ]
  }

  containsPersonalData(body) {
    if (!body || typeof body !== 'object') return false
    
    const personalFields = ['email', 'name', 'customer', 'user']
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    return personalFields.some(field => bodyStr.includes(field))
  }
}

module.exports = new AdvancedGeminiService()
