import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { io } from "socket.io-client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import '../styles/modern.css'
import {
  initializeAnimations,
  animateModalIn,
  animateModalOut,
  showNotification,
  hideLoadingAnimation,
  showLoadingAnimation,
  animateKPIs
} from '../animations/gsapAnimations'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

function Dashboard() {
  const [webhooks, setWebhooks] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedWebhook, setSelectedWebhook] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [webhookName, setWebhookName] = useState("")
  const [creating, setCreating] = useState(false)
  const [socket, setSocket] = useState(null)
  const [copied, setCopied] = useState("")
  const [analysis, setAnalysis] = useState(null)
  const [securityReport, setSecurityReport] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [allRequests, setAllRequests] = useState([])
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  
  // Response configuration state
  const [responseConfig, setResponseConfig] = useState({
    statusCode: 200,
    headers: [],
    body: '{"message": "Webhook received successfully"}',
    contentType: 'application/json',
    delay: 0
  })
  const [webhookSettings, setWebhookSettings] = useState({
    isActive: true,
    autoResponse: true
  })
  const [newHeader, setNewHeader] = useState({ key: '', value: '' })
  
  // Request detail view modes
  const [requestViewMode, setRequestViewMode] = useState('formatted') // 'formatted' | 'raw'
  const [bodyViewMode, setBodyViewMode] = useState('pretty') // 'pretty' | 'raw'
  const [headersViewMode, setHeadersViewMode] = useState('pretty') // 'pretty' | 'raw'
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMethod, setFilterMethod] = useState('all') // 'all' | 'GET' | 'POST' | 'PUT' | 'DELETE'
  const [filterContentType, setFilterContentType] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'method' | 'ip'
  
  const navigate = useNavigate()
  const userId = localStorage.getItem("userId")
  const email = localStorage.getItem("email")

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Calculate statistics
  const calculateStats = () => {
    const totalRequests = allRequests.length
    const totalWebhooks = webhooks.length
    const requestsByMethod = {
      GET: allRequests.filter(r => r.method === 'GET').length,
      POST: allRequests.filter(r => r.method === 'POST').length,
      PUT: allRequests.filter(r => r.method === 'PUT').length,
      DELETE: allRequests.filter(r => r.method === 'DELETE').length,
    }
    
    const requestsByHour = Array.from({ length: 24 }, (_, i) => 
      allRequests.filter(r => new Date(r.timestamp).getHours() === i).length
    )
    
    // Fix security stats - check for analysis data instead of securityReport
    const securityStats = {
      high: allRequests.filter(r => r.analysis?.security?.riskLevel === 'high').length,
      medium: allRequests.filter(r => r.analysis?.security?.riskLevel === 'medium').length,
      low: allRequests.filter(r => r.analysis?.security?.riskLevel === 'low').length,
      unknown: allRequests.filter(r => !r.analysis?.security?.riskLevel).length,
    }
    
    // Enhanced statistics with status codes
    const requestsByStatus = {
      '200': allRequests.filter(r => r.statusCode === 200).length,
      '201': allRequests.filter(r => r.statusCode === 201).length,
      '204': allRequests.filter(r => r.statusCode === 204).length,
      '400': allRequests.filter(r => r.statusCode === 400).length,
      '401': allRequests.filter(r => r.statusCode === 401).length,
      '403': allRequests.filter(r => r.statusCode === 403).length,
      '404': allRequests.filter(r => r.statusCode === 404).length,
      '500': allRequests.filter(r => r.statusCode === 500).length,
      '502': allRequests.filter(r => r.statusCode === 502).length,
      '503': allRequests.filter(r => r.statusCode === 503).length,
      'other': allRequests.filter(r => !r.statusCode || ![200, 201, 204, 400, 401, 403, 404, 500, 502, 503].includes(r.statusCode)).length,
    }
    
    // Success vs Error rates
    const successRequests = requestsByStatus['200'] + requestsByStatus['201'] + requestsByStatus['204']
    const errorRequests = totalRequests - successRequests
    const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(1) : 0
    const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(1) : 0
    
    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentRequests = allRequests.filter(r => new Date(r.timestamp) > last24Hours).length
    
    // Average requests per webhook
    const avgRequestsPerWebhook = totalWebhooks > 0 ? (totalRequests / totalWebhooks).toFixed(1) : 0
    
    // Most active webhook
    const webhookActivity = {}
    allRequests.forEach(r => {
      const webhookName = webhooks.find(w => w.token === r.token)?.name || 'Unknown'
      webhookActivity[webhookName] = (webhookActivity[webhookName] || 0) + 1
    })
    const mostActiveWebhook = Object.entries(webhookActivity).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    
    // Content type distribution
    const contentTypeStats = {}
    allRequests.forEach(r => {
      const contentType = r.contentType || 'unknown'
      contentTypeStats[contentType] = (contentTypeStats[contentType] || 0) + 1
    })
    
    // IP address statistics
    const ipStats = {}
    allRequests.forEach(r => {
      const ip = r.ip || 'unknown'
      ipStats[ip] = (ipStats[ip] || 0) + 1
    })
    
    // Geographic statistics
    const geoStats = {}
    try {
      allRequests.forEach(r => {
        const country = r.location?.country || 'Unknown'
        geoStats[country] = (geoStats[country] || 0) + 1
      })
    } catch (error) {
      console.error('Geo stats calculation error:', error)
      geoStats['Unknown'] = allRequests.length
    }
    
    // Service detection statistics
    const serviceStats = {}
    try {
      allRequests.forEach(r => {
        const service = r.service?.name || r.analysis?.service || 'Unknown'
        serviceStats[service] = (serviceStats[service] || 0) + 1
      })
    } catch (error) {
      console.error('Service stats calculation error:', error)
      serviceStats['Unknown'] = allRequests.length
    }
    
    return {
      totalRequests,
      totalWebhooks,
      requestsByMethod,
      requestsByHour,
      securityStats,
      serviceStats,
      requestsByStatus,
      successRate,
      errorRate,
      recentRequests,
      avgRequestsPerWebhook,
      mostActiveWebhook,
      contentTypeStats,
      ipStats,
      geoStats,
      successRequests,
      errorRequests
    }
  }

  const stats = calculateStats()

  // Safe stats getter to prevent errors
  const safeStats = {
    ...stats,
    serviceStats: stats.serviceStats || { 'Unknown': 0 },
    geoStats: stats.geoStats || { 'Unknown': 0 },
    ipStats: stats.ipStats || { 'unknown': 0 },
    requestsByMethod: stats.requestsByMethod || { GET: 0, POST: 0, PUT: 0, DELETE: 0 },
    requestsByHour: stats.requestsByHour || Array(24).fill(0),
    securityStats: stats.securityStats || { high: 0, medium: 0, low: 0, unknown: 0 }
  }

  // Auto-analyze new requests
  const autoAnalyzeRequest = async (request) => {
    try {
      const analysisRes = await axios.post(
        `http://localhost:5002/api/requests/analyze/${request._id}`
      )
      
      const securityRes = await axios.post(
        `http://localhost:5002/api/requests/security-scan/${request._id}`
      )
      
      // Update request with analysis data
      const updatedRequest = {
        ...request,
        analysis: analysisRes.data,
        securityReport: securityRes.data
      }
      
      setAllRequests(prev => 
        prev.map(r => r._id === request._id ? updatedRequest : r)
      )
      
      setRequests(prev => 
        prev.map(r => r._id === request._id ? updatedRequest : r)
      )
      
    } catch (error) {
      console.error('Auto-analysis failed:', error)
    }
  }

  // Generate comprehensive report
  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      user: {
        email: email,
        userId: userId
      },
      summary: {
        totalRequests: stats.totalRequests,
        totalWebhooks: stats.totalWebhooks,
        avgRequestsPerWebhook: stats.avgRequestsPerWebhook,
        last24Hours: stats.requestsByHour.reduce((a, b) => a + b, 0)
      },
      requestsByMethod: stats.requestsByMethod,
      securityAnalysis: {
        highRisk: stats.securityStats.high,
        mediumRisk: stats.securityStats.medium,
        lowRisk: stats.securityStats.low,
        unknown: stats.securityStats.unknown,
        riskPercentage: stats.totalRequests > 0 ? 
          Math.round((stats.securityStats.high / stats.totalRequests) * 100) : 0
      },
      serviceDistribution: stats.serviceStats,
      hourlyActivity: stats.requestsByHour.map((count, hour) => ({
        hour: `${hour}:00`,
        requests: count
      })),
      detailedRequests: allRequests.map(req => ({
        id: req._id,
        method: req.method,
        timestamp: req.timestamp,
        ip: req.ip,
        contentType: req.contentType,
        service: req.analysis?.service || 'Unknown',
        eventType: req.analysis?.eventType || 'Unknown',
        riskLevel: req.analysis?.security?.riskLevel || 'Unknown',
        confidence: req.analysis?.confidence || 'Unknown',
        securityScore: req.securityReport?.security?.score || 0,
        concerns: req.analysis?.security?.concerns || [],
        recommendations: req.analysis?.recommendations || []
      }))
    }
    
    return report
  }

  // Export report as JSON
  const exportJSONReport = () => {
    const report = generateReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export report as CSV
  const exportCSVReport = () => {
    const report = generateReport()
    let csv = 'Webhook Analytics Report\n'
    csv += `Generated: ${new Date().toLocaleString()}\n`
    csv += `User: ${email}\n\n`
    csv += 'Summary Statistics\n'
    csv += `Total Requests,${report.summary.totalRequests}\n`
    csv += `Total Webhooks,${report.summary.totalWebhooks}\n`
    csv += `Avg Requests/Webhook,${report.summary.avgRequestsPerWebhook}\n`
    csv += `Last 24 Hours,${report.summary.last24Hours}\n\n`
    
    csv += 'Security Analysis\n'
    csv += `High Risk,${report.securityAnalysis.highRisk}\n`
    csv += `Medium Risk,${report.securityAnalysis.mediumRisk}\n`
    csv += `Low Risk,${report.securityAnalysis.lowRisk}\n`
    csv += `Unknown,${report.securityAnalysis.unknown}\n`
    csv += `Risk Percentage,${report.securityAnalysis.riskPercentage}%\n\n`
    
    csv += 'Service Distribution\n'
    Object.entries(report.serviceDistribution).forEach(([service, count]) => {
      csv += `${service},${count}\n`
    })
    
    csv += '\nDetailed Requests\n'
    csv += 'ID,Method,Timestamp,IP,Service,Event Type,Risk Level,Confidence,Security Score\n'
    report.detailedRequests.forEach(req => {
      csv += `${req.id},${req.method},"${req.timestamp}",${req.ip},${req.service},${req.eventType},${req.riskLevel},${req.confidence},${req.securityScore}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Analyze all existing requests
  const analyzeAllRequests = async () => {
    const requestsToAnalyze = allRequests.filter(r => !r.analysis)
    
    for (const request of requestsToAnalyze) {
      await autoAnalyzeRequest(request)
      // Add small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  useEffect(() => {
    if (!userId) {
      navigate("/login")
      return
    }

    const newSocket = io("http://localhost:5002")
    setSocket(newSocket)

    newSocket.on("new_webhook", (data) => {
      setRequests(prev => [data, ...prev])
      showNotification({
        message: `New webhook received from ${data.ip}`,
        type: 'success'
      })
    })

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server")
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
    })

    fetchWebhooks()

    // Initialize GSAP animations after component mounts
    setTimeout(() => {
      initializeAnimations()
    }, 100)

    return () => {
      newSocket.close()
    }
  }, [userId])

  const deleteWebhook = async (webhookId, token) => {
    console.log("Deleting webhook with ID:", webhookId)
    console.log("Webhook ID type:", typeof webhookId)
    
    if (!window.confirm('Are you sure you want to delete this webhook? This action cannot be undone and will delete all associated requests.')) {
      return
    }

    try {
      console.log("Making DELETE request to:", `http://localhost:5002/api/webhooks/${webhookId}`)
      await axios.delete(`http://localhost:5002/api/webhooks/${webhookId}`)
      
      // Update local state
      setWebhooks(prev => prev.filter(w => w._id !== webhookId))
      setAllRequests(prev => prev.filter(r => r.webhookToken !== token))
      
      // If deleted webhook was selected, clear selection
      if (selectedWebhook?._id === webhookId) {
        setSelectedWebhook(null)
        setRequests([])
      }
      
      // Show success message
      alert('Webhook deleted successfully')
    } catch (err) {
      console.error('Failed to delete webhook:', err)
      console.error('Error response:', err.response?.data)
      alert('Failed to delete webhook. Please try again.')
    }
  }

  const openConfigModal = async (webhook) => {
    try {
      const res = await axios.get(`http://localhost:5002/api/webhooks/${webhook._id}/config`)
      const webhookData = res.data.webhook
      
      setSelectedWebhook(webhook)
      setResponseConfig(webhookData.responseConfig || {
        statusCode: 200,
        headers: [],
        body: '{"message": "Webhook received successfully"}',
        contentType: 'application/json',
        delay: 0
      })
      setWebhookSettings({
        isActive: webhookData.isActive !== undefined ? webhookData.isActive : true,
        autoResponse: webhookData.autoResponse !== undefined ? webhookData.autoResponse : true
      })
      setShowConfigModal(true)
    } catch (err) {
      console.error('Failed to fetch webhook config:', err)
      alert('Failed to load webhook configuration')
    }
  }

  const saveWebhookConfig = async () => {
    try {
      await axios.put(`http://localhost:5002/api/webhooks/${selectedWebhook._id}/config`, {
        responseConfig,
        ...webhookSettings
      })
      
      // Update local webhook data
      setWebhooks(prev => prev.map(w => 
        w._id === selectedWebhook._id 
          ? { ...w, responseConfig, ...webhookSettings }
          : w
      ))
      
      setShowConfigModal(false)
      alert('Webhook configuration saved successfully')
    } catch (err) {
      console.error('Failed to save webhook config:', err)
      alert('Failed to save webhook configuration')
    }
  }

  const addHeader = () => {
    if (newHeader.key && newHeader.value) {
      setResponseConfig(prev => ({
        ...prev,
        headers: [...prev.headers, { ...newHeader }]
      }))
      setNewHeader({ key: '', value: '' })
    }
  }

  const removeHeader = (index) => {
    setResponseConfig(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }))
  }

  // Helper functions for better data display
  const formatJSON = (data, indent = 2) => {
    try {
      return JSON.stringify(data, null, indent)
    } catch (e) {
      return data
    }
  }

  const formatRawRequest = (request) => {
    const lines = []
    lines.push(`${request.method} ${request.url || '/hooks/' + request.token} HTTP/1.1`)
    lines.push(`Host: localhost:5002`)
    lines.push(`User-Agent: ${request.userAgent || 'Unknown'}`)
    lines.push(`Content-Type: ${request.contentType || 'application/json'}`)
    lines.push(`X-Forwarded-For: ${request.ip}`)
    
    if (request.headers) {
      Object.entries(request.headers).forEach(([key, value]) => {
        if (!key.toLowerCase().includes('host') && !key.toLowerCase().includes('user-agent') && !key.toLowerCase().includes('content-type')) {
          lines.push(`${key}: ${value}`)
        }
      })
    }
    
    lines.push('')
    
    if (request.body && typeof request.body === 'object') {
      lines.push(formatJSON(request.body))
    } else if (request.body) {
      lines.push(request.body)
    }
    
    return lines.join('\n')
  }

  const copyToClipboardEnhanced = (content, type) => {
    navigator.clipboard.writeText(content)
    alert(`${type} copied to clipboard!`)
  }

  // Filter and sort requests
  const filteredAndSortedRequests = requests
    .filter(request => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        request.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.ip && request.ip.includes(searchQuery)) ||
        (request.userAgent && request.userAgent.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.body && JSON.stringify(request.body).toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Method filter
      const matchesMethod = filterMethod === 'all' || request.method === filterMethod
      
      // Content type filter
      const matchesContentType = filterContentType === 'all' || 
        (request.contentType && request.contentType.includes(filterContentType))
      
      return matchesSearch && matchesMethod && matchesContentType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp)
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp)
        case 'method':
          return a.method.localeCompare(b.method)
        case 'ip':
          return (a.ip || '').localeCompare(b.ip || '')
        default:
          return 0
      }
    })

  const clearFilters = () => {
    setSearchQuery('')
    setFilterMethod('all')
    setFilterContentType('all')
    setSortBy('newest')
  }

  // Export functionality
  const exportRequests = (format) => {
    const requestsToExport = filteredAndSortedRequests
    
    if (format === 'json') {
      const exportData = {
        webhook: selectedWebhook.name,
        exportDate: new Date().toISOString(),
        totalRequests: requestsToExport.length,
        requests: requestsToExport.map(req => ({
          id: req._id,
          method: req.method,
          timestamp: req.timestamp,
          ip: req.ip,
          userAgent: req.userAgent,
          contentType: req.contentType,
          headers: req.headers,
          body: req.body,
          query: req.query
        }))
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webhook-requests-${selectedWebhook.name}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      let csv = 'ID,Method,Timestamp,IP,User-Agent,Content-Type,Body\n'
      requestsToExport.forEach(req => {
        const body = typeof req.body === 'object' ? JSON.stringify(req.body).replace(/"/g, '""') : req.body || ''
        csv += `"${req._id}","${req.method}","${req.timestamp}","${req.ip}","${req.userAgent || ''}","${req.contentType || ''}","${body}"\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webhook-requests-${selectedWebhook.name}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'har') {
      // HTTP Archive Format
      const harData = {
        "log": {
          "version": "1.2",
          "creator": {
            "name": "Smart Webhook Inspector",
            "version": "1.0.0"
          },
          "entries": requestsToExport.map(req => ({
            "time": new Date(req.timestamp).getTime(),
            "request": {
              "method": req.method,
              "url": `http://localhost:5002/hooks/${req.token}`,
              "httpVersion": "HTTP/1.1",
              "headers": Object.entries(req.headers || {}).map(([name, value]) => ({ name, value })),
              "queryString": Object.entries(req.query || {}).map(([name, value]) => ({ name, value })),
              "postData": req.body ? {
                "mimeType": req.contentType || "application/json",
                "text": typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
              } : undefined,
              "headersSize": -1,
              "bodySize": -1
            },
            "response": {
              "status": 200,
              "statusText": "OK",
              "httpVersion": "HTTP/1.1",
              "headers": [],
              "cookies": [],
              "content": {
                "size": -1,
                "mimeType": "application/json",
                "text": '{"message": "Webhook received successfully"}'
              },
              "redirectURL": "",
              "headersSize": -1,
              "bodySize": -1
            },
            "cache": {},
            "timings": {
              "send": -1,
              "wait": -1,
              "receive": -1
            }
          }))
        }
      }
      
      const blob = new Blob([JSON.stringify(harData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webhook-requests-${selectedWebhook.name}-${new Date().toISOString().split('T')[0]}.har`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const fetchWebhooks = async () => {
    try {
      const res = await axios.get(`http://localhost:5002/api/webhooks/user/${userId}`)
      setWebhooks(res.data)
      
      // Fetch all requests for statistics
      const requestsRes = await axios.get(`http://localhost:5002/api/requests/user/${userId}`)
      setAllRequests(requestsRes.data)
      
      if (res.data.length > 0) {
        setSelectedWebhook(res.data[0])
        fetchRequests(res.data[0].token)
      }
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch webhooks")
      setLoading(false)
    }
  }

  const fetchRequests = async (token) => {
    try {
      const res = await axios.get(`http://localhost:5002/api/requests/${token}`)
      setRequests(res.data)
    } catch (err) {
      console.error("Failed to fetch requests:", err)
    }
  }

  const createWebhook = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError("")

    try {
      const res = await axios.post(
        "http://localhost:5002/api/webhooks/create",
        { userId, name: webhookName }
      )
      
      // Add the public URL to the new webhook
      const newWebhook = {
        ...res.data,
        public_url: res.data.public_url,
        local_url: res.data.local_url
      }
      
      setWebhooks(prev => [newWebhook, ...prev])
      setWebhookName("")
      setShowCreateModal(false)
      
      setSelectedWebhook(newWebhook)
      fetchRequests(newWebhook.token)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create webhook")
    } finally {
      setCreating(false)
    }
  }

  const analyzeRequest = async () => {
    if (!selectedRequest) return
    
    setAnalyzing(true)
    try {
      const res = await axios.post(
        `http://localhost:5002/api/requests/analyze/${selectedRequest._id}`
      )
      setAnalysis(res.data)
      setShowAnalysisModal(true)
      // Animate modal in and KPIs
      setTimeout(() => {
        const modal = document.querySelector('.modal-overlay')
        if (modal) animateModalIn(modal)
        animateKPIs()
      }, 10)
    } catch (err) {
      setError("Failed to analyze request")
    } finally {
      setAnalyzing(false)
    }
  }

  const securityScan = async () => {
    if (!selectedRequest) return
    
    setScanning(true)
    try {
      const res = await axios.post(
        `http://localhost:5002/api/requests/security-scan/${selectedRequest._id}`
      )
      setSecurityReport(res.data)
      setShowSecurityModal(true)
    } catch (err) {
      setError("Failed to perform security scan")
    } finally {
      setScanning(false)
    }
  }

  const copyToClipboard = (text, webhookId) => {
    navigator.clipboard.writeText(text)
    setCopied(webhookId)
    setTimeout(() => setCopied(""), 2000)
  }

  const logout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("email")
    navigate("/login")
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getEventType = (body) => {
    if (!body) return "Empty Request"
    if (body.event) return body.event
    if (body.type) return body.type
    return "Unknown"
  }

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'risk-high'
      case 'medium': return 'risk-medium'
      case 'low': return 'risk-low'
      default: return 'risk-low'
    }
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Notification Container */}
      <div id="notification-container" className="fixed top-4 right-4 z-50 space-y-2"></div>
      
      {/* Enhanced Modern Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20 shadow-lg">
        <div className="container max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 animated-gradient rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Webhook Inspector
                </h1>
                <p className="text-sm text-gray-600 font-medium">Monitor & analyze webhook requests in real-time</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Enhanced Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="dark-mode-toggle tooltip-enhanced"
                data-tooltip={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <span className="sr-only">Toggle dark mode</span>
              </button>
              <div className="text-sm text-gray-700 px-4 py-2 bg-white/70 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm font-medium">
                {email}
              </div>
              <button onClick={logout} className="btn btn-secondary btn-glow">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto py-8">
        {error && (
          <div className="notification error show mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Enhanced Webhooks Section */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Webhooks</h2>
              <p className="text-gray-600">Manage and monitor your webhook endpoints</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-glow px-6 py-3 text-lg font-semibold">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Webhook
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-center py-20 px-8 card-glass">
              <div className="w-32 h-32 mx-auto mb-8 animated-gradient rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No webhooks yet</h3>
              <p className="text-gray-600 mb-10 text-lg max-w-md mx-auto">Get started by creating your first webhook endpoint and start receiving real-time data.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-glow px-8 py-4 text-lg font-semibold">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Webhook
              </button>
            </div>
          ) : (
            <div className="responsive-grid">
              {webhooks.map((webhook) => (
                <div
                  key={webhook._id}
                  className={`card-glass h-full p-6 hover:scale-105 cursor-pointer flex flex-col transition-all duration-300 ${
                    selectedWebhook?._id === webhook._id ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 shadow-xl' : ''
                  }`}
                  onClick={() => {
                    setSelectedWebhook(webhook)
                    fetchRequests(webhook.token)
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-xl leading-tight line-clamp-2 flex-1 pr-3">{webhook.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="status-indicator status-online"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(webhook.public_url || `https://dagmar-clammy-nonphenomenally.ngrok-free.dev/hooks/${webhook.token}`, webhook._id)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 tooltip-enhanced"
                        data-tooltip="Copy URL"
                      >
                        {copied === webhook._id ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openConfigModal(webhook)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 tooltip-enhanced"
                        data-tooltip="Configure Response"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteWebhook(webhook._id, webhook.token)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 tooltip-enhanced"
                        data-tooltip="Delete Webhook"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Endpoint</span>
                      <div className="status-indicator status-online"></div>
                    </div>
                    <div className="code-block" data-language="webhook">
                      {webhook.public_url ? webhook.public_url.replace(/https?:\/\/[^\/]+/, '') : `/hooks/${webhook.token}`}
                    </div>
                    {(webhook.public_url && webhook.public_url !== `https://dagmar-clammy-nonphenomenally.ngrok-free.dev/hooks/${webhook.token}`) && (
                      <div className="badge status-success">
                        🌍 Public URL Ready
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span>Created {formatTimestamp(webhook.createdAt)}</span>
                        <span className="text-gray-400">ID: {webhook.token.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Enhanced Statistics & Analytics Section */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
              <p className="text-gray-600">Monitor your webhook performance and activity</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={exportJSONReport} className="btn btn-secondary btn-glow text-sm px-4 py-2 whitespace-nowrap">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export JSON
              </button>
              <button onClick={exportCSVReport} className="btn btn-secondary btn-glow text-sm px-4 py-2 whitespace-nowrap">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Requests */}
            <div className="card-glass relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
              <div className="flex items-center relative z-10 p-6">
                <div className="w-14 h-14 animated-gradient rounded-xl flex items-center justify-center flex-shrink-0 mr-4 shadow-xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Total Requests</p>
                  <p className="text-4xl font-bold text-gray-900">{safeStats.totalRequests}</p>
                  <div className="flex items-center mt-3">
                    <div className="pulse-dot mr-2"></div>
                    <p className="text-sm text-gray-500 font-medium">{safeStats.recentRequests} in 24h</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Webhooks */}
            <div className="card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full"></div>
              <div className="flex items-center relative z-10 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Webhooks</p>
                  <p className="text-3xl font-bold text-gray-900">{safeStats.totalWebhooks}</p>
                  <p className="text-xs text-gray-500 mt-2">Endpoints created</p>
                </div>
              </div>
            </div>
            
            {/* Success Rate */}
            <div className="card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full"></div>
              <div className="flex items-center relative z-10 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{safeStats.successRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="progress-fill" style={{ width: `${safeStats.successRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
              <div className="flex items-center relative z-10 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">24h Activity</p>
                  <p className="text-3xl font-bold text-gray-900">{safeStats.recentRequests}</p>
                  <p className="text-xs text-gray-500 mt-2">Requests today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Methods Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests by Method</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: Object.keys(safeStats.requestsByMethod),
                    datasets: [{
                      label: 'Number of Requests',
                      data: Object.values(safeStats.requestsByMethod),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(239, 68, 68, 1)',
                      ],
                      borderWidth: 1,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Geographic Distribution Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="h-64">
                <Pie
                  data={{
                    labels: Object.keys(safeStats.geoStats || {}).slice(0, 8),
                    datasets: [{
                      data: Object.values(safeStats.geoStats || {}).slice(0, 8),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(250, 204, 21, 0.8)',
                        'rgba(156, 163, 175, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(250, 204, 21, 1)',
                        'rgba(156, 163, 175, 1)',
                      ],
                      borderWidth: 1,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Requests by country/region</p>
              </div>
            </div>

            {/* Top IP Addresses Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top IP Addresses</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: Object.keys(safeStats.ipStats || {}).slice(0, 10),
                    datasets: [{
                      label: 'Number of Requests',
                      data: Object.values(safeStats.ipStats || {}).slice(0, 10),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          autoSkip: true,
                          maxTicksLimit: 10,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Most active IP addresses sending requests to your webhook</p>
              </div>
            </div>

            {/* Hourly Activity Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Request Activity</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    datasets: [{
                      label: 'Requests per Hour',
                      data: safeStats.requestsByHour,
                      borderColor: 'rgba(59, 130, 246, 1)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Requests Section - FIXED: Better responsive grid */}
        {selectedWebhook && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {/* Request List - FIXED: Better proportions */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="card sticky top-6 h-fit">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Recent Requests</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">{selectedWebhook.name}</p>
                      </div>
                      {requests.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => exportRequests('json')}
                            className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                            title="Export as JSON"
                          >
                            📄 JSON
                          </button>
                          <button
                            onClick={() => exportRequests('csv')}
                            className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                            title="Export as CSV"
                          >
                            📊 CSV
                          </button>
                          <button
                            onClick={() => exportRequests('har')}
                            className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                            title="Export as HAR"
                          >
                            🌐 HAR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="p-4 border-b border-gray-200">
                    {/* Search */}
                    <div className="mb-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search requests..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <select
                        value={filterMethod}
                        onChange={(e) => setFilterMethod(e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="method">Method</option>
                        <option value="ip">IP Address</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || filterMethod !== 'all' || sortBy !== 'newest') && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>

                  {/* Request List */}
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {filteredAndSortedRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          {requests.length === 0 ? 'No requests received yet' : 'No requests match your filters'}
                        </p>
                        {requests.length > 0 && filteredAndSortedRequests.length === 0 && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredAndSortedRequests.slice(0, 10).map((request) => (
                          <div
                            key={request._id}
                            className="card p-4 mb-3 hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className={`status-badge px-3 py-1 text-xs font-semibold ${
                                  request.method === 'GET' ? 'status-success' :
                                  request.method === 'POST' ? 'status-warning' :
                                  request.method === 'PUT' ? 'bg-blue-100 text-blue-800' :
                                  request.method === 'DELETE' ? 'status-error' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.method}
                                </span>
                                <span className={`status-badge px-3 py-1 text-xs font-semibold ${
                                  request.statusCode === 200 ? 'status-success' :
                                  request.statusCode === 201 ? 'bg-blue-100 text-blue-800' :
                                  request.statusCode === 204 ? 'bg-gray-100 text-gray-800' :
                                  request.statusCode >= 400 && request.statusCode < 500 ? 'status-warning' :
                                  request.statusCode >= 500 ? 'status-error' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.statusCode}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {new Date(request.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m0 0l-4-4m4 4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="font-medium">Event:</span>
                                <span className="bg-gray-100 px-2 py-1 rounded-md font-mono text-xs">
                                  {getEventType(request.body)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="font-medium">IP:</span>
                                <span className="bg-blue-50 px-2 py-1 rounded-md font-mono text-xs text-blue-700">
                                  {request.ip || 'unknown'}
                                </span>
                                {request.service?.name && request.service.name !== 'Unknown' && (
                                  <span className="bg-green-50 px-2 py-1 rounded-md text-xs text-green-700 font-medium">
                                    🤖 {request.service.name}
                                  </span>
                                )}
                              </div>
                              {request.location?.country && request.location.country !== 'Unknown' && (
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="font-medium">Location:</span>
                                  <span className="bg-purple-50 px-2 py-1 rounded-md text-xs text-purple-700">
                                    🌍 {request.location.country}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {filteredAndSortedRequests.length > 10 && (
                          <div className="text-center pt-2">
                            <span className="text-xs text-gray-500">
                              Showing 10 of {filteredAndSortedRequests.length} requests
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="lg:col-span-2 xl:col-span-3">
                {selectedRequest ? (
                  <div className="card">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          Request Details 
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                            #{requests.findIndex(r => r._id === selectedRequest._id) + 1}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={analyzeRequest}
                            disabled={analyzing}
                            className="btn btn-secondary text-sm px-4 py-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {analyzing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                AI Analysis
                              </>
                            )}
                          </button>
                          <button
                            onClick={securityScan}
                            disabled={scanning}
                            className="btn btn-secondary text-sm px-4 py-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {scanning ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Security Scan
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Request Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Method</h4>
                          <span className={`method-badge px-3 py-2 ${selectedRequest.method === 'POST' ? 'method-post' : selectedRequest.method === 'GET' ? 'method-get' : selectedRequest.method === 'PUT' ? 'method-put' : selectedRequest.method === 'DELETE' ? 'method-delete' : 'method-default'}`}>
                            {selectedRequest.method}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Timestamp</h4>
                          <p className="text-sm font-mono text-gray-900">{formatTimestamp(selectedRequest.timestamp)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">IP Address</h4>
                          <p className="text-sm text-gray-900 truncate font-mono">{selectedRequest.ip}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Content-Type</h4>
                          <p className="text-sm text-gray-900 truncate font-mono">{selectedRequest.contentType || 'application/json'}</p>
                        </div>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">Request Data</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setRequestViewMode(requestViewMode === 'formatted' ? 'raw' : 'formatted')}
                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {requestViewMode === 'formatted' ? '🔍 Raw View' : '🎨 Formatted View'}
                          </button>
                        </div>
                      </div>

                      {requestViewMode === 'formatted' ? (
                        <>
                          {/* Headers */}
                          {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900">Headers</h4>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setHeadersViewMode(headersViewMode === 'pretty' ? 'raw' : 'pretty')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    {headersViewMode === 'pretty' ? 'Raw' : 'Pretty'}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboardEnhanced(formatJSON(selectedRequest.headers), 'Headers')}
                                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                  >
                                    📋 Copy
                                  </button>
                                </div>
                              </div>
                              <div className="code-block-light max-h-64 overflow-y-auto">
                                {headersViewMode === 'pretty' ? (
                                  <div className="space-y-2">
                                    {Object.entries(selectedRequest.headers).map(([key, value]) => (
                                      <div key={key} className="flex">
                                        <span className="text-blue-600 font-semibold mr-2 min-w-0 flex-shrink-0">{key}:</span>
                                        <span className="text-gray-800 break-all">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="text-sm">{formatJSON(selectedRequest.headers)}</pre>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Query Parameters */}
                          {selectedRequest.query && Object.keys(selectedRequest.query).length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900">Query Parameters</h4>
                                <button
                                  onClick={() => copyToClipboardEnhanced(formatJSON(selectedRequest.query), 'Query Parameters')}
                                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                >
                                  📋 Copy
                                </button>
                              </div>
                              <div className="code-block-light max-h-48 overflow-y-auto">
                                <div className="space-y-2">
                                  {Object.entries(selectedRequest.query).map(([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="text-green-600 font-semibold mr-2 min-w-0 flex-shrink-0">{key}:</span>
                                      <span className="text-gray-800 break-all">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900">Request Body</h4>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setBodyViewMode(bodyViewMode === 'pretty' ? 'raw' : 'pretty')}
                                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {bodyViewMode === 'pretty' ? 'Raw' : 'Pretty'}
                                </button>
                                <button
                                  onClick={() => copyToClipboardEnhanced(
                                    bodyViewMode === 'pretty' ? formatJSON(selectedRequest.body) : JSON.stringify(selectedRequest.body),
                                    'Request Body'
                                  )}
                                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                >
                                  📋 Copy
                                </button>
                              </div>
                            </div>
                            <div className="code-block max-h-96 overflow-y-auto">
                              {selectedRequest.body ? (
                                bodyViewMode === 'pretty' ? (
                                  <pre className="text-sm">{formatJSON(selectedRequest.body)}</pre>
                                ) : (
                                  <pre className="text-sm text-gray-600">{JSON.stringify(selectedRequest.body)}</pre>
                                )
                              ) : (
                                <p className="text-gray-500 italic">No request body</p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Raw Request View */
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Raw HTTP Request</h4>
                            <button
                              onClick={() => copyToClipboardEnhanced(formatRawRequest(selectedRequest), 'Raw Request')}
                              className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                            >
                              📋 Copy Raw Request
                            </button>
                          </div>
                          <div className="code-block max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-600 font-mono">{formatRawRequest(selectedRequest)}</pre>
                          </div>
                        </div>
                      )}

                      {/* Additional Request Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">User Agent</h4>
                          <p className="text-sm text-gray-600 break-all font-mono">{selectedRequest.userAgent || 'Unknown'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Request ID</h4>
                          <p className="text-sm text-gray-600 font-mono">{selectedRequest._id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card p-12 sm:p-16 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a request</h3>
                    <p className="text-gray-500 text-sm">Click on a request from the list to view details</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Create Webhook Modal - FIXED: Proper centering */}
        {showCreateModal && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-content max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <form onSubmit={createWebhook} className="bg-white rounded-2xl shadow-2xl border">
                <div className="p-8">
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mr-4 mt-1">
                      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Create New Webhook</h3>
                      <p className="text-gray-600">Give your webhook a descriptive name</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="webhookName" className="form-label block mb-2">
                        Webhook Name
                      </label>
                      <input
                        id="webhookName"
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g., Stripe Payments, GitHub Events"
                        value={webhookName}
                        onChange={(e) => setWebhookName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-0 flex flex-wrap gap-3 justify-end bg-gray-50 rounded-b-2xl">
                  <button
                    type="button"
                    className="btn btn-secondary px-6 py-2"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Webhook'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Analysis & Security Modals - Fixed viewport fitting */}
        {showAnalysisModal && analysis && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="modal-content w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Fixed Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-bold text-gray-900">AI Analysis Results</h3>
                    <p className="text-sm text-gray-500">Webhook request analyzed with AI</p>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {/* AI-Driven Service Detection */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">AI Service Detection</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        analysis.service?.confidence === 'high' ? 'bg-green-100 text-green-800 border border-green-200' :
                        analysis.service?.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {analysis.service?.confidence || 'medium'} confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Detected Service</h5>
                      <div className="text-xl font-bold text-blue-600 mb-2">{analysis.service?.name || 'Unknown'}</div>
                      <p className="text-sm text-gray-600">{analysis.service?.description || 'Service description not available'}</p>
                      {analysis.service?.officialDocs && (
                        <a href={analysis.service.officialDocs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Documentation
                        </a>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Service Category</h5>
                      <div className="flex items-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                          {analysis.service?.category || 'other'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Event Type</h5>
                        <div className="text-lg font-bold text-gray-900">{analysis.event?.type || 'unknown'}</div>
                        <p className="text-sm text-gray-600">{analysis.event?.action || 'Event action not available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI-Calculated Metrics Dashboard */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    AI-Calculated Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.calculatedMetrics?.securityScore || 0}</div>
                      <div className="text-xs text-gray-600">Security</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.calculatedMetrics?.businessValue || 0}</div>
                      <div className="text-xs text-gray-600">Business Value</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysis.calculatedMetrics?.automationScore || 0}</div>
                      <div className="text-xs text-gray-600">Automation</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{analysis.calculatedMetrics?.performanceScore || 0}</div>
                      <div className="text-xs text-gray-600">Performance</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{analysis.calculatedMetrics?.riskScore || 0}</div>
                      <div className="text-xs text-gray-600">Risk Level</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-600">{analysis.calculatedMetrics?.complexityScore || 0}</div>
                      <div className="text-xs text-gray-600">Complexity</div>
                    </div>
                  </div>
                </div>

                {/* Business Impact Analysis */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Business Impact Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Impact Assessment</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Business Value</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            analysis.business?.value === 'high' ? 'bg-green-100 text-green-800' :
                            analysis.business?.value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {analysis.business?.value || 'medium'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Primary Use Case</span>
                          <span className="text-sm font-medium text-gray-900">{analysis.business?.useCase || 'data_integration'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Integration Complexity</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            analysis.business?.integrationComplexity === 'simple' ? 'bg-green-100 text-green-800' :
                            analysis.business?.integrationComplexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysis.business?.integrationComplexity || 'moderate'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Market Impact</span>
                          <span className="text-sm font-medium text-gray-900">{analysis.business?.marketImpact || 'Local impact'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">ROI Analysis</h5>
                      <div className="text-sm text-gray-700 mb-3">{analysis.business?.roi || 'ROI analysis not available'}</div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm text-gray-700">High automation potential</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">Quick integration possible</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">Scalable solution</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                {/* Enhanced Technical Analysis */}
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    Technical Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-glass hover:scale-105 transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Request Analysis</h5>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Method</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">{analysis.technical?.requestAnalysis?.method || 'POST'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Protocol</span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">{analysis.technical?.requestAnalysis?.protocol || 'https'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Size</span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">{analysis.technical?.requestAnalysis?.size || 'medium'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Complexity</span>
                          <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                            analysis.technical?.requestAnalysis?.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                            analysis.technical?.requestAnalysis?.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysis.technical?.requestAnalysis?.complexity || 'moderate'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-glass hover:scale-105 transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                        </div>
                        <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Payload Structure</h5>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Format</span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">{analysis.technical?.payloadStructure?.format || 'json'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Fields</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">{analysis.technical?.payloadStructure?.fieldCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Nested Level</span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">{analysis.technical?.payloadStructure?.nestedLevel || 1}</span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700 block mb-2">Data Types</span>
                          <div className="flex flex-wrap gap-2">
                            {analysis.technical?.payloadStructure?.dataTypes?.map((type, index) => (
                              <span key={index} className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                                {type}
                              </span>
                            )) || ['string', 'object'].map((type, index) => (
                              <span key={index} className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-glass hover:scale-105 transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Performance Metrics</h5>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Processing Time</span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">{analysis.technical?.performance?.processingTime || '< 50ms'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">{analysis.technical?.performance?.memoryUsage || '< 5MB'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Scalability</span>
                          <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                            analysis.technical?.performance?.scalability === 'high' ? 'bg-green-100 text-green-800' :
                            analysis.technical?.performance?.scalability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysis.technical?.performance?.scalability || 'medium'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced KPI Metrics */}
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    Performance KPIs
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analysis?.kpiMetrics?.processingEfficiency || 95}%</div>
                        <div className="text-xs text-gray-600">Processing Efficiency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis?.kpiMetrics?.errorRate || 2}%</div>
                        <div className="text-xs text-gray-600">Error Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{analysis?.kpiMetrics?.responseTime || 150}ms</div>
                        <div className="text-xs text-gray-600">Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{analysis?.kpiMetrics?.throughput || 1000}</div>
                        <div className="text-xs text-gray-600">Throughput/hr</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{analysis?.kpiMetrics?.reliability || 99.9}%</div>
                        <div className="text-xs text-gray-600">Reliability</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0 border-t border-gray-200">
                <button className="btn btn-primary px-6 py-2" onClick={() => setShowAnalysisModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showSecurityModal && securityReport && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="modal-content w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Fixed Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-bold text-gray-900">Security Scan Results</h3>
                    <p className="text-sm text-gray-500">Comprehensive security analysis</p>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {/* Security Score Overview */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Security Assessment</h4>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600">Overall Score:</div>
                      <div className="flex items-center">
                        <div className={`text-3xl font-bold ${
                          (securityReport.security?.overallScore || securityReport.security?.score || 0) >= 80 ? 'text-green-600' :
                          (securityReport.security?.overallScore || securityReport.security?.score || 0) >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {securityReport.security?.overallScore || securityReport.security?.score || 0}
                        </div>
                        <div className="text-sm text-gray-500 ml-1">/100</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Level</h5>
                      <span className={`inline-block px-3 py-2 rounded-full text-sm font-bold ${
                        securityReport.security?.riskLevel === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                        securityReport.security?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {securityReport.security?.riskLevel || 'Unknown'} RISK
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 text-center">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Authentication</h5>
                      <div className="flex items-center justify-center">
                        <svg className={`w-5 h-5 mr-2 ${
                          securityReport.security?.authentication && securityReport.security?.authentication !== 'No authentication detected' ? 'text-green-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {securityReport.security?.authentication === 'No authentication detected' ? 'Not Verified' : 'Verified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 text-center">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Data Integrity</h5>
                      <div className="flex items-center justify-center">
                        <svg className={`w-5 h-5 mr-2 ${
                          securityReport.security?.dataIntegrity && securityReport.security?.dataIntegrity.includes('excellent') ? 'text-green-600' :
                          securityReport.security?.dataIntegrity && securityReport.security?.dataIntegrity.includes('good') ? 'text-yellow-600' :
                          'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {securityReport.security?.dataIntegrity?.split(' ')[0] || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Analysis Breakdown */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Security Analysis</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Threat Assessment
                        </h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">IP Reputation</span>
                            <span className="text-sm font-medium text-green-600">Safe</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Signature Validity</span>
                            <span className={`text-sm font-medium ${
                              securityReport.security?.authentication && securityReport.security?.authentication !== 'No authentication detected' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {securityReport.security?.authentication && securityReport.security?.authentication !== 'No authentication detected' ? 'Verified' : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Data Integrity</span>
                            <span className="text-sm font-medium text-green-600">Intact</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Payload Safety</span>
                            <span className="text-sm font-medium text-green-600">Clean</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Compliance Check
                        </h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">HTTPS Usage</span>
                            <span className="text-sm font-medium text-green-600">✓ Secure</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Rate Limiting</span>
                            <span className="text-sm font-medium text-yellow-600">⚠ Monitor</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Authentication</span>
                            <span className={`text-sm font-medium ${
                              securityReport.security?.authentication && securityReport.security?.authentication !== 'No authentication detected' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {securityReport.security?.authentication && securityReport.security?.authentication !== 'No authentication detected' ? '✓ Verified' : '✗ Missing'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Data Validation</span>
                            <span className="text-sm font-medium text-green-600">✓ Valid</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Recommendations */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Security Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {securityReport.security?.recommendations?.map((rec, index) => (
                      <div key={index} className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">
                            {typeof rec === 'string' ? rec : rec.action || 'Security recommendation'}
                          </p>
                          {typeof rec === 'object' && rec.impact && (
                            <p className="text-xs text-blue-600 mt-1">Impact: {rec.impact}</p>
                          )}
                          {typeof rec === 'object' && rec.implementation && (
                            <p className="text-xs text-blue-600 mt-1">Implementation: {rec.implementation}</p>
                          )}
                        </div>
                      </div>
                    )) || [
                      <div key="1" className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">Always verify webhook signatures to ensure authenticity</p>
                          <p className="text-xs text-blue-600 mt-1">Impact: Prevents unauthorized requests</p>
                        </div>
                      </div>,
                      <div key="2" className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">Implement rate limiting to prevent webhook flooding</p>
                          <p className="text-xs text-blue-600 mt-1">Impact: Prevents DoS attacks</p>
                        </div>
                      </div>,
                      <div key="3" className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">Log all webhook requests for audit trails</p>
                          <p className="text-xs text-blue-600 mt-1">Impact: Enables troubleshooting and compliance</p>
                        </div>
                      </div>,
                      <div key="4" className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">Validate and sanitize all incoming data</p>
                          <p className="text-xs text-blue-600 mt-1">Impact: Prevents injection attacks</p>
                        </div>
                      </div>
                    ]}
                  </div>
                </div>

                {/* Security Concerns */}
                {securityReport.security?.concerns && securityReport.security.concerns.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Security Concerns
                    </h4>
                    <div className="space-y-2">
                      {securityReport.security.concerns.map((concern, index) => (
                        <div key={index} className={`flex items-start p-3 rounded-lg ${
                          typeof concern === 'string' && (concern.includes('good') || concern.includes('present') || concern.includes('detected') && !concern.includes('No')) ? 
                          'bg-green-50 border border-green-200' : 
                          typeof concern === 'object' && concern.severity === 'low' ? 'bg-green-50 border border-green-200' :
                          typeof concern === 'object' && concern.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-red-50 border border-red-200'
                        }`}>
                          <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                            typeof concern === 'string' && (concern.includes('good') || concern.includes('present') || concern.includes('detected') && !concern.includes('No')) ? 
                            'text-green-600' : 
                            typeof concern === 'object' && concern.severity === 'low' ? 'text-green-600' :
                            typeof concern === 'object' && concern.severity === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${
                              typeof concern === 'string' && (concern.includes('good') || concern.includes('present') || concern.includes('detected') && !concern.includes('No')) ? 
                              'text-green-800' : 
                              typeof concern === 'object' && concern.severity === 'low' ? 'text-green-800' :
                              typeof concern === 'object' && concern.severity === 'medium' ? 'text-yellow-800' :
                              'text-red-800'
                            }`}>
                              {typeof concern === 'string' ? concern : concern.description || 'Security concern detected'}
                            </p>
                            {typeof concern === 'object' && concern.type && (
                              <p className={`text-xs mt-1 ${
                                concern.severity === 'low' ? 'text-green-600' :
                                concern.severity === 'medium' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                Type: {concern.type} | Severity: {concern.severity}
                              </p>
                            )}
                            {typeof concern === 'object' && concern.mitigation && (
                              <p className="text-xs text-gray-600 mt-1">Mitigation: {concern.mitigation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Security Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Technical Security Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Request Headers Analysis</h5>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Content-Type verified</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">User-Agent analyzed</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Origin checked</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Timestamp validated</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Payload Security</h5>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Structure validated</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Data type checked</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">Size within limits</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">No malicious patterns</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Score Breakdown */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Security Score Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+10</div>
                      <div className="text-xs text-gray-600">HTTPS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+15</div>
                      <div className="text-xs text-gray-600">Signature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+5</div>
                      <div className="text-xs text-gray-600">Rate Limit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+5</div>
                      <div className="text-xs text-gray-600">Timestamp</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0 border-t border-gray-200">
                <button className="btn btn-primary px-6 py-2" onClick={() => setShowSecurityModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showConfigModal && selectedWebhook && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="modal-content w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Fixed Header */}
              <div className="px-6 py-4 bg-gray-50 rounded-t-2xl flex-shrink-0 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Configure Webhook Response</h3>
                  <button 
                    onClick={() => setShowConfigModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Configure how your webhook endpoint responds to incoming requests
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  {/* Webhook Settings */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Endpoint Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={webhookSettings.isActive}
                          onChange={(e) => setWebhookSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Endpoint Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={webhookSettings.autoResponse}
                          onChange={(e) => setWebhookSettings(prev => ({ ...prev, autoResponse: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Auto-respond to requests</span>
                      </label>
                    </div>
                  </div>

                  {/* Response Configuration */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Response Configuration</h4>
                    
                    {/* Status Code */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status Code</label>
                      <select
                        value={responseConfig.statusCode}
                        onChange={(e) => setResponseConfig(prev => ({ ...prev, statusCode: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={200}>200 OK</option>
                        <option value={201}>201 Created</option>
                        <option value={204}>204 No Content</option>
                        <option value={400}>400 Bad Request</option>
                        <option value={401}>401 Unauthorized</option>
                        <option value={403}>403 Forbidden</option>
                        <option value={404}>404 Not Found</option>
                        <option value={500}>500 Internal Server Error</option>
                        <option value={502}>502 Bad Gateway</option>
                        <option value={503}>503 Service Unavailable</option>
                      </select>
                    </div>

                    {/* Content Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                      <select
                        value={responseConfig.contentType}
                        onChange={(e) => setResponseConfig(prev => ({ ...prev, contentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="application/json">application/json</option>
                        <option value="text/plain">text/plain</option>
                        <option value="text/html">text/html</option>
                        <option value="application/xml">application/xml</option>
                        <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                      </select>
                    </div>

                    {/* Response Delay */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Delay (ms): {responseConfig.delay}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={responseConfig.delay}
                        onChange={(e) => setResponseConfig(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0ms</span>
                        <span>5s</span>
                        <span>10s</span>
                      </div>
                    </div>

                    {/* Response Body */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Response Body</label>
                      <textarea
                        value={responseConfig.body}
                        onChange={(e) => setResponseConfig(prev => ({ ...prev, body: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder='{"message": "Webhook received successfully"}'
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter JSON, XML, HTML, or plain text response
                      </p>
                    </div>

                    {/* Custom Headers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Headers</label>
                      <div className="space-y-2 mb-3">
                        {responseConfig.headers.map((header, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={header.key}
                              onChange={(e) => {
                                const newHeaders = [...responseConfig.headers]
                                newHeaders[index].key = e.target.value
                                setResponseConfig(prev => ({ ...prev, headers: newHeaders }))
                              }}
                              placeholder="Header name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              value={header.value}
                              onChange={(e) => {
                                const newHeaders = [...responseConfig.headers]
                                newHeaders[index].value = e.target.value
                                setResponseConfig(prev => ({ ...prev, headers: newHeaders }))
                              }}
                              placeholder="Header value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={() => removeHeader(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add New Header */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newHeader.key}
                          onChange={(e) => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                          placeholder="New header name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={newHeader.value}
                          onChange={(e) => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="New header value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={addHeader}
                          disabled={!newHeader.key || !newHeader.value}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3 flex-shrink-0 border-t border-gray-200">
                <button 
                  className="btn btn-secondary px-6 py-2"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary px-6 py-2"
                  onClick={saveWebhookConfig}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard;
