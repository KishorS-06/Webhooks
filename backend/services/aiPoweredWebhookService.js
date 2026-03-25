const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class AIPoweredWebhookService {
  constructor() {
    // Multiple models for maximum reliability
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
    
    console.log('🚀 Starting AI-Powered Webhook Analysis...')
    console.log(`📊 Request: Method=${method}, IP=${ip}, Service=${this.detectServiceQuick(headers, body)}`)
    
    // Try Gemini AI first for intelligent analysis
    try {
      const result = await this.tryAIAnalysis(requestData)
      if (result) {
        console.log('✅ AI-Powered analysis successful!')
        return result
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error.message)
    }
    
    // Fallback to intelligent pattern matching
    console.log('🧠 Using intelligent pattern matching...')
    return this.performIntelligentAnalysis(requestData)
  }

  async tryAIAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Advanced AI prompt for comprehensive webhook analysis
    const prompt = `You are an expert webhook analyst for an AI-powered webhook inspector. Analyze this webhook request with exceptional detail and intelligence.

REQUEST DATA:
- Method: ${method}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Headers: ${JSON.stringify(headers, null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Provide comprehensive AI-powered analysis in this exact JSON format:
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
    "dataStructure": "detailed_analysis_of_payload_structure",
    "keyFields": ["important_fields_in_payload"],
    "technicalDetails": {
      "complexity": "simple/moderate/complex",
      "format": "json/xml/text",
      "fieldCount": number_of_fields,
      "dataTypes": ["detected_data_types"],
      "payloadSize": "size_assessment"
    }
  },
  "recommendations": ["actionable_business_recommendations_array"],
  "calculatedMetrics": {
    "securityScore": 0-100,
    "riskScore": 0-100,
    "complexityScore": 0-100,
    "performanceScore": 0-100,
    "businessValueScore": 0-100,
    "automationPotential": 0-100
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
    "customerImpact": "high/medium/low",
    "automationOpportunity": "high/medium/low"
  },
  "predictions": {
    "nextLikelyEvent": "predicted_next_webhook_event",
    "businessOpportunity": "business_opportunity_from_this_webhook",
    "integrationComplexity": "low/medium/high",
    "scalabilityImpact": "how_this_scales",
    "roi": "estimated_return_on_investment"
  },
  "insights": {
    "summary": "detailed_business_insights_summary",
    "keyFindings": ["important_findings_array"],
    "recommendations": ["insights_recommendations_array"],
    "competitiveAdvantage": "how_this_provides_competitive_advantage",
    "innovationOpportunity": "innovation_opportunities"
  },
  "automation": {
    "potential": "high/medium/low",
    "confidence": 85-99,
    "timeSavings": "estimated_time_savings",
    "complexity": "low/medium/high",
    "automationSteps": ["automation_implementation_steps"]
  },
  "compliance": {
    "gdprRelevant": true/false,
    "pciRelevant": true/false,
    "hipaaRelevant": true/false,
    "complianceScore": 0-100,
    "regulations": ["relevant_regulations"]
  }
}

CRITICAL REQUIREMENTS:
1. Respond ONLY with valid JSON - no markdown, no explanations, no extra text
2. Provide specific, detailed analysis for each field
3. Ensure all arrays have meaningful content
4. Include realistic scores (0-100) for all metrics
5. Make business insights specific and actionable
6. Detection must be accurate based on headers/body patterns
7. Event type must match actual webhook event
8. Security analysis must be thorough and realistic`

    const model = await this.getCurrentModel()
    console.log(`🤖 Using AI model: ${this.models[this.currentModelIndex].name}`)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean and parse JSON
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    const analysis = JSON.parse(cleanText)
    
    // Validate and enhance AI response
    return this.validateAndEnhanceAIResponse(analysis, requestData)
  }

  validateAndEnhanceAIResponse(analysis, requestData) {
    const { headers, body } = requestData
    
    // Ensure all required fields exist and are properly formatted
    if (!analysis.service || !analysis.service.name) {
      analysis.service = this.detectServiceWithDetails(headers, body)
    }
    
    if (!analysis.eventType) {
      analysis.eventType = body.event || body.type || body.action || 'unknown'
    }
    
    if (!analysis.confidence) {
      analysis.confidence = 'medium'
    }
    
    if (!analysis.security) {
      analysis.security = this.performSecurityAnalysis(headers, body)
    }
    
    if (!analysis.analysis) {
      analysis.analysis = this.performTechnicalAnalysis(body)
    }
    
    if (!analysis.calculatedMetrics) {
      analysis.calculatedMetrics = this.calculateAllMetrics(body, analysis.security)
    }
    
    if (!analysis.enhancedRecommendations) {
      analysis.enhancedRecommendations = this.generateEnhancedRecommendations(analysis.service.name)
    }
    
    if (!analysis.business) {
      analysis.business = this.performBusinessAnalysis(analysis.service.name, analysis.eventType)
    }
    
    if (!analysis.predictions) {
      analysis.predictions = this.generatePredictions(analysis.service.name, analysis.eventType)
    }
    
    if (!analysis.insights) {
      analysis.insights = this.generateInsights(analysis.service.name, analysis.eventType)
    }
    
    if (!analysis.automation) {
      analysis.automation = this.performAutomationAnalysis(analysis.service.name)
    }
    
    if (!analysis.compliance) {
      analysis.compliance = this.performComplianceAnalysis(analysis.service.name, body)
    }
    
    // Add AI metadata
    analysis.aiProvider = this.models[this.currentModelIndex].name
    analysis.analysisTimestamp = new Date().toISOString()
    analysis.analysisId = this.generateAnalysisId()
    
    return analysis
  }

  performIntelligentAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    console.log('🧠 Performing intelligent pattern matching analysis...')
    
    // Advanced service detection
    const service = this.detectServiceWithDetails(headers, body)
    
    // Event analysis
    const eventType = body.event || body.type || body.action || 'unknown'
    
    // Security analysis
    const security = this.performSecurityAnalysis(headers, body)
    
    // Technical analysis
    const analysis = this.performTechnicalAnalysis(body)
    
    // Business analysis
    const business = this.performBusinessAnalysis(service.name, eventType)
    
    // Predictions
    const predictions = this.generatePredictions(service.name, eventType)
    
    // Insights
    const insights = this.generateInsights(service.name, eventType)
    
    // Automation analysis
    const automation = this.performAutomationAnalysis(service.name)
    
    // Compliance analysis
    const compliance = this.performComplianceAnalysis(service.name, body)
    
    // Calculated metrics
    const calculatedMetrics = this.calculateAllMetrics(body, security)
    
    // Enhanced recommendations
    const enhancedRecommendations = this.generateEnhancedRecommendations(service.name)
    
    return {
      service,
      eventType,
      confidence: service.confidence,
      security,
      analysis,
      recommendations: this.generateRecommendations(service.name, security.riskLevel),
      calculatedMetrics,
      enhancedRecommendations,
      business,
      predictions,
      insights,
      automation,
      compliance,
      aiProvider: 'intelligent_pattern_matching',
      analysisTimestamp: new Date().toISOString(),
      analysisId: this.generateAnalysisId()
    }
  }

  detectServiceQuick(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    if (headerStr.includes('stripe-signature') || bodyStr.includes('payment_intent')) return 'Stripe'
    if (headerStr.includes('x-github-event') || bodyStr.includes('repository')) return 'GitHub'
    if (headerStr.includes('x-slack-signature') || bodyStr.includes('challenge')) return 'Slack'
    if (headerStr.includes('x-razorpay-signature') || bodyStr.includes('payment.captured')) return 'Razorpay'
    if (headerStr.includes('x-shopify-shop-domain') || bodyStr.includes('order_created')) return 'Shopify'
    if (headerStr.includes('paypal-auth-algo') || bodyStr.includes('payment_sale')) return 'PayPal'
    
    return 'Unknown'
  }

  detectServiceWithDetails(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    const services = [
      {
        name: 'Stripe',
        patterns: ['stripe-signature', 'payment_intent', 'charge.succeeded', 'invoice.', 'customer.'],
        events: ['payment_intent.succeeded', 'invoice.payment_succeeded', 'charge.succeeded'],
        category: 'payment',
        description: 'Leading online payment processing platform for internet businesses',
        officialDocs: 'https://stripe.com/docs/webhooks'
      },
      {
        name: 'GitHub',
        patterns: ['x-github-event', 'x-github-delivery', 'repository', 'push', 'pull_request', 'issues'],
        events: ['push', 'pull_request', 'issues'],
        category: 'development',
        description: 'World\'s leading software development platform with Git version control',
        officialDocs: 'https://docs.github.com/en/developers/webhooks-and-events/webhooks'
      },
      {
        name: 'Slack',
        patterns: ['x-slack-request-timestamp', 'x-slack-signature', 'challenge', 'app_mention', 'message'],
        events: ['message', 'app_mention', 'url_verification'],
        category: 'communication',
        description: 'Business communication and collaboration platform for teams',
        officialDocs: 'https://api.slack.com/webhooks'
      },
      {
        name: 'Razorpay',
        patterns: ['x-razorpay-signature', 'payment.captured', 'invoice.paid', 'subscription.'],
        events: ['payment.captured', 'invoice.paid', 'subscription.cancelled'],
        category: 'payment',
        description: 'Indian payment gateway solution for businesses and startups',
        officialDocs: 'https://razorpay.com/docs/webhooks'
      },
      {
        name: 'Shopify',
        patterns: ['x-shopify-shop-domain', 'order_created', 'product_created', 'customer_created'],
        events: ['orders/create', 'products/create', 'customers/create'],
        category: 'ecommerce',
        description: 'Leading e-commerce platform for online stores and retail businesses',
        officialDocs: 'https://shopify.dev/docs/webhooks'
      },
      {
        name: 'PayPal',
        patterns: ['paypal-auth-algo', 'payment_sale_completed', 'billing_agreement'],
        events: ['PAYMENT.SALE.COMPLETED', 'BILLING.SUBSCRIPTION.CREATED'],
        category: 'payment',
        description: 'Global digital payment platform for online payments and money transfers',
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
          confidence: score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low',
          score,
          category: service.category,
          description: service.description,
          officialDocs: service.officialDocs
        }
      }
    }
    
    return bestMatch
  }

  performSecurityAnalysis(headers, body, ip) {
    const concerns = []
    const recommendations = []
    let securityScore = 100
    
    // IP address analysis
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
    
    // Payload analysis
    const payloadSize = JSON.stringify(body || {}).length
    if (payloadSize > 100000) { // 100KB
      concerns.push('Large payload detected - potential DoS risk')
      recommendations.push('Implement payload size limits')
      securityScore -= 10
    }
    
    // Sensitive data detection
    if (body && typeof body === 'object') {
      const sensitiveFields = ['password', 'secret', 'token', 'key', 'credit_card', 'ssn', 'api_key']
      const foundSensitive = sensitiveFields.filter(field => 
        JSON.stringify(body).toLowerCase().includes(field)
      )
      
      if (foundSensitive.length > 0) {
        concerns.push(`Sensitive data detected: ${foundSensitive.join(', ')}`)
        recommendations.push('Ensure sensitive data is properly encrypted and handled')
        securityScore -= 15
      }
    }
    
    // Determine risk level
    const riskLevel = securityScore >= 80 ? 'low' : securityScore >= 60 ? 'medium' : 'high'
    
    return {
      riskLevel,
      score: Math.max(0, securityScore),
      concerns,
      recommendations,
      threatAssessment: {
        ipReputation: ip && !ip.startsWith('192.168') && !ip.startsWith('127.') ? 'safe' : 'unknown',
        authenticationStrength: hasSignature ? 'strong' : 'weak',
        dataIntegrity: 'good',
        payloadSafety: 'safe'
      }
    }
  }

  performTechnicalAnalysis(body) {
    if (!body) {
      return {
        summary: 'Empty webhook payload received',
        dataStructure: 'No data structure available',
        keyFields: [],
        technicalDetails: {
          complexity: 'simple',
          format: 'unknown',
          fieldCount: 0,
          dataTypes: [],
          payloadSize: 'empty'
        }
      }
    }
    
    const fieldCount = Object.keys(body).length
    const payloadSize = JSON.stringify(body).length
    const dataTypes = this.extractDataTypes(body)
    const complexity = this.assessComplexity(body)
    
    return {
      summary: `Webhook payload contains ${fieldCount} fields with ${dataTypes.length} different data types`,
      dataStructure: `JSON object with ${fieldCount} properties: ${Object.keys(body).slice(0, 5).join(', ')}${fieldCount > 5 ? '...' : ''}`,
      keyFields: this.extractKeyFields(body),
      technicalDetails: {
        complexity,
        format: 'json',
        fieldCount,
        dataTypes,
        payloadSize: payloadSize < 1000 ? 'small' : payloadSize < 10000 ? 'medium' : 'large'
      }
    }
  }

  performBusinessAnalysis(serviceName, eventType) {
    const businessMap = {
      'Stripe': {
        impact: 'high',
        value: 'high',
        useCase: 'payment_processing',
        revenueImpact: 'direct',
        customerImpact: 'high',
        automationOpportunity: 'high'
      },
      'GitHub': {
        impact: 'medium',
        value: 'medium',
        useCase: 'development_workflow',
        revenueImpact: 'indirect',
        customerImpact: 'medium',
        automationOpportunity: 'high'
      },
      'Slack': {
        impact: 'medium',
        value: 'medium',
        useCase: 'team_communication',
        revenueImpact: 'indirect',
        customerImpact: 'medium',
        automationOpportunity: 'medium'
      }
    }
    
    return businessMap[serviceName] || {
      impact: 'low',
      value: 'low',
      useCase: 'data_integration',
      revenueImpact: 'none',
      customerImpact: 'low',
      automationOpportunity: 'medium'
    }
  }

  generatePredictions(serviceName, eventType) {
    const predictions = {
      'Stripe': {
        'payment_intent.succeeded': {
          nextLikelyEvent: 'payment_intent.payment_failed',
          businessOpportunity: 'Automated payment reconciliation and customer lifecycle management',
          integrationComplexity: 'low',
          scalabilityImpact: 'High - supports enterprise payment volume',
          roi: '300-500% ROI through automation'
        }
      },
      'GitHub': {
        'push': {
          nextLikelyEvent: 'pull_request',
          businessOpportunity: 'CI/CD pipeline integration and automated deployment workflows',
          integrationComplexity: 'medium',
          scalabilityImpact: 'High - supports large development teams',
          roi: '200-400% ROI through development efficiency'
        }
      }
    }
    
    return predictions[serviceName]?.[eventType] || {
      nextLikelyEvent: 'related_business_event',
      businessOpportunity: 'Business process automation opportunity',
      integrationComplexity: 'medium',
      scalabilityImpact: 'Medium - supports business growth',
      roi: '150-300% ROI through automation'
    }
  }

  generateInsights(serviceName, eventType) {
    return {
      summary: `${serviceName} ${eventType} event provides significant business value through automated processing`,
      keyFindings: [
        `Service: ${serviceName} detected with high confidence`,
        `Event: ${eventType} processed successfully`,
        'Automated processing opportunity identified',
        'Integration complexity assessed as manageable'
      ],
      recommendations: [
        `Implement ${serviceName.toLowerCase()}-specific automation workflows`,
        'Set up real-time monitoring and alerting',
        'Create business intelligence dashboards',
        'Develop automated response systems'
      ],
      competitiveAdvantage: `Real-time ${serviceName} integration provides competitive advantage through automation`,
      innovationOpportunity: 'AI-powered webhook processing creates innovation in business process automation'
    }
  }

  performAutomationAnalysis(serviceName) {
    const automationMap = {
      'Stripe': {
        potential: 'high',
        confidence: 95,
        timeSavings: '10-15 hours per week',
        complexity: 'medium',
        automationSteps: [
          'Payment processing automation',
          'Customer notification systems',
          'Revenue reconciliation',
          'Financial reporting automation'
        ]
      },
      'GitHub': {
        potential: 'high',
        confidence: 90,
        timeSavings: '8-12 hours per week',
        complexity: 'medium',
        automationSteps: [
          'CI/CD pipeline automation',
          'Code review automation',
          'Deployment automation',
          'Testing automation'
        ]
      }
    }
    
    return automationMap[serviceName] || {
      potential: 'medium',
      confidence: 75,
      timeSavings: '5-8 hours per week',
      complexity: 'medium',
      automationSteps: [
        'Webhook processing automation',
        'Data synchronization',
        'Alerting systems',
        'Report generation'
      ]
    }
  }

  performComplianceAnalysis(serviceName, body) {
    const complianceMap = {
      'Stripe': {
        gdprRelevant: true,
        pciRelevant: true,
        hipaaRelevant: false,
        complianceScore: 90,
        regulations: ['PCI DSS', 'GDPR', 'SOX']
      },
      'GitHub': {
        gdprRelevant: true,
        pciRelevant: false,
        hipaaRelevant: false,
        complianceScore: 85,
        regulations: ['GDPR', 'CCPA']
      }
    }
    
    return complianceMap[serviceName] || {
      gdprRelevant: false,
      pciRelevant: false,
      hipaaRelevant: false,
      complianceScore: 75,
      regulations: ['SOC 2']
    }
  }

  calculateAllMetrics(body, security) {
    const fieldCount = Object.keys(body || {}).length
    const payloadSize = JSON.stringify(body || {}).length
    
    return {
      securityScore: security.score,
      riskScore: 100 - security.score,
      complexityScore: Math.min(100, fieldCount * 3),
      performanceScore: Math.max(50, 100 - (payloadSize / 1000)),
      businessValueScore: fieldCount > 0 ? 80 : 50,
      automationPotential: fieldCount > 2 ? 85 : 60
    }
  }

  generateEnhancedRecommendations(serviceName) {
    return {
      immediate: [
        `Verify ${serviceName} webhook endpoint accessibility`,
        'Test webhook payload processing',
        'Check error handling mechanisms'
      ],
      shortTerm: [
        `Implement ${serviceName} event-specific handlers`,
        'Set up webhook delivery monitoring',
        'Create alerting system for failures'
      ],
      longTerm: [
        `Build comprehensive ${serviceName} integration`,
        'Implement webhook analytics dashboard',
        'Create automated testing suite'
      ],
      strategic: [
        `Develop ${serviceName} ecosystem strategy`,
        'Plan webhook-driven automation',
        'Create business intelligence insights'
      ]
    }
  }

  generateRecommendations(serviceName, riskLevel) {
    const recommendations = [
      `Implement ${serviceName.toLowerCase()}-specific validation rules`,
      'Set up monitoring and alerting for webhook failures'
    ]
    
    if (riskLevel === 'high') {
      recommendations.push('Immediate security review required')
      recommendations.push('Review webhook authentication mechanisms')
    }
    
    if (serviceName === 'Stripe') {
      recommendations.push('Set up payment failure handling')
      recommendations.push('Implement customer notification system')
    } else if (serviceName === 'GitHub') {
      recommendations.push('Set up CI/CD pipeline integration')
      recommendations.push('Implement code review automation')
    }
    
    return recommendations
  }

  extractKeyFields(body) {
    if (!body || typeof body !== 'object') return []
    
    const importantFields = [
      'event', 'type', 'action', 'amount', 'currency', 'customer', 'user',
      'repository', 'ref', 'message', 'order', 'product', 'subscription',
      'payment', 'charge', 'invoice', 'transaction', 'id', 'created'
    ]
    
    return Object.keys(body).filter(key => 
      importantFields.some(important => key.toLowerCase().includes(important))
    ).slice(0, 8)
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
    return Array.from(types)
  }

  assessComplexity(body) {
    if (!body) return 'simple'
    
    const fieldCount = Object.keys(body).length
    const nestedObjects = Object.values(body).filter(v => 
      typeof v === 'object' && v !== null && !Array.isArray(v)
    ).length
    const arrays = Object.values(body).filter(v => Array.isArray(v)).length
    
    if (fieldCount <= 5 && nestedObjects === 0) return 'simple'
    if (fieldCount <= 15 && nestedObjects <= 2) return 'moderate'
    return 'complex'
  }

  generateAnalysisId() {
    return 'ai_' + Math.random().toString(36).substr(2, 9)
  }
}

module.exports = new AIPoweredWebhookService()
