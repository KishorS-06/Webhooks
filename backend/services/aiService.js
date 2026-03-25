const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class AIService {
  constructor() {
    // Use correct model initialization without version parameter
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  }

  async analyzeWebhook(requestData) {
    try {
      const { headers, body, method, ip, userAgent } = requestData
      
      const prompt = `Analyze this webhook request and provide insights:

Request Details:
- Method: ${method}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Headers: ${JSON.stringify(headers, null, 2)}
- Body: ${JSON.stringify(body, null, 2)}

Please provide:
1. Service identification (if possible)
2. Event type analysis
3. Security assessment
4. Data structure analysis
5. Recommendations for handling

Format your response as JSON with the following structure:
{
  "service": "identified service or 'Unknown'",
  "eventType": "event type or 'Unknown'",
  "confidence": "high/medium/low",
  "security": {
    "riskLevel": "low/medium/high",
    "concerns": ["list of security concerns"],
    "recommendations": ["list of security recommendations"]
  },
  "analysis": {
    "summary": "brief summary of what this webhook represents",
    "dataStructure": "analysis of the payload structure",
    "keyFields": ["important fields in the payload"]
  },
  "recommendations": ["handling recommendations"]
}

Respond only with valid JSON, no additional text.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch (parseError) {
        return {
          service: "Analysis Failed",
          eventType: "Unknown",
          confidence: "low",
          security: {
            riskLevel: "medium",
            concerns: ["AI analysis failed"],
            recommendations: ["Manual review required"]
          },
          analysis: {
            summary: "AI analysis encountered an error",
            dataStructure: "Unable to analyze",
            keyFields: []
          },
          recommendations: ["Please review the webhook data manually"]
        }
      }
    } catch (error) {
      console.error("AI Analysis Error:", error)
      return {
        service: "Analysis Error",
        eventType: "Unknown",
        confidence: "low",
        security: {
          riskLevel: "medium",
          concerns: ["AI service unavailable"],
          recommendations: ["Try again later"]
        },
        analysis: {
          summary: "AI analysis service is currently unavailable",
          dataStructure: "Unable to analyze",
          keyFields: []
        },
        recommendations: ["Please try again later"]
      }
    }
  }

  async detectWebhookService(requestData) {
    const { headers, body } = requestData
    
    const serviceSignatures = {
      'stripe': {
        headers: ['stripe-signature'],
        body: ['object', 'type', 'data'],
        events: ['payment_intent.succeeded', 'invoice.payment_succeeded']
      },
      'razorpay': {
        headers: ['x-razorpay-signature'],
        body: ['event', 'payload'],
        events: ['payment.captured', 'invoice.paid']
      },
      'github': {
        headers: ['x-github-event', 'x-github-delivery'],
        body: ['ref', 'repository', 'sender'],
        events: ['push', 'pull_request', 'issues']
      },
      'slack': {
        headers: ['x-slack-request-timestamp', 'x-slack-signature'],
        body: ['type', 'challenge', 'event'],
        events: ['url_verification', 'message', 'app_mention']
      },
      'paypal': {
        headers: ['paypal-auth-algo', 'paypal-transmission-id'],
        body: ['event_type', 'resource'],
        events: ['PAYMENT.AUTHORIZATION.CREATED', 'PAYMENT.SALE.COMPLETED']
      }
    }

    let detectedService = 'Unknown'
    let confidence = 'low'

    for (const [service, signature] of Object.entries(serviceSignatures)) {
      let matches = 0
      
      signature.headers.forEach(header => {
        if (headers[header.toLowerCase()]) {
          matches++
        }
      })
      
      signature.body.forEach(field => {
        if (body && typeof body === 'object' && body[field]) {
          matches++
        }
      })

      if (body.event && signature.events.includes(body.event)) {
        matches++
      }

      const matchPercentage = matches / (signature.headers.length + signature.body.length)
      
      if (matchPercentage > 0.6) {
        detectedService = service
        confidence = matchPercentage > 0.8 ? 'high' : 'medium'
        break
      }
    }

    return {
      service: detectedService,
      confidence
    }
  }

  async securityScan(requestData) {
    const { headers, body, ip, userAgent } = requestData
    const concerns = []
    const recommendations = []

    if (!ip || ip === 'undefined') {
      concerns.push("Missing IP address")
    }

    const securityHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'user-agent'
    ]

    securityHeaders.forEach(header => {
      if (!headers[header]) {
        concerns.push(`Missing security header: ${header}`)
      }
    })

    const contentType = headers['content-type']
    if (!contentType) {
      concerns.push("Missing Content-Type header")
      recommendations.push("Always include Content-Type header")
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

    if (body && typeof body === 'object') {
      const sensitiveFields = ['password', 'secret', 'token', 'key', 'credit_card']
      const foundFields = sensitiveFields.filter(field => 
        Object.keys(body).some(key => key.toLowerCase().includes(field))
      )
      
      if (foundFields.length > 0) {
        concerns.push(`Potential sensitive data in payload: ${foundFields.join(', ')}`)
        recommendations.push("Ensure sensitive data is properly handled and encrypted")
      }
    }

    let riskLevel = 'low'
    if (concerns.length > 3) {
      riskLevel = 'high'
    } else if (concerns.length > 1) {
      riskLevel = 'medium'
    }

    return {
      riskLevel,
      concerns,
      recommendations,
      score: Math.max(0, 100 - (concerns.length * 15))
    }
  }
}

module.exports = new AIService()