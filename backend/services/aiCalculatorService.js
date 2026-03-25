const { GoogleGenerativeAI } = require("@google/generative-ai")

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE")

class AICalculatorService {
  constructor() {
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
        console.log(`✅ Initialized AI Calculator model: ${this.models[i].name}`)
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

  async calculateDashboardMetrics(requests, webhooks) {
    console.log('🧮 Starting AI-powered dashboard metrics calculation...')
    
    try {
      // Try AI calculation first
      const aiMetrics = await this.tryAICalculation(requests, webhooks)
      if (aiMetrics) {
        console.log('✅ AI-powered metrics calculation successful!')
        return aiMetrics
      }
    } catch (error) {
      console.error('❌ AI calculation failed:', error.message)
    }
    
    // Fallback to intelligent calculation
    console.log('🧠 Using intelligent calculation fallback...')
    return this.performIntelligentCalculation(requests, webhooks)
  }

  async tryAICalculation(requests, webhooks) {
    const prompt = `You are an expert data analyst for a webhook dashboard. Calculate comprehensive metrics from this webhook data:

WEBHOOK DATA:
- Total Requests: ${requests.length}
- Total Webhooks: ${webhooks.length}
- Requests: ${JSON.stringify(requests.slice(0, 10), null, 2)}

Calculate and return AI-powered metrics in this exact JSON format:
{
  "overview": {
    "totalRequests": number,
    "successRate": percentage,
    "errorRate": percentage,
    "avgResponseTime": milliseconds,
    "activeWebhooks": number,
    "healthScore": 0-100,
    "trend": "improving/stable/declining"
  },
  "security": {
    "highRiskCount": number,
    "mediumRiskCount": number,
    "lowRiskCount": number,
    "criticalThreats": number,
    "securityScore": 0-100,
    "vulnerabilityCount": number,
    "blockedAttempts": number,
    "riskTrend": "increasing/stable/decreasing"
  },
  "performance": {
    "avgResponseTime": milliseconds,
    "p95ResponseTime": milliseconds,
    "throughput": requests_per_minute,
    "errorRate": percentage,
    "uptime": percentage,
    "performanceScore": 0-100,
    "bottlenecks": ["identified_bottlenecks"]
  },
  "analytics": {
    "requestsByHour": [hourly_data_24_hours],
    "requestsByMethod": {"GET": count, "POST": count, "PUT": count, "DELETE": count},
    "requestsByStatus": {"200": count, "400": count, "401": count, "404": count, "500": count},
    "topEndpoints": [{"endpoint": "/api/hooks", "count": number}],
    "dataVolume": bytes,
    "peakHour": hour_with_most_requests
  },
  "business": {
    "activeUsers": number,
    "engagementRate": percentage,
    "conversionRate": percentage,
    "revenueImpact": currency_value,
    "costSavings": currency_value,
    "automationLevel": percentage,
    "efficiencyGain": percentage
  },
  "predictions": {
    "nextHourTraffic": predicted_requests,
    "peakLoadTime": hour,
    "growthRate": percentage,
    "capacityUtilization": percentage,
    "scalingNeeded": boolean,
    "recommendedActions": ["actionable_recommendations"]
  },
  "insights": {
    "keyFindings": ["important_insights"],
    "recommendations": ["actionable_recommendations"],
    "alerts": ["urgent_alerts"],
    "opportunities": ["improvement_opportunities"]
  }
}

CRITICAL: Respond ONLY with valid JSON - no markdown, no explanations.`

    const model = await this.getCurrentModel()
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    const metrics = JSON.parse(cleanText)
    
    return this.validateAndEnhanceMetrics(metrics, requests, webhooks)
  }

  validateAndEnhanceMetrics(metrics, requests, webhooks) {
    // Ensure all required fields exist and are calculated correctly
    if (!metrics.overview) {
      metrics.overview = this.calculateOverviewMetrics(requests, webhooks)
    }
    
    if (!metrics.security) {
      metrics.security = this.calculateSecurityMetrics(requests)
    }
    
    if (!metrics.performance) {
      metrics.performance = this.calculatePerformanceMetrics(requests)
    }
    
    if (!metrics.analytics) {
      metrics.analytics = this.calculateAnalyticsMetrics(requests)
    }
    
    if (!metrics.business) {
      metrics.business = this.calculateBusinessMetrics(requests, webhooks)
    }
    
    if (!metrics.predictions) {
      metrics.predictions = this.calculatePredictions(requests)
    }
    
    if (!metrics.insights) {
      metrics.insights = this.generateInsights(requests, metrics)
    }
    
    return metrics
  }

  performIntelligentCalculation(requests, webhooks) {
    console.log('🧠 Performing intelligent metrics calculation...')
    
    return {
      overview: this.calculateOverviewMetrics(requests, webhooks),
      security: this.calculateSecurityMetrics(requests),
      performance: this.calculatePerformanceMetrics(requests),
      analytics: this.calculateAnalyticsMetrics(requests),
      business: this.calculateBusinessMetrics(requests, webhooks),
      predictions: this.calculatePredictions(requests),
      insights: this.generateInsights(requests, null)
    }
  }

  calculateOverviewMetrics(requests, webhooks) {
    const totalRequests = requests.length
    const successRequests = requests.filter(r => (r.statusCode >= 200 && r.statusCode < 300)).length
    const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(1) : 0
    const errorRate = totalRequests > 0 ? (((totalRequests - successRequests) / totalRequests) * 100).toFixed(1) : 0
    
    // Calculate average response time
    const responseTimes = requests.map(r => r.responseTime || 100).filter(rt => rt > 0)
    const avgResponseTime = responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
      : 100
    
    // Calculate health score
    const healthScore = Math.max(0, Math.min(100, 
      (successRate * 0.6) + (100 - errorRate) * 0.4
    ))
    
    // Determine trend based on recent activity
    const recentRequests = requests.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    const olderRequests = requests.filter(r => 
      new Date(r.timestamp) <= new Date(Date.now() - 24 * 60 * 60 * 1000) &&
      new Date(r.timestamp) > new Date(Date.now() - 48 * 60 * 60 * 1000)
    )
    
    let trend = 'stable'
    if (recentRequests.length > olderRequests.length * 1.2) trend = 'improving'
    else if (recentRequests.length < olderRequests.length * 0.8) trend = 'declining'
    
    return {
      totalRequests,
      successRate: parseFloat(successRate),
      errorRate: parseFloat(errorRate),
      avgResponseTime: parseInt(avgResponseTime),
      activeWebhooks: webhooks.length,
      healthScore: Math.round(healthScore),
      trend
    }
  }

  calculateSecurityMetrics(requests) {
    const securityAnalysis = requests.map(r => r.analysis?.security || { riskLevel: 'unknown' })
    
    const highRiskCount = securityAnalysis.filter(s => s.riskLevel === 'high').length
    const mediumRiskCount = securityAnalysis.filter(s => s.riskLevel === 'medium').length
    const lowRiskCount = securityAnalysis.filter(s => s.riskLevel === 'low').length
    const criticalThreats = highRiskCount > 0 ? Math.floor(highRiskCount / 3) : 0
    
    // Calculate security score
    const totalAnalyzed = securityAnalysis.filter(s => s.riskLevel !== 'unknown').length
    const securityScore = totalAnalyzed > 0 
      ? Math.round(((lowRiskCount * 100 + mediumRiskCount * 50 + highRiskCount * 0) / totalAnalyzed))
      : 75
    
    const vulnerabilityCount = highRiskCount + mediumRiskCount
    const blockedAttempts = requests.filter(r => r.statusCode === 401 || r.statusCode === 403).length
    
    // Determine risk trend
    const recentSecurity = requests.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).map(r => r.analysis?.security?.riskLevel || 'unknown')
    
    const recentHighRisk = recentSecurity.filter(s => s === 'high').length
    let riskTrend = 'stable'
    if (recentHighRisk > highRiskCount * 0.5) riskTrend = 'increasing'
    else if (recentHighRisk < highRiskCount * 0.2) riskTrend = 'decreasing'
    
    return {
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      criticalThreats,
      securityScore,
      vulnerabilityCount,
      blockedAttempts,
      riskTrend
    }
  }

  calculatePerformanceMetrics(requests) {
    const responseTimes = requests.map(r => r.responseTime || 100).filter(rt => rt > 0)
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 100
    
    // Calculate 95th percentile
    const sortedTimes = responseTimes.sort((a, b) => a - b)
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p95ResponseTime = sortedTimes[p95Index] || 200
    
    // Calculate throughput (requests per minute)
    const timeSpan = requests.length > 0 
      ? (new Date(Math.max(...requests.map(r => new Date(r.timestamp)))) - 
         new Date(Math.min(...requests.map(r => new Date(r.timestamp))))) / 60000
      : 1
    const throughput = timeSpan > 0 ? Math.round(requests.length / timeSpan) : 0
    
    const errorRate = this.calculateOverviewMetrics(requests, []).errorRate
    const uptime = 100 - errorRate
    
    // Calculate performance score
    const performanceScore = Math.max(0, Math.min(100,
      (100 - Math.min(avgResponseTime / 10, 50)) + // Response time component
      (100 - errorRate * 2) + // Error rate component
      (uptime * 0.3) // Uptime component
    ))
    
    // Identify bottlenecks
    const bottlenecks = []
    if (avgResponseTime > 500) bottlenecks.push('High response times')
    if (errorRate > 10) bottlenecks.push('High error rate')
    if (throughput < 1) bottlenecks.push('Low throughput')
    
    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      throughput,
      errorRate: parseFloat(errorRate),
      uptime: parseFloat(uptime),
      performanceScore: Math.round(performanceScore),
      bottlenecks
    }
  }

  calculateAnalyticsMetrics(requests) {
    // Requests by hour (24 hours)
    const requestsByHour = Array.from({ length: 24 }, (_, i) => {
      const hourRequests = requests.filter(r => 
        new Date(r.timestamp).getHours() === i
      ).length
      return hourRequests
    })
    
    // Requests by method
    const requestsByMethod = {
      GET: requests.filter(r => r.method === 'GET').length,
      POST: requests.filter(r => r.method === 'POST').length,
      PUT: requests.filter(r => r.method === 'PUT').length,
      DELETE: requests.filter(r => r.method === 'DELETE').length
    }
    
    // Requests by status
    const requestsByStatus = {
      '200': requests.filter(r => r.statusCode === 200).length,
      '201': requests.filter(r => r.statusCode === 201).length,
      '400': requests.filter(r => r.statusCode === 400).length,
      '401': requests.filter(r => r.statusCode === 401).length,
      '404': requests.filter(r => r.statusCode === 404).length,
      '500': requests.filter(r => r.statusCode === 500).length
    }
    
    // Top endpoints
    const endpointCounts = {}
    requests.forEach(r => {
      const endpoint = r.endpoint || '/unknown'
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1
    })
    
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }))
    
    // Calculate data volume
    const dataVolume = requests.reduce((total, r) => {
      const size = JSON.stringify(r.body || {}).length + JSON.stringify(r.headers || {}).length
      return total + size
    }, 0)
    
    // Find peak hour
    const peakHour = requestsByHour.indexOf(Math.max(...requestsByHour))
    
    return {
      requestsByHour,
      requestsByMethod,
      requestsByStatus,
      topEndpoints,
      dataVolume,
      peakHour
    }
  }

  calculateBusinessMetrics(requests, webhooks) {
    // Active users (unique IPs)
    const activeUsers = new Set(requests.map(r => r.ip).filter(Boolean)).size
    
    // Engagement rate (requests with analysis)
    const analyzedRequests = requests.filter(r => r.analysis).length
    const engagementRate = requests.length > 0 
      ? ((analyzedRequests / requests.length) * 100).toFixed(1)
      : 0
    
    // Conversion rate (successful webhooks)
    const successfulWebhooks = webhooks.filter(w => w.active !== false).length
    const conversionRate = webhooks.length > 0 
      ? ((successfulWebhooks / webhooks.length) * 100).toFixed(1)
      : 0
    
    // Revenue impact (based on payment webhooks)
    const paymentRequests = requests.filter(r => 
      r.analysis?.service === 'Stripe' || r.analysis?.service === 'Razorpay'
    )
    const revenueImpact = paymentRequests.reduce((total, r) => {
      const amount = r.body?.amount || r.body?.payment?.amount || 0
      return total + (amount / 100) // Convert from cents
    }, 0)
    
    // Cost savings (automation)
    const automatedRequests = analyzedRequests
    const costSavings = automatedRequests * 0.50 // $0.50 per automated request
    
    // Automation level
    const automationLevel = requests.length > 0 
      ? ((automatedRequests / requests.length) * 100).toFixed(1)
      : 0
    
    // Efficiency gain
    const efficiencyGain = Math.min(95, automationLevel * 1.5)
    
    return {
      activeUsers,
      engagementRate: parseFloat(engagementRate),
      conversionRate: parseFloat(conversionRate),
      revenueImpact: Math.round(revenueImpact * 100) / 100,
      costSavings: Math.round(costSavings * 100) / 100,
      automationLevel: parseFloat(automationLevel),
      efficiencyGain: parseFloat(efficiencyGain)
    }
  }

  calculatePredictions(requests) {
    const recentHourly = this.calculateAnalyticsMetrics(requests).requestsByHour.slice(-6)
    const avgRecentHourly = recentHourly.reduce((a, b) => a + b, 0) / recentHourly.length
    
    // Predict next hour traffic
    const nextHourTraffic = Math.round(avgRecentHourly * 1.1) // 10% growth assumption
    
    // Peak load time
    const hourlyData = this.calculateAnalyticsMetrics(requests).requestsByHour
    const peakLoadTime = hourlyData.indexOf(Math.max(...hourlyData))
    
    // Growth rate
    const lastWeek = requests.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    const previousWeek = requests.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
      new Date(r.timestamp) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    const growthRate = previousWeek > 0 
      ? (((lastWeek - previousWeek) / previousWeek) * 100).toFixed(1)
      : 0
    
    // Capacity utilization
    const currentThroughput = this.calculatePerformanceMetrics(requests).throughput
    const maxCapacity = 1000 // Assumed max capacity
    const capacityUtilization = Math.min(100, (currentThroughput / maxCapacity) * 100)
    
    const scalingNeeded = capacityUtilization > 80
    
    const recommendedActions = []
    if (scalingNeeded) recommendedActions.push('Scale up infrastructure')
    if (growthRate > 20) recommendedActions.push('Prepare for growth')
    if (nextHourTraffic > 100) recommendedActions.push('Monitor system performance')
    
    return {
      nextHourTraffic,
      peakLoadTime,
      growthRate: parseFloat(growthRate),
      capacityUtilization: Math.round(capacityUtilization),
      scalingNeeded,
      recommendedActions
    }
  }

  generateInsights(requests, metrics) {
    const insights = {
      keyFindings: [],
      recommendations: [],
      alerts: [],
      opportunities: []
    }
    
    if (requests.length === 0) {
      insights.keyFindings.push('No webhook requests recorded yet')
      insights.recommendations.push('Start sending webhook requests to see analytics')
      return insights
    }
    
    // Generate key findings
    const overview = metrics?.overview || this.calculateOverviewMetrics(requests, [])
    if (overview.successRate > 95) {
      insights.keyFindings.push('Excellent success rate maintained')
    } else if (overview.successRate < 80) {
      insights.keyFindings.push('Success rate needs improvement')
    }
    
    const security = metrics?.security || this.calculateSecurityMetrics(requests)
    if (security.securityScore > 90) {
      insights.keyFindings.push('Strong security posture maintained')
    } else if (security.securityScore < 70) {
      insights.keyFindings.push('Security concerns identified')
    }
    
    // Generate recommendations
    if (overview.errorRate > 5) {
      insights.recommendations.push('Investigate and reduce error rate')
    }
    
    if (security.highRiskCount > 0) {
      insights.recommendations.push('Address high-risk security issues')
    }
    
    // Generate alerts
    if (overview.healthScore < 70) {
      insights.alerts.push('System health score below threshold')
    }
    
    if (security.criticalThreats > 0) {
      insights.alerts.push('Critical security threats detected')
    }
    
    // Generate opportunities
    const business = metrics?.business || this.calculateBusinessMetrics(requests, [])
    if (business.automationLevel < 50) {
      insights.opportunities.push('Increase automation to improve efficiency')
    }
    
    if (business.engagementRate < 80) {
      insights.opportunities.push('Improve webhook engagement and analysis')
    }
    
    return insights
  }
}

module.exports = new AICalculatorService()
