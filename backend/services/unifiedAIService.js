const OpenAIAnalyzer = require('./openaiService')
const AIPoweredWebhook = require('./aiPoweredWebhookService')

class UnifiedAIService {
  constructor() {
    this.openaiAnalyzer = new OpenAIAnalyzer()
    this.aiPoweredWebhook = AIPoweredWebhook  // Use the AI-powered webhook service
    this.lastWorkingService = null
  }

  async analyzeWebhook(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Check if we have valid API keys
    const hasValidGeminiKey = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_API_KEY_HERE') && process.env.GEMINI_API_KEY.length > 30
    const hasValidOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 30
    
    console.log('🤖 AI Service Analysis Started')
    console.log('📊 API Keys Status:', { 
      gemini: hasValidGeminiKey ? '✅ valid' : '❌ invalid/missing', 
      openai: hasValidOpenAIKey ? '✅ valid' : '❌ invalid/missing' 
    })
    
    // Try AI-powered webhook service for improved, intelligent data
    try {
      console.log('🚀 Attempting AI-Powered Webhook analysis...')
      const result = await this.aiPoweredWebhook.analyzeWebhook(requestData)
      console.log('✅ AI-Powered analysis successful!')
      console.log(`🎯 Service: ${result.service?.name}`)
      console.log(`🔍 Event: ${result.eventType}`)
      console.log(`🛡️ Risk: ${result.security?.riskLevel}`)
      console.log(`📊 Security Score: ${result.calculatedMetrics?.securityScore}`)
      console.log(`� Business Value: ${result.business?.value}`)
      console.log(`🤖 Automation Potential: ${result.automation?.potential}`)
      this.lastWorkingService = 'ai_powered_webhook'
      return result
    } catch (error) {
      console.error('❌ AI-Powered analysis failed:', error.message)
    }

    // Try OpenAI as backup if we have a valid key
    if (hasValidOpenAIKey) {
      try {
        console.log('🔄 Attempting OpenAI analysis as backup...')
        const result = await this.openaiAnalyzer.analyzeWebhook(requestData)
        console.log('✅ OpenAI analysis successful!')
        this.lastWorkingService = 'openai'
        return {
          ...result,
          aiProvider: 'openai',
          analysisTimestamp: new Date().toISOString()
        }
      } catch (error) {
        console.error('❌ OpenAI analysis failed:', error.message)
        if (error.response?.status === 429) {
          console.log('💳 OpenAI quota exceeded - using enhanced fallback...')
        }
      }
    } else {
      console.log('⚠️  OpenAI API key disabled - skipping...')
    }

    // Enhanced fallback with better analysis
    console.log('🧠 Using enhanced pattern matching analysis...')
    const fallbackResult = this.enhancedPatternAnalysis(requestData)
    console.log('✅ Enhanced pattern analysis completed!')
    console.log('🎯 Service detected:', fallbackResult.service?.name)
    console.log('🔍 Event type:', fallbackResult.event?.type)
    console.log('🛡️  Risk level:', fallbackResult.security?.riskLevel)
    
    return {
      ...fallbackResult,
      aiProvider: 'pattern_matching',
      analysisTimestamp: new Date().toISOString()
    }
  }

  async detectWebhookService(requestData) {
    // Try Gemini first (now primary)
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.aiService.detectWebhookService(requestData)
      } catch (error) {
        console.error('Gemini service detection failed:', error.message)
      }
    }

    // Try OpenAI as backup
    if (process.env.OPENAI_API_KEY) {
      try {
        const analysis = await this.openaiAnalyzer.analyzeWebhook(requestData)
        const result = {
          service: analysis.service?.name || 'Unknown',
          confidence: analysis.service?.confidence || 'low'
        }
        this.lastWorkingService = 'openai'
        return result
      } catch (error) {
        console.error('OpenAI service detection failed:', error.message)
      }
    }

    // Pattern matching fallback
    const { headers } = requestData
    const service = this.openaiAnalyzer.detectServiceFromHeaders(headers)
    return {
      service,
      confidence: service !== 'Unknown' ? 'medium' : 'low'
    }
  }

  async securityScan(requestData) {
    // Try Gemini first for security (it's good at this)
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.aiService.securityScan(requestData)
      } catch (error) {
        console.error('Gemini security scan failed:', error.message)
      }
    }

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const analysis = await this.openaiAnalyzer.analyzeWebhook(requestData)
        return {
          riskLevel: analysis.security?.riskLevel || 'medium',
          concerns: analysis.security?.vulnerabilities?.map(v => v.description) || [],
          recommendations: analysis.security?.recommendations?.map(r => r.action) || [],
          score: analysis.security?.overallScore || 50
        }
      } catch (error) {
        console.error('OpenAI security scan failed:', error.message)
      }
    }

    // Basic security check
    const { headers, body, ip, userAgent } = requestData
    const concerns = []
    const recommendations = []

    if (!ip || ip === 'unknown') {
      concerns.push("Missing IP address")
    }

    const signatureHeaders = [
      'x-signature',
      'x-hub-signature',
      'stripe-signature',
      'x-razorpay-signature',
      'x-slack-signature'
    ]

    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push("No webhook signature found")
      recommendations.push("Implement webhook signature verification")
    }

    let riskLevel = 'low'
    if (concerns.length > 2) {
      riskLevel = 'high'
    } else if (concerns.length > 0) {
      riskLevel = 'medium'
    }

    return {
      riskLevel,
      concerns,
      recommendations,
      score: Math.max(0, 100 - (concerns.length * 20))
    }
  }

  enhancedPatternAnalysis(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Enhanced service detection
    const service = this.detectServiceFromData(headers, body)
    
    // Enhanced security analysis
    const securityAnalysis = this.performSecurityAnalysis(headers, body, ip, userAgent)
    
    // Enhanced event analysis
    const eventAnalysis = this.analyzeEvent(body, service)
    
    // Generate unique analysis based on actual data
    const uniqueId = this.generateUniqueAnalysisId(headers, body, method, ip)
    
    return {
      service: {
        name: service.name,
        confidence: service.confidence,
        description: this.getServiceDescription(service.name),
        category: this.getServiceCategory(service.name)
      },
      event: {
        type: eventAnalysis.type,
        action: eventAnalysis.action,
        businessImpact: eventAnalysis.businessImpact,
        priority: eventAnalysis.priority,
        automationPotential: eventAnalysis.automationPotential
      },
      security: securityAnalysis,
      technical: {
        requestAnalysis: {
          method: method,
          protocol: this.analyzeProtocol(headers),
          endpoint: this.analyzeEndpoint(headers),
          size: this.analyzePayloadSize(body),
          complexity: this.assessComplexity(body)
        },
        payloadStructure: {
          format: this.detectPayloadFormat(body),
          schema: this.analyzeSchema(body),
          fieldCount: this.countFields(body),
          dataTypes: this.detectDataTypes(body)
        }
      },
      business: {
        value: this.assessBusinessValue(service.name, eventAnalysis.type),
        useCase: this.identifyUseCase(service.name, eventAnalysis.type)
      },
      insights: {
        summary: this.generateSummary(service.name, eventAnalysis.type, securityAnalysis),
        keyFindings: this.generateKeyFindings(headers, body, service.name),
        recommendations: this.generateRecommendations(securityAnalysis, service.name)
      },
      analysisId: uniqueId,
      timestamp: new Date().toISOString(),
      dataSource: 'enhanced_pattern_matching'
    }
  }
  
  detectServiceFromData(headers, body) {
    const headerStr = JSON.stringify(headers).toLowerCase()
    const bodyStr = JSON.stringify(body).toLowerCase()
    
    // Enhanced service detection with more patterns
    const services = [
      {
        name: 'Stripe',
        patterns: [
          { type: 'header', value: 'stripe-signature' },
          { type: 'body', value: 'payment_intent' },
          { type: 'body', value: 'charge.succeeded' },
          { type: 'body', value: 'customer.created' }
        ]
      },
      {
        name: 'GitHub',
        patterns: [
          { type: 'header', value: 'x-github-event' },
          { type: 'header', value: 'x-github-delivery' },
          { type: 'body', value: 'repository' },
          { type: 'body', value: 'push' }
        ]
      },
      {
        name: 'Slack',
        patterns: [
          { type: 'header', value: 'x-slack-request-timestamp' },
          { type: 'header', value: 'x-slack-signature' },
          { type: 'body', value: 'challenge' },
          { type: 'body', value: 'app_mention' }
        ]
      },
      {
        name: 'Razorpay',
        patterns: [
          { type: 'header', value: 'x-razorpay-signature' },
          { type: 'body', value: 'payment.captured' },
          { type: 'body', value: 'invoice.paid' }
        ]
      },
      {
        name: 'PayPal',
        patterns: [
          { type: 'header', value: 'paypal-auth-algo' },
          { type: 'body', value: 'payment_sale_completed' }
        ]
      },
      {
        name: 'Shopify',
        patterns: [
          { type: 'header', value: 'x-shopify-shop-domain' },
          { type: 'body', value: 'order_created' },
          { type: 'body', value: 'product_created' }
        ]
      }
    ]
    
    let bestMatch = { name: 'Unknown', confidence: 'low', score: 0 }
    
    for (const service of services) {
      let score = 0
      for (const pattern of service.patterns) {
        if (pattern.type === 'header' && headerStr.includes(pattern.value)) {
          score += 2
        } else if (pattern.type === 'body' && bodyStr.includes(pattern.value)) {
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
  
  performSecurityAnalysis(headers, body, ip, userAgent) {
    const concerns = []
    const recommendations = []
    let riskScore = 0
    
    // IP Analysis
    if (!ip || ip === 'unknown') {
      concerns.push('Missing or unknown IP address')
      riskScore += 15
    } else {
      if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        // Private IP - lower risk
        riskScore += 5
      } else {
        // Public IP - normal risk
        riskScore += 10
      }
    }
    
    // Header Security
    const securityHeaders = ['x-forwarded-for', 'x-real-ip', 'user-agent']
    const missingHeaders = securityHeaders.filter(header => !headers[header])
    if (missingHeaders.length > 0) {
      concerns.push(`Missing security headers: ${missingHeaders.join(', ')}`)
      riskScore += missingHeaders.length * 5
    }
    
    // Signature Verification
    const signatureHeaders = ['stripe-signature', 'x-razorpay-signature', 'x-hub-signature', 'x-slack-signature']
    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push('No webhook signature verification found')
      recommendations.push('Implement webhook signature verification')
      riskScore += 20
    } else {
      recommendations.push('Webhook signature verification present')
    }
    
    // HTTPS Check
    if (headers['x-forwarded-proto'] !== 'https') {
      concerns.push('Webhook not transmitted over HTTPS')
      recommendations.push('Enforce HTTPS for all webhook endpoints')
      riskScore += 15
    }
    
    // Content-Type Validation
    const contentType = headers['content-type']
    if (!contentType) {
      concerns.push('Missing Content-Type header')
      riskScore += 10
    } else if (contentType.includes('application/json')) {
      recommendations.push('Proper JSON content type detected')
    }
    
    // Payload Security
    if (body && typeof body === 'object') {
      const bodyStr = JSON.stringify(body).toLowerCase()
      if (bodyStr.includes('<script>') || bodyStr.includes('javascript:')) {
        concerns.push('Potential XSS in payload')
        riskScore += 25
      }
      if (bodyStr.includes('sql') || bodyStr.includes('union') || bodyStr.includes('select')) {
        concerns.push('Potential SQL injection patterns')
        riskScore += 20
      }
      
      // Check for sensitive data
      const sensitiveFields = ['password', 'secret', 'token', 'key', 'credit_card', 'ssn']
      const foundSensitive = sensitiveFields.filter(field => 
        Object.keys(body).some(key => key.toLowerCase().includes(field))
      )
      if (foundSensitive.length > 0) {
        concerns.push(`Sensitive data detected: ${foundSensitive.join(', ')}`)
        recommendations.push('Ensure sensitive data is properly encrypted')
        riskScore += foundSensitive.length * 10
      }
    }
    
    // Determine risk level
    let riskLevel = 'low'
    if (riskScore >= 50) riskLevel = 'high'
    else if (riskScore >= 25) riskLevel = 'medium'
    
    return {
      overallScore: Math.max(0, 100 - riskScore),
      riskLevel,
      concerns,
      recommendations,
      threatAssessment: {
        ipReputation: this.assessIPReputation(ip),
        authenticationStrength: hasSignature ? 'strong' : 'weak',
        dataIntegrity: this.assessDataIntegrity(body),
        payloadSafety: this.assessPayloadSafety(body)
      }
    }
  }
  
  analyzeEvent(body, service) {
    const eventType = body.event || body.type || body.action || 'unknown'
    
    const eventTypes = {
      'Stripe': {
        'payment_intent.succeeded': {
          action: 'Payment successfully processed',
          businessImpact: 'Revenue received - customer payment completed',
          priority: 'high',
          automationPotential: 'high'
        },
        'payment_intent.failed': {
          action: 'Payment processing failed',
          businessImpact: 'Revenue lost - payment issue requires attention',
          priority: 'high',
          automationPotential: 'medium'
        },
        'invoice.created': {
          action: 'New invoice generated',
          businessImpact: 'Billing cycle initiated',
          priority: 'medium',
          automationPotential: 'high'
        }
      },
      'GitHub': {
        'push': {
          action: 'Code pushed to repository',
          businessImpact: 'Development workflow update',
          priority: 'medium',
          automationPotential: 'high'
        },
        'pull_request': {
          action: 'Pull request activity',
          businessImpact: 'Code review process initiated',
          priority: 'medium',
          automationPotential: 'medium'
        }
      }
    }
    
    const serviceEvents = eventTypes[service.name] || {}
    const eventDetails = serviceEvents[eventType] || {
      action: `${eventType} event processed`,
      businessImpact: 'Operational event logged',
      priority: 'medium',
      automationPotential: 'low'
    }
    
    return {
      type: eventType,
      ...eventDetails
    }
  }
  
  generateUniqueAnalysisId(headers, body, method, ip) {
    const data = JSON.stringify({ headers, body, method, ip })
    return require('crypto').createHash('md5').update(data).digest('hex').substring(0, 8)
  }
  
  // Helper methods
  assessIPReputation(ip) {
    if (!ip || ip === 'unknown') return 'unknown'
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return 'safe'
    if (ip.startsWith('127.') || ip.startsWith('169.254.')) return 'safe'
    return 'unknown'
  }
  
  assessDataIntegrity(body) {
    if (!body) return 'poor'
    if (body.id || body._id) return 'good'
    if (body.checksum || body.hash) return 'excellent'
    return 'good'
  }
  
  assessPayloadSafety(body) {
    if (!body) return 'safe'
    const bodyStr = JSON.stringify(body).toLowerCase()
    if (bodyStr.includes('<script>') || bodyStr.includes('javascript:') || bodyStr.includes('eval(')) {
      return 'dangerous'
    }
    if (bodyStr.includes('sql') || bodyStr.includes('union') || bodyStr.includes('select')) {
      return 'suspicious'
    }
    return 'safe'
  }
  
  analyzeProtocol(headers) {
    return headers['x-forwarded-proto'] || 'http'
  }
  
  analyzeEndpoint(headers) {
    return headers['host'] || 'unknown'
  }
  
  analyzePayloadSize(body) {
    const size = JSON.stringify(body).length
    if (size < 1000) return 'small'
    if (size < 10000) return 'medium'
    return 'large'
  }
  
  assessComplexity(body) {
    if (!body || typeof body !== 'object') return 'simple'
    const depth = this.getObjectDepth(body)
    if (depth <= 2) return 'simple'
    if (depth <= 4) return 'moderate'
    return 'complex'
  }
  
  getObjectDepth(obj) {
    if (typeof obj !== 'object' || obj === null) return 0
    if (Array.isArray(obj)) return 1 + Math.max(0, ...obj.map(item => this.getObjectDepth(item)))
    return 1 + Math.max(0, ...Object.values(obj).map(val => this.getObjectDepth(val)))
  }
  
  detectPayloadFormat(body) {
    if (typeof body === 'object' && body !== null) return 'json'
    if (typeof body === 'string') return 'text'
    return 'unknown'
  }
  
  analyzeSchema(body) {
    if (typeof body !== 'object' || body === null) return 'no schema'
    return `Object with ${Object.keys(body).length} properties`
  }
  
  countFields(body) {
    if (typeof body !== 'object' || body === null) return 0
    return Object.keys(body).length
  }
  
  detectDataTypes(body) {
    const types = new Set()
    const traverse = (value) => {
      if (value === null) types.add('null')
      else if (Array.isArray(value)) types.add('array')
      else if (typeof value === 'object') {
        types.add('object')
        Object.values(value).forEach(traverse)
      } else types.add(typeof value)
    }
    traverse(body)
    return Array.from(types)
  }
  
  assessBusinessValue(service, eventType) {
    const highValueServices = ['Stripe', 'Razorpay', 'PayPal', 'Shopify']
    return highValueServices.includes(service) ? 'high' : 'medium'
  }
  
  identifyUseCase(service, eventType) {
    if (['Stripe', 'Razorpay', 'PayPal'].includes(service)) return 'payment_processing'
    if (service === 'GitHub') return 'development_workflow'
    if (service === 'Slack') return 'team_communication'
    return 'data_integration'
  }
  
  getServiceDescription(service) {
    const descriptions = {
      'Stripe': 'Payment processing platform for online businesses',
      'Razorpay': 'Indian payment gateway for digital payments',
      'GitHub': 'Web-based Git repository hosting service',
      'Slack': 'Business communication platform',
      'Shopify': 'E-commerce platform for online stores',
      'PayPal': 'Global digital payment solution'
    }
    return descriptions[service] || 'Webhook service for data integration'
  }
  
  getServiceCategory(service) {
    const categories = {
      'Stripe': 'payment',
      'Razorpay': 'payment',
      'PayPal': 'payment',
      'GitHub': 'development',
      'Slack': 'communication',
      'Shopify': 'ecommerce'
    }
    return categories[service] || 'other'
  }
  
  generateSummary(service, eventType, securityAnalysis) {
    const risk = securityAnalysis.riskLevel
    return `${service} webhook ${eventType} event received with ${risk} security risk level`
  }
  
  generateKeyFindings(headers, body, service) {
    const findings = []
    if (service !== 'Unknown') findings.push(`Detected ${service} webhook service`)
    if (Object.keys(body).length > 5) findings.push('Complex payload structure detected')
    if (headers['user-agent']) findings.push('User agent identified')
    return findings
  }
  
  generateRecommendations(securityAnalysis, service) {
    const recommendations = [...securityAnalysis.recommendations]
    if (service !== 'Unknown') {
      recommendations.push(`Implement ${service.toLowerCase()}-specific validation rules`)
    }
    return recommendations
  }
  
  getServiceStatus() {
    const hasValidGeminiKey = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_API_KEY_HERE') && process.env.GEMINI_API_KEY.length > 30
    const hasValidOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 30
    
    return {
      openai: hasValidOpenAIKey,
      gemini: hasValidGeminiKey,
      lastWorkingService: this.lastWorkingService
    }
  }
}

module.exports = new UnifiedAIService()
