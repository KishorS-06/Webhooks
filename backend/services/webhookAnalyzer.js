class WebhookAnalyzer {
  constructor() {
    this.servicePatterns = {
      'stripe': {
        headers: ['stripe-signature', 'stripe-version'],
        body: ['object', 'type', 'data', 'id', 'created'],
        events: ['payment_intent.succeeded', 'payment_intent.payment_failed', 'invoice.payment_succeeded', 'customer.created']
      },
      'razorpay': {
        headers: ['x-razorpay-signature', 'x-razorpay-event-id'],
        body: ['event', 'payload', 'entity', 'payment'],
        events: ['payment.captured', 'payment.failed', 'invoice.paid', 'order.paid']
      },
      'github': {
        headers: ['x-github-event', 'x-github-delivery', 'x-hub-signature'],
        body: ['ref', 'repository', 'sender', 'action', 'pull_request', 'issue'],
        events: ['push', 'pull_request', 'issues', 'release', 'fork']
      },
      'slack': {
        headers: ['x-slack-request-timestamp', 'x-slack-signature', 'x-slack-retry-num'],
        body: ['type', 'challenge', 'event', 'team', 'user', 'channel'],
        events: ['url_verification', 'message', 'app_mention', 'reaction_added', 'member_joined_channel']
      },
      'paypal': {
        headers: ['paypal-auth-algo', 'paypal-transmission-id', 'paypal-cert-id'],
        body: ['event_type', 'resource', 'resource_type', 'create_time'],
        events: ['PAYMENT.AUTHORIZATION.CREATED', 'PAYMENT.SALE.COMPLETED', 'INVOICING.INVOICE.CREATED']
      },
      'shopify': {
        headers: ['x-shopify-hmac-sha256', 'x-shopify-shop-domain', 'x-shopify-topic'],
        body: ['id', 'admin_graphql_api_id', 'created_at', 'customer', 'order'],
        events: ['orders/create', 'orders/updated', 'orders/cancelled', 'customers/create']
      },
      'twilio': {
        headers: ['x-twilio-signature', 'x-twilio-webhook-timestamp'],
        body: ['MessageSid', 'MessageStatus', 'From', 'To', 'Body'],
        events: ['message.sent', 'message.delivered', 'message.failed', 'message.received']
      }
    }
  }

  analyzeWebhook(requestData) {
    const { headers, body, method, ip, userAgent } = requestData
    
    // Normalize headers to lowercase for comparison
    const normalizedHeaders = {}
    for (const key in headers) {
      normalizedHeaders[key.toLowerCase()] = headers[key]
    }

    // Detect service
    const serviceDetection = this.detectService(normalizedHeaders, body)
    
    // Analyze security
    const securityAnalysis = this.analyzeSecurity(normalizedHeaders, body, ip, userAgent)
    
    // Analyze data structure
    const dataAnalysis = this.analyzeDataStructure(body)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(serviceDetection, securityAnalysis, body)

    return {
      service: serviceDetection.service,
      eventType: serviceDetection.eventType,
      confidence: serviceDetection.confidence,
      security: securityAnalysis,
      analysis: {
        summary: this.generateSummary(serviceDetection, securityAnalysis, body),
        dataStructure: dataAnalysis,
        keyFields: this.extractKeyFields(body, serviceDetection.service)
      },
      recommendations,
      timestamp: new Date().toISOString()
    }
  }

  detectService(headers, body) {
    let detectedService = 'Unknown'
    let confidence = 'low'
    let eventType = 'Unknown'
    
    for (const [serviceName, pattern] of Object.entries(this.servicePatterns)) {
      let matches = 0
      let totalChecks = 0
      
      // Check headers
      pattern.headers.forEach(header => {
        totalChecks++
        if (headers[header.toLowerCase()]) {
          matches++
        }
      })
      
      // Check body structure
      pattern.body.forEach(field => {
        totalChecks++
        if (body && typeof body === 'object' && this.hasNestedField(body, field)) {
          matches++
        }
      })
      
      // Check event types
      if (body && body.event && pattern.events.includes(body.event)) {
        matches += 2 // Extra weight for exact event match
      }
      
      const matchPercentage = totalChecks > 0 ? matches / totalChecks : 0
      
      if (matchPercentage > 0.6) {
        detectedService = serviceName
        confidence = matchPercentage > 0.8 ? 'high' : 'medium'
        eventType = body.event || body.type || 'Unknown'
        break
      }
    }
    
    return {
      service: detectedService,
      eventType,
      confidence
    }
  }

  analyzeSecurity(headers, body, ip, userAgent) {
    const concerns = []
    const recommendations = []
    
    // Check for signature verification
    const signatureHeaders = [
      'x-signature', 'x-hub-signature', 'stripe-signature',
      'x-razorpay-signature', 'x-slack-signature',
      'paypal-auth-algo', 'x-shopify-hmac-sha256'
    ]
    
    const hasSignature = signatureHeaders.some(header => headers[header])
    if (!hasSignature) {
      concerns.push("No webhook signature verification found")
      recommendations.push("Implement webhook signature verification for security")
    }
    
    // Check for HTTPS
    if (headers['x-forwarded-proto'] !== 'https') {
      concerns.push("Webhook not received over HTTPS")
      recommendations.push("Configure webhook URLs to use HTTPS")
    }
    
    // Check content type
    const contentType = headers['content-type']
    if (!contentType) {
      concerns.push("Missing Content-Type header")
      recommendations.push("Always include Content-Type header")
    }
    
    // Check for sensitive data exposure
    if (body && typeof body === 'object') {
      const sensitiveFields = this.findSensitiveFields(body)
      if (sensitiveFields.length > 0) {
        concerns.push(`Potential sensitive data exposure: ${sensitiveFields.join(', ')}`)
        recommendations.push("Ensure sensitive data is properly handled and encrypted")
      }
    }
    
    // Check IP reputation (basic check)
    if (ip) {
      if (this.isPrivateIP(ip)) {
        concerns.push("Webhook received from private IP address")
        recommendations.push("Verify webhook source is legitimate")
      }
    }
    
    // Check user agent
    if (!userAgent || userAgent.length < 10) {
      concerns.push("Missing or suspicious User-Agent header")
      recommendations.push("Ensure proper User-Agent header is included")
    }
    
    // Calculate risk level
    let riskLevel = 'low'
    if (concerns.length > 3) {
      riskLevel = 'high'
    } else if (concerns.length > 1) {
      riskLevel = 'medium'
    }
    
    // Calculate security score
    const score = Math.max(0, 100 - (concerns.length * 15))
    
    return {
      riskLevel,
      concerns,
      recommendations,
      score
    }
  }

  analyzeDataStructure(body) {
    if (!body || typeof body !== 'object') {
      return "Invalid or empty payload"
    }
    
    const keys = Object.keys(body)
    const values = Object.values(body)
    
    // Analyze structure complexity
    const hasNestedObjects = values.some(val => typeof val === 'object' && val !== null)
    const hasArrays = values.some(val => Array.isArray(val))
    const hasStrings = values.some(val => typeof val === 'string')
    const hasNumbers = values.some(val => typeof val === 'number')
    
    let structure = "Simple object"
    if (hasNestedObjects || hasArrays) {
      structure = "Complex nested structure"
    }
    
    return {
      type: structure,
      fieldCount: keys.length,
      fields: keys,
      hasNestedObjects,
      hasArrays,
      dataTypes: {
        strings: hasStrings,
        numbers: hasNumbers,
        objects: hasNestedObjects,
        arrays: hasArrays
      }
    }
  }

  extractKeyFields(body, service) {
    if (!body || typeof body !== 'object') {
      return []
    }
    
    const commonFields = {
      'stripe': ['id', 'amount', 'currency', 'status', 'customer', 'payment_method'],
      'github': ['ref', 'repository', 'sender', 'action', 'pull_request'],
      'slack': ['type', 'user', 'channel', 'team', 'event'],
      'paypal': ['event_type', 'resource', 'create_time', 'id'],
      'razorpay': ['event', 'payment', 'order', 'invoice'],
      'shopify': ['id', 'customer', 'order', 'created_at'],
      'twilio': ['MessageSid', 'From', 'To', 'Body', 'Status']
    }
    
    const serviceFields = commonFields[service] || []
    const bodyKeys = Object.keys(body)
    
    return serviceFields.filter(field => 
      bodyKeys.some(key => key.toLowerCase().includes(field.toLowerCase()))
    )
  }

  generateRecommendations(serviceDetection, securityAnalysis, body) {
    const recommendations = []
    
    // Service-specific recommendations
    switch (serviceDetection.service) {
      case 'stripe':
        recommendations.push("Verify webhook signatures using Stripe's webhook signing secret")
        recommendations.push("Handle idempotency for payment events")
        break
      case 'github':
        recommendations.push("Validate GitHub webhook signatures")
        recommendations.push("Implement proper event filtering for high-activity repos")
        break
      case 'slack':
        recommendations.push("Respond to URL verification challenges promptly")
        recommendations.push("Implement rate limiting for Slack bot responses")
        break
      case 'paypal':
        recommendations.push("Verify PayPal webhook authenticity")
        recommendations.push("Handle IPN notifications idempotently")
        break
    }
    
    // Security recommendations
    if (securityAnalysis.riskLevel === 'high') {
      recommendations.push("Review and implement all security recommendations immediately")
    }
    
    // General recommendations
    recommendations.push("Implement proper error handling and logging")
    recommendations.push("Set up monitoring for webhook delivery failures")
    recommendations.push("Document webhook payload structure for your team")
    
    return recommendations
  }

  generateSummary(serviceDetection, securityAnalysis, body) {
    const service = serviceDetection.service
    const risk = securityAnalysis.riskLevel
    
    if (service === 'Unknown') {
      return `Unidentified webhook request with ${risk} security risk. Manual analysis recommended.`
    }
    
    const summaries = {
      'stripe': `Stripe payment webhook event detected with ${risk} security risk. Review payment processing logic.`,
      'github': `GitHub repository webhook detected with ${risk} security risk. Check repository access controls.`,
      'slack': `Slack integration webhook with ${risk} security risk. Verify bot permissions and workspace security.`,
      'paypal': `PayPal payment notification with ${risk} security risk. Validate payment processing workflow.`,
      'razorpay': `Razorpay payment webhook with ${risk} security risk. Review payment handling procedures.`,
      'shopify': `Shopify e-commerce webhook with ${risk} security risk. Check order processing logic.`,
      'twilio': `Twilio messaging webhook with ${risk} security risk. Verify message handling security.`
    }
    
    return summaries[service] || `Webhook request from ${service} with ${risk} security risk.`
  }

  hasNestedField(obj, field) {
    if (typeof obj !== 'object' || obj === null) {
      return false
    }
    
    for (const key in obj) {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        return true
      }
      if (typeof obj[key] === 'object' && this.hasNestedField(obj[key], field)) {
        return true
      }
    }
    
    return false
  }

  findSensitiveFields(obj, path = '') {
    const sensitiveFields = []
    const sensitiveKeywords = [
      'password', 'secret', 'token', 'key', 'credit_card', 'cvv',
      'ssn', 'social_security', 'bank_account', 'api_key', 'private_key'
    ]
    
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (sensitiveKeywords.some(keyword => 
        key.toLowerCase().includes(keyword) || 
        currentPath.toLowerCase().includes(keyword)
      )) {
        sensitiveFields.push(currentPath)
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sensitiveFields.push(...this.findSensitiveFields(obj[key], currentPath))
      }
    }
    
    return [...new Set(sensitiveFields)] // Remove duplicates
  }

  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ]
    
    return privateRanges.some(range => range.test(ip))
  }
}

module.exports = new WebhookAnalyzer()
