const axios = require('axios')

// Geographic location detection using IP
exports.getLocationFromIP = async (ip) => {
  try {
    if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Local', latitude: 0, longitude: 0 }
    }

    const response = await axios.get(`http://ip-api.com/json/${ip}`)
    const data = response.data
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        isp: data.isp || 'Unknown',
        timezone: data.timezone || 'Unknown'
      }
    }
    
    return { country: 'Unknown', city: 'Unknown', latitude: 0, longitude: 0 }
  } catch (error) {
    console.error('Location detection error:', error)
    return { country: 'Unknown', city: 'Unknown', latitude: 0, longitude: 0 }
  }
}

// AI-powered service detection
exports.detectService = (headers, body, userAgent) => {
  const signature = {
    service: 'Unknown',
    confidence: 0,
    details: {}
  }

  // GitHub Webhooks
  if (headers['x-github-event'] || headers['x-github-delivery'] || userAgent?.includes('GitHub-Hookshot')) {
    signature.service = 'GitHub'
    signature.confidence = 95
    signature.details = {
      event: headers['x-github-event'],
      delivery: headers['x-github-delivery'],
      signature: headers['x-hub-signature']
    }
  }

  // Stripe Webhooks
  else if (headers['stripe-signature'] || userAgent?.includes('Stripe')) {
    signature.service = 'Stripe'
    signature.confidence = 90
    signature.details = {
      signature: headers['stripe-signature'],
      eventType: body?.type || 'Unknown'
    }
  }

  // Slack Webhooks
  else if (userAgent?.includes('Slackbot') || body?.type === 'message' || body?.team_id) {
    signature.service = 'Slack'
    signature.confidence = 85
    signature.details = {
      eventType: body?.type || 'message',
      teamId: body?.team_id
    }
  }

  // Discord Webhooks
  else if (body?.id && body?.type && userAgent?.includes('Discord')) {
    signature.service = 'Discord'
    signature.confidence = 85
    signature.details = {
      type: body?.type,
      id: body?.id
    }
  }

  // Shopify Webhooks
  else if (headers['x-shopify-topic'] || headers['x-shopify-shop-domain']) {
    signature.service = 'Shopify'
    signature.confidence = 90
    signature.details = {
      topic: headers['x-shopify-topic'],
      shop: headers['x-shopify-shop-domain']
    }
  }

  // Twilio Webhooks
  else if (body?.MessageSid || body?.CallSid || userAgent?.includes('TwilioProxy')) {
    signature.service = 'Twilio'
    signature.confidence = 85
    signature.details = {
      messageSid: body?.MessageSid,
      callSid: body?.CallSid
    }
  }

  // PayPal Webhooks
  else if (headers['paypal-auth-algo'] || headers['paypal-transmission-id'] || body?.event_type) {
    signature.service = 'PayPal'
    signature.confidence = 90
    signature.details = {
      transmissionId: headers['paypal-transmission-id'],
      eventType: body?.event_type
    }
  }

  // Mailgun Webhooks
  else if (headers['x-mailgun-event'] || body?.event_data) {
    signature.service = 'Mailgun'
    signature.confidence = 85
    signature.details = {
      event: headers['x-mailgun-event']
    }
  }

  // SendGrid Webhooks
  else if (headers['x-twilio-signature'] || body?.event) {
    signature.service = 'SendGrid'
    signature.confidence = 80
    signature.details = {
      event: body?.event
    }
  }

  // Generic REST API
  else if (headers['content-type']?.includes('application/json') && Object.keys(body || {}).length > 0) {
    signature.service = 'REST API'
    signature.confidence = 60
    signature.details = {
      contentType: headers['content-type'],
      bodySize: JSON.stringify(body).length
    }
  }

  // Browser Request
  else if (userAgent?.includes('Mozilla') || userAgent?.includes('Chrome') || userAgent?.includes('Safari')) {
    signature.service = 'Browser'
    signature.confidence = 70
    signature.details = {
      userAgent: userAgent
    }
  }

  return signature
}

// Request pattern analysis
exports.analyzeRequestPattern = (requests) => {
  if (!requests || requests.length === 0) {
    return {
      frequency: 'Low',
      pattern: 'Irregular',
      risk: 'Low',
      insights: []
    }
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentHour = requests.filter(r => new Date(r.timestamp) > oneHourAgo)
  const recentDay = requests.filter(r => new Date(r.timestamp) > oneDayAgo)

  // Frequency analysis
  let frequency = 'Low'
  if (recentHour.length > 100) frequency = 'Very High'
  else if (recentHour.length > 50) frequency = 'High'
  else if (recentHour.length > 10) frequency = 'Medium'

  // Pattern detection
  const intervals = []
  for (let i = 1; i < recentHour.length; i++) {
    const diff = new Date(recentHour[i].timestamp).getTime() - new Date(recentHour[i-1].timestamp).getTime()
    intervals.push(diff)
  }

  let pattern = 'Irregular'
  if (intervals.length > 5) {
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
    
    if (variance < avgInterval * 0.1) pattern = 'Regular'
    else if (variance < avgInterval * 0.5) pattern = 'Semi-Regular'
  }

  // Risk assessment
  let risk = 'Low'
  const uniqueIPs = new Set(recentHour.map(r => r.ip)).size
  const errorRate = recentHour.filter(r => r.statusCode >= 400).length / recentHour.length

  if (frequency === 'Very High' && uniqueIPs === 1) risk = 'High'
  else if (errorRate > 0.5) risk = 'High'
  else if (frequency === 'High' && errorRate > 0.2) risk = 'Medium'
  else if (frequency === 'Very High') risk = 'Medium'

  // Insights
  const insights = []
  if (frequency === 'Very High') insights.push('Very high request frequency detected')
  if (uniqueIPs === 1) insights.push('All requests from single IP address')
  if (errorRate > 0.3) insights.push('High error rate detected')
  if (pattern === 'Regular') insights.push('Regular request pattern detected')
  if (recentHour.length > 200) insights.push('Potential DDoS attack')

  return {
    frequency,
    pattern,
    risk,
    insights,
    stats: {
      requestsPerHour: recentHour.length,
      requestsPerDay: recentDay.length,
      uniqueIPs,
      errorRate: (errorRate * 100).toFixed(1)
    }
  }
}

// Anomaly detection
exports.detectAnomalies = (request, historicalData = []) => {
  const anomalies = []

  // Check for unusual headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip']
  const hasProxyHeaders = suspiciousHeaders.some(header => request.headers[header])
  if (hasProxyHeaders) {
    anomalies.push({
      type: 'Proxy Detected',
      severity: 'Medium',
      description: 'Request appears to be coming through a proxy'
    })
  }

  // Check for unusual user agent
  if (!request.userAgent || request.userAgent.length < 10) {
    anomalies.push({
      type: 'Suspicious User Agent',
      severity: 'Low',
      description: 'Unusual or missing user agent'
    })
  }

  // Check for large payload
  const bodySize = JSON.stringify(request.body || {}).length
  if (bodySize > 100000) { // 100KB
    anomalies.push({
      type: 'Large Payload',
      severity: 'Medium',
      description: `Unusually large payload: ${(bodySize / 1024).toFixed(1)}KB`
    })
  }

  // Check frequency anomaly
  if (historicalData.length > 10) {
    const recentRequests = historicalData.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    )
    
    if (recentRequests.length > 50) {
      anomalies.push({
        type: 'High Frequency',
        severity: 'High',
        description: `Unusually high request frequency: ${recentRequests.length} in 5 minutes`
      })
    }
  }

  return anomalies
}
